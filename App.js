import React, { useState, useEffect, useRef, useCallback } from 'react';

// Mock document content to simulate a PDF contract
const mockDocumentContent = `
This Contract Agreement (the 'Agreement') is made and entered into as of July 28, 2025, by and between Party A ('Client'), located at ABC, and Party B ('Service Provider'), XYZ.

1.  **Scope of Services:** The Service Provider agrees to provide web development services, including but not limited to, front-end development, back-end development, and database integration, as detailed in Appendix A.

2.  **Payment Terms:** The Client agrees to pay the Service Provider a total sum of $10,000 INR upon completion of the project. A deposit of $2,000 INR is due upon signing this Agreement. Payments shall be made via bank transfer.

3.  **Term and Termination:** This Agreement shall commence on the date first written above and shall continue until the completion of the services, unless terminated earlier as provided herein. Either party may terminate this Agreement with 30 days written notice for any reason.

4.  **Confidentiality:** Both parties agree to keep all proprietary and confidential information disclosed during the term of this Agreement strictly confidential.

5.  **Governing Law:** This Agreement shall be governed by and construed in accordance with the laws of India, without regard to its conflict of laws principles.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.
`;



// --- Configuration ---
const BACKEND_BASE_URL = 'http://localhost:5000';

// Reusable Icon Components (using inline SVG for simplicity and consistency)
const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send">
        <path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M15 7l4 4"/>
    </svg>
);

const FileTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>
    </svg>
);

const MessageSquareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square">
        <path d="M21 15a2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
);

const SummarizeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list-checks">
        <path d="m3 17 2 2 4-4"/><path d="M3 6h18"/><path d="M3 12h18"/><path d="M16 12h1"/><path d="M16 6h1"/><path d="M16 18h1"/>
    </svg>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v2"/>
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
        <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
    </svg>
);

const MicIcon = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-mic ${className}`}>
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
    </svg>
);

const SpeakerIcon = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-volume-2 ${className}`}>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M23.31 1.69a16 16 0 0 1 0 22.62"/>
    </svg>
);

// Main App Component
function App() {
    // Access hooks directly from React (now imported)
    const [selectedFile, setSelectedFile] = useState(null);
    const [chatHistory, setChatHistory] = useState(() => {
        try {
            const savedChat = localStorage.getItem('pdfQaChatHistory');
            return savedChat ? JSON.parse(savedChat) : [];
        } catch (error) {
            console.error("Failed to parse chat history from localStorage:", error);
            return [];
        }
    });
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [documentLoaded, setDocumentLoaded] = useState(false);
    const [documentSummary, setDocumentSummary] = useState('');
    const [highlightedText, setHighlightedText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [speakingMessageId, setSpeakingMessageId] = useState(null);

    const chatContainerRef = useRef(null);
    const documentContentRef = useRef(null); // Still useful for selection of mock content
    const recognitionRef = useRef(null);

    // Persist chat history to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('pdfQaChatHistory', JSON.stringify(chatHistory));
        } catch (error) {
            console.error("Failed to save chat history to localStorage:", error);
        }
    }, [chatHistory]);

    // Scroll to the bottom of the chat when new messages arrive
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    // Function to call LLM API (now always via backend for Q&A and Summary)
    const callBackendLLM = useCallback(async (endpoint, data = {}) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/${endpoint}`, {
                method: 'POST', // Summary can be GET, but for consistency with data payload, POST is fine
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error(`Error calling backend ${endpoint}:`, error);
            throw error; // Re-throw to be caught by specific handlers
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Sends the message and gets a response from the LLM via backend
    // Moved handleSendMessage definition before its usage in useEffect
    const handleSendMessage = useCallback(async (messageToSend = currentMessage) => {
        if (!messageToSend.trim() || !documentLoaded) return;

        const userMessage = messageToSend.trim();
        const newMessageId = Date.now();
        setChatHistory(prev => [...prev, { id: newMessageId, sender: 'user', message: userMessage }]);
        setCurrentMessage('');

        try {
            const result = await callBackendLLM('ask_question', { query: userMessage });
            setChatHistory(prev => [...prev, { id: newMessageId + 1, sender: 'ai', message: result.answer }]);
        } catch (error) {
            setChatHistory(prev => [...prev, { sender: 'ai', message: `Error getting response: ${error.message}` }]);
        }
    }, [documentLoaded, callBackendLLM, setChatHistory, setCurrentMessage, currentMessage]);

    // Initialize SpeechRecognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                setCurrentMessage('Listening...');
            };

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setCurrentMessage(transcript);
                setIsListening(false);
                handleSendMessage(transcript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
                setCurrentMessage('');
                setChatHistory(prev => [...prev, { sender: 'system', message: `Voice input error: ${event.error}. Please try again.` }]);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                if (currentMessage === 'Listening...') {
                    setCurrentMessage('');
                }
            };
        } else {
            console.warn("Web Speech API not supported in this browser.");
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [handleSendMessage, setCurrentMessage, setIsListening, setChatHistory, currentMessage]); // Added currentMessage to deps

    // Summarize the document when it's "loaded" via backend
    useEffect(() => {
        const fetchSummary = async () => {
            if (documentLoaded && !documentSummary) {
                setDocumentSummary('Generating summary...');
                try {
                    const result = await callBackendLLM('get_summary', {}); // No specific data needed for GET summary
                    setDocumentSummary(result.summary);
                } catch (error) {
                    setDocumentSummary(`Failed to generate summary: ${error.message}`);
                }
            }
        };
        fetchSummary();
    }, [documentLoaded, documentSummary, callBackendLLM, setDocumentSummary]);

    // Handles the actual file upload to backend
    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type === 'application/pdf') {
            setSelectedFile(file);
            setDocumentLoaded(false); // Reset document loaded state
            setDocumentSummary(''); // Clear previous summary
            setChatHistory([{ sender: 'system', message: `Uploading and processing "${file.name}"... This might take a moment.` }]);
            setIsLoading(true);

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch(`${BACKEND_BASE_URL}/upload_pdf`, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                setDocumentLoaded(true);

                setChatHistory(prev => [...prev, { sender: 'system', message: `Successfully processed "${result.filename}". You can now ask questions about its content.` }]);
            } catch (error) {
                console.error('Error uploading PDF:', error);
                setChatHistory(prev => [...prev, { sender: 'system', message: `Failed to upload or process PDF: ${error.message}` }]);
                setSelectedFile(null);
                setDocumentLoaded(false);
            } finally {
                setIsLoading(false);
            }
        } else {
            setSelectedFile(null);
            setDocumentLoaded(false);
            setDocumentSummary('');
            setChatHistory([{ sender: 'system', message: 'Please upload a valid PDF file.' }]);
        }
    };

    // Handle Enter key press in the input field
    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !isLoading) {
            handleSendMessage();
        }
    };

    // Handle text selection in the document viewer (for mock content)
    const handleTextSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
            setHighlightedText(selection.toString().trim());
        } else {
            setHighlightedText('');
        }
    };

    // Function to clear chat history
    const handleClearChat = () => {
        setChatHistory([]);
        localStorage.removeItem('pdfQaChatHistory');
    };

    // Function to copy chat history to clipboard
    const handleCopyChat = () => {
        const chatText = chatHistory.map(msg => `${msg.sender === 'user' ? 'You' : 'AI'}: ${msg.message}`).join('\n');
        try {
            const textarea = document.createElement('textarea');
            textarea.value = chatText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setChatHistory(prev => [...prev, { sender: 'system', message: 'Chat history copied to clipboard!' }]);
        } catch (err) {
            console.error('Failed to copy chat history: ', err);
            setChatHistory(prev => [...prev, { sender: 'system', message: 'Failed to copy chat history.' }]);
        }
    };

    // Function to handle voice input (Speech-to-Text)
    const handleVoiceInput = () => {
        if (recognitionRef.current) {
            if (isListening) {
                recognitionRef.current.stop();
            } else {
                recognitionRef.current.start();
            }
        } else {
            setChatHistory(prev => [...prev, { sender: 'system', message: 'Voice input not supported or initialized.' }]);
        }
    };

    // Function to handle speaking AI responses (Text-to-Speech)
    const handleSpeakResponse = (message, messageId) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.lang = 'en-US';

            utterance.onstart = () => {
                setSpeakingMessageId(messageId);
            };
            utterance.onend = () => {
                setSpeakingMessageId(null);
            };
            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event.error);
                setSpeakingMessageId(null);
                setChatHistory(prev => [...prev, { sender: 'system', message: `Voice output error: ${event.error}.` }]);
            };

            if (speechSynthesis.speaking && speakingMessageId === messageId) {
                speechSynthesis.cancel();
                setSpeakingMessageId(null);
            } else if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
                speechSynthesis.speak(utterance);
            } else {
                speechSynthesis.speak(utterance);
            }
        } else {
            setChatHistory(prev => [...prev, { sender: 'system', message: 'Text-to-speech not supported in this browser.' }]);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 font-sans text-gray-800 flex items-center justify-center p-4">
            <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[85vh] transform transition-all duration-300 ease-in-out">
                {/* Left Panel: Document Viewer / Upload */}
                <div className="md:w-1/2 p-6 bg-gray-50 flex flex-col border-r border-gray-200 rounded-l-2xl">
                    <h2 className="text-3xl font-extrabold text-indigo-800 mb-6 flex items-center">
                        <FileTextIcon className="mr-3 text-purple-600 w-8 h-8" /> Document Viewer
                    </h2>
                    <div className="mb-8">
                        <label htmlFor="pdf-upload" className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 ease-in-out cursor-pointer text-lg font-semibold transform hover:-translate-y-1">
                            <UploadIcon className="mr-3 w-6 h-6" />
                            {selectedFile ? `Change File (${selectedFile.name})` : 'Upload PDF Document'}
                        </label>
                        <input
                            id="pdf-upload"
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {selectedFile && (
                            <p className="mt-4 text-sm text-gray-700 text-center font-medium animate-fade-in">
                                File selected: <span className="font-bold text-indigo-700">{selectedFile.name}</span>
                            </p>
                        )}
                        {!selectedFile && (
                            <p className="mt-4 text-sm text-gray-500 text-center animate-fade-in">
                                Please upload a PDF to start asking questions.
                            </p>
                        )}
                    </div>

                    {documentLoaded && (
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-indigo-700 mb-3 flex items-center">
                                <SummarizeIcon className="mr-2 text-purple-500" /> Document Summary
                            </h3>
                            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-inner text-sm leading-relaxed text-gray-700 max-h-40 overflow-y-auto custom-scrollbar">
                                {documentSummary || "Summary will appear here after document processing."}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 bg-white border border-gray-200 rounded-xl p-5 overflow-auto shadow-inner text-sm leading-relaxed text-gray-800 custom-scrollbar relative">
                        {documentLoaded ? (
                            <pre
                                ref={documentContentRef}
                                className="whitespace-pre-wrap font-mono text-xs md:text-sm text-gray-800 select-text"
                                onMouseUp={handleTextSelection}
                            >
                                {mockDocumentContent}
                            </pre>
                        ) : (
                            <div className="text-center text-gray-500 p-8 flex flex-col items-center justify-center h-full">
                                <FileTextIcon className="w-16 h-16 text-gray-300 mb-4" />
                                <p className="text-lg font-medium mb-2">No document loaded.</p>
                                <p className="text-sm">Upload a PDF to see its content here (simulated).</p>
                            </div>
                        )}
                        {highlightedText && (
                            <button
                                onClick={() => {
                                    handleSendMessage(highlightedText);
                                    setHighlightedText(''); // Clear highlight after sending
                                }}
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-purple-700 transition-colors duration-200 flex items-center text-sm font-semibold z-10"
                            >
                                <MessageSquareIcon className="w-4 h-4 mr-2" /> Ask AI about "{highlightedText.substring(0, 20)}..."
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Panel: Chat Interface */}
                <div className="md:w-1/2 p-6 flex flex-col rounded-r-2xl">
                    <h2 className="text-3xl font-extrabold text-indigo-800 mb-6 flex items-center">
                        <MessageSquareIcon className="mr-3 text-purple-600 w-8 h-8" /> AI Chat
                    </h2>
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto bg-gray-50 rounded-xl p-5 shadow-inner mb-6 custom-scrollbar">
                        {chatHistory.length === 0 ? (
                            <div className="text-center text-gray-500 p-8 flex flex-col items-center justify-center h-full">
                                <MessageSquareIcon className="w-16 h-16 text-gray-300 mb-4" />
                                <p className="text-lg font-medium mb-2">Start a conversation!</p>
                                <p className="text-sm">Upload a PDF and then ask me anything about it.</p>
                            </div>
                        ) : (
                            chatHistory.map((msg, index) => (
                                <div key={index} className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                    <div className={`max-w-[85%] p-4 rounded-xl shadow-md ${
                                        msg.sender === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-none transform translate-x-1'
                                            : 'bg-gray-200 text-gray-800 rounded-bl-none transform -translate-x-1'
                                    } transition-all duration-200 ease-out flex items-center`}>
                                        {msg.message}
                                        {msg.sender === 'ai' && (
                                            <button
                                                onClick={() => handleSpeakResponse(msg.message, msg.id)}
                                                className={`ml-2 p-1 rounded-full ${speakingMessageId === msg.id ? 'bg-purple-300 text-purple-800' : 'bg-gray-300 text-gray-700'} hover:bg-purple-400 transition-colors duration-200`}
                                                title={speakingMessageId === msg.id ? 'Stop Speaking' : 'Listen to Response'}
                                            >
                                                <SpeakerIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        {isLoading && (
                            <div className="flex justify-start mb-4">
                                <div className="max-w-[85%] p-4 rounded-xl bg-gray-200 text-gray-800 rounded-bl-none">
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500 mr-3"></div>
                                        <span className="text-gray-700">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                            </div>

                            <div className="flex justify-end gap-2 mb-4">
                                <button
                                    onClick={handleCopyChat}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-300 transition-colors duration-200 flex items-center text-sm font-medium"
                                    title="Copy Chat History"
                                >
                                    <CopyIcon className="w-4 h-4 mr-2" /> Copy Chat
                                </button>
                                <button
                                    onClick={handleClearChat}
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-red-600 transition-colors duration-200 flex items-center text-sm font-medium"
                                    title="Clear Chat History"
                                >
                                    <TrashIcon className="w-4 h-4 mr-2" /> Clear Chat
                                </button>
                            </div>

                            <div className="flex items-center border-t border-gray-200 pt-6">
                                <input
                                    type="text"
                                    value={currentMessage}
                                    onChange={(e) => setCurrentMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder={documentLoaded ? "Ask a question about the document..." : "Please upload a PDF first..."}
                                    className="flex-1 p-4 border border-gray-300 rounded-l-xl focus:outline-none focus:ring-3 focus:ring-purple-300 focus:border-purple-500 transition-all duration-200 ease-in-out disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
                                    disabled={isLoading || !documentLoaded || isListening}
                                />
                                <button
                                    onClick={handleVoiceInput}
                                    className={`p-4 ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white transition-colors duration-300 ease-in-out shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center transform hover:-translate-y-1`}
                                    title={isListening ? 'Stop Listening' : 'Start Voice Input'}
                                    disabled={isLoading || !documentLoaded}
                                >
                                    <MicIcon className={`w-6 h-6 ${isListening ? 'animate-pulse' : ''}`} />
                                </button>
                                <button
                                    onClick={() => handleSendMessage()}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-r-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 ease-in-out shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center transform hover:-translate-y-1"
                                    disabled={isLoading || !documentLoaded || !currentMessage.trim() || isListening}
                                >
                                    <SendIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        export default App;
