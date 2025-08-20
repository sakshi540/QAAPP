import os
import fitz # PyMuPDF
import tiktoken
import faiss
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import tempfile # Import tempfile

# Import SentenceTransformer for local embeddings
from sentence_transformers import SentenceTransformer

# Import Google Generative AI client
import google.generativeai as genai

# Import Waitress for serving the Flask app
from waitress import serve

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
# Get Gemini API Key from environment variables
GEMINI_API_KEY = 'Your_Key'
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables. Please set it in your .env file.")

# Configure Google Generative AI
genai.configure(api_key=GEMINI_API_KEY)

# Define the local embedding model to use from Hugging Face
HUGGINGFACE_EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2" # A good balance of size and performance
TOKENIZER_MODEL = "cl100k_base" # Used by tiktoken for chunking, generally compatible
MAX_CHUNK_TOKENS = 500
CHUNK_OVERLAP_TOKENS = 50

# Global variables for the FAISS index and document chunks
document_chunks = []
faiss_index = None
document_metadata = {} # To store info about the processed document

# Global variable for the local embedding model instance
local_embedding_model = None

# Initialize Gemini Generative Model
gemini_model = genai.GenerativeModel('gemini-2.0-flash')

app = Flask(__name__)
CORS(app) # Enable CORS for frontend communication

# --- App Startup: Load local embedding model ---
# This block runs once when the Flask app starts
with app.app_context():
    try:
        print(f"Loading local embedding model: {HUGGINGFACE_EMBEDDING_MODEL_NAME}...")
        local_embedding_model = SentenceTransformer(HUGGINGFACE_EMBEDDING_MODEL_NAME)
        print("Local embedding model loaded successfully.")
    except Exception as e:
        print(f"Error loading local embedding model: {e}")
        print("Application will not be able to generate embeddings.")
        local_embedding_model = None # Ensure it's None if loading fails

# --- Helper Functions ---

def get_tokenizer(model_name: str):
    """Loads the tiktoken tokenizer for a given model name."""
    try:
        return tiktoken.get_encoding(model_name)
    except ValueError:
        print(f"Warning: Tokenizer for model '{model_name}' not found. Using 'cl100k_base'.")
        return tiktoken.get_encoding("cl100k_base")

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extracts all text from a PDF document using PyMuPDF.
    """
    document_text = ""
    try:
        doc = fitz.open(pdf_path)
        for page_num in range(doc.page_count):
            page = doc.load_page(page_num)
            document_text += page.get_text()
        doc.close()
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""
    return document_text

def chunk_text_by_tokens(text: str, tokenizer_model: str, max_tokens: int, overlap: int) -> list[str]:
    """
    Chunks a given text into smaller pieces based on a maximum token limit,
    with optional overlap between chunks.
    """
    if not text:
        return []

    encoding = get_tokenizer(tokenizer_model)
    tokens = encoding.encode(text)
    chunks = []
    start_index = 0

    while start_index < len(tokens):
        end_index = min(start_index + max_tokens, len(tokens))
        chunk_tokens = tokens[start_index:end_index]
        chunk_text = encoding.decode(chunk_tokens)
        chunks.append(chunk_text)

        # Move start_index for the next chunk, considering overlap
       
        next_start_index = start_index + (max_tokens - overlap)
        if next_start_index >= len(tokens):
            break # Reached the end or overlap would cause an empty chunk
        start_index = next_start_index

    return chunks

# Removed 'async' from get_embeddings as encode() is synchronous
def get_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Generates embeddings for a list of texts using a local Hugging Face SentenceTransformer model.
    """
    global local_embedding_model
    if local_embedding_model is None:
        raise RuntimeError("Local embedding model is not loaded. Cannot generate embeddings.")
    try:
        # Encode the texts using the local model (synchronous call)
        embeddings = local_embedding_model.encode(texts, convert_to_numpy=True).tolist()
        return embeddings
    except Exception as e:
        print(f"Error getting embeddings from local model: {e}")
        raise

# Removed 'async' from generate_gemini_response
def generate_gemini_response(prompt: str) -> str:
    """
    Generates a response using the Gemini 2.0 Flash model via API call (synchronous).
    """
    try:
        # Use the global gemini_model instance (synchronous call)
        response = gemini_model.generate_content(prompt) # Changed to synchronous generate_content
        return response.text
    except Exception as e:
        # Print the full exception details to the console for better debugging
        import traceback
        traceback.print_exc()
        print(f"Error generating Gemini response: {e}")
        # Provide a more informative error message to the user
        return f"An error occurred while generating the AI response: {e}. Please ensure your GEMINI_API_KEY is valid and has sufficient quota."

# --- API Endpoints ---

# Removed 'async' from upload_pdf route
@app.route('/upload_pdf', methods=['POST'])
def upload_pdf():
    """
    Handles PDF file upload, extracts text, chunks it, generates embeddings,
    and creates a FAISS index.
    """
    global document_chunks, faiss_index, document_metadata

    if local_embedding_model is None:
        return jsonify({"error": "Embedding model not loaded. Please check backend startup logs."}), 500

    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and file.filename.endswith('.pdf'):
        temp_file = None
        try:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
            file.save(temp_file)
            temp_file.close()

            filepath = temp_file.name

            full_text = extract_text_from_pdf(filepath)
            if not full_text:
                return jsonify({"error": "Could not extract text from PDF."}), 400

            chunks = chunk_text_by_tokens(full_text, TOKENIZER_MODEL, MAX_CHUNK_TOKENS, CHUNK_OVERLAP_TOKENS)
            if not chunks:
                return jsonify({"error": "Could not chunk text from PDF."}), 400

            # Call get_embeddings synchronously
            chunk_embeddings = get_embeddings(chunks)

            dimension = len(chunk_embeddings[0])
            faiss_index = faiss.IndexFlatL2(dimension)
            faiss_index.add(np.array(chunk_embeddings).astype('float32'))

            document_chunks = chunks
            document_metadata = {
                "filename": file.filename,
                "num_chunks": len(chunks),
                "full_text_length": len(full_text)
            }

            return jsonify({"message": "PDF processed successfully", "filename": file.filename}), 200

        except Exception as e: # Catching general Exception for local model errors
            print(f"Error during PDF processing: {e}")
            return jsonify({"error": f"Internal server error during PDF processing: {e}"}), 500
        finally:
            if temp_file and os.path.exists(temp_file.name):
                os.remove(temp_file.name)
    else:
        return jsonify({"error": "Invalid file type. Only PDF files are allowed."}), 400

# Removed 'async' from ask_question route
@app.route('/ask_question', methods=['POST'])
def ask_question():
    """
    Receives a user query, performs a FAISS similarity search to retrieve relevant context,
    and generates a response using the Gemini LLM.
    """
    if faiss_index is None or not document_chunks:
        return jsonify({"error": "No document processed yet. Please upload a PDF first."}), 400
    
    if local_embedding_model is None:
        return jsonify({"error": "Embedding model not loaded. Cannot process query."}), 500

    data = request.json
    query = data.get('query')

    if not query:
        return jsonify({"error": "No query provided."}), 400

    try:
        # 1. Generate embedding for the query using the local model (synchronous)
        query_embedding = get_embeddings([query])
        query_embedding_np = np.array(query_embedding).astype('float32')

        # 2. Perform FAISS similarity search
        k = min(5, len(document_chunks))
        distances, indices = faiss_index.search(query_embedding_np, k)

        # 3. Retrieve relevant text chunks
        relevant_context = [document_chunks[i] for i in indices[0]]
        context_str = "\n\n".join(relevant_context)

        # 4. Construct prompt for Gemini LLM
        prompt = f"""You are an AI assistant that answers questions based on the provided document context.
If the answer is not explicitly in the context, state that you cannot find the information in the document.

Document Context:
"{context_str}"

Question: "{query}"
Answer:"""

        # 5. Generate response using Gemini LLM (now synchronous)
        gemini_response = generate_gemini_response(prompt)

        return jsonify({"answer": gemini_response, "context_used": relevant_context}), 200

    except Exception as e: # Catching general Exception for local model errors
        print(f"Error during question answering: {e}")
        return jsonify({"error": f"Internal server error during question answering: {e}"}), 500

# Removed 'async' from get_summary route
@app.route('/get_summary', methods=['POST'])
def get_summary():
    """
    Generates a summary of the processed document using the Gemini LLM.
    """
    if faiss_index is None or not document_chunks:
        return jsonify({"error": "No document processed yet. Please upload a PDF first."}), 400

    full_document_for_summary = " ".join(document_chunks)

    if not full_document_for_summary:
        return jsonify({"error": "Document content is empty for summarization."}), 400

    summary_prompt = f"""Summarize the following document, highlighting key takeaways, payment terms, and parties involved.
    Document:
    "{full_document_for_summary}"
    Summary:"""

    try:
        gemini_summary = generate_gemini_response(summary_prompt) # Changed to synchronous generate_gemini_response
        return jsonify({"summary": gemini_summary}), 200
    except Exception as e:
        print(f"Error generating summary: {e}")
        return jsonify({"error": f"Internal server error during summary generation: {e}"}), 500

# --- Run the Flask App ---
if __name__ == '__main__':
    # Using Waitress for a stable synchronous environment on Windows
    # No need for debug=False, use_reloader=False with serve()
    serve(app, host='0.0.0.0', port=5000)

