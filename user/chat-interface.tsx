// user/chat-interface.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
// Corrected Imports: Keep only used icons
import { Copy, Send, Image as ImageIcon, FileText, X, Bot, User, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { ChatHeader } from "@/components/ChatHeader";
// Import for Assistant Logo
import Image from "next/image";
// --- ADJUST THE PATH to your actual logo file in /public ---
import logo from "@/public/ragfin_logo.jpg"; // Use root-relative path for public assets

// Define Message structure
interface Message {
    role: "assistant" | "user";
    content: string;
    timestamp?: string; // ISO String format recommended
    // attachments not used for sending, but keep if displaying history with old format
    attachments?: { type: "image" | "document"; name: string; url?: string; }[];
    isTyping?: boolean;
}

// Define structure for chat history items
interface ChatHistoryItem { session_id: string; title: string; last_updated?: string; }
// Define structure for full chat data
interface ChatData extends ChatHistoryItem { messages: Message[]; created_at?: string; }

// Define structure for the currently active document context
interface ActiveDocument {
    filename: string;
    session_id: string; // The session this doc is tied to
}

// Define backend URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

export default function ChatInterface() {
    // --- State Variables ---
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([ { role: "assistant", content: "Hello! Ask about finance or upload a document for context.", timestamp: new Date().toISOString() } ]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null); // Holds the consistent session ID
    const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
    const [activeDocument, setActiveDocument] = useState<ActiveDocument | null>(null); // Track active doc context
    const [isLoading, setIsLoading] = useState(false); // Loading indicator for query response
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [isFileProcessing, setIsFileProcessing] = useState(false); // Loading indicator for file upload/processing

    // --- Refs ---
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Hooks ---
    const { toast } = useToast();

    // --- Utility: Auto-scroll ---
    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(() => { scrollToBottom(); }, [messages]);

    // --- API Call Functions ---
    const fetchHistory = useCallback(async () => {
        if (isHistoryLoading) return;
        setIsHistoryLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/api/chats`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data: ChatHistoryItem[] = await response.json();
            data.sort((a, b) => new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime());
            setChatHistory(data);
        } catch (error) {
            console.error("Failed to fetch chat history:", error);
            toast({ title: "Error", description: "Could not fetch chat history.", variant: "destructive" });
        } finally { setIsHistoryLoading(false); }
    }, [toast, isHistoryLoading]);

    useEffect(() => { fetchHistory(); }, []); // Fetch on initial mount

    const loadChatMessages = async (sessionId: string) => {
        if (!sessionId || isLoading || isFileProcessing || sessionId === currentChatId) return;
        setIsLoading(true);
        setActiveDocument(null); // --- Clear active document when loading history ---
        console.log(`Loading messages for chat: ${sessionId}`);
        try {
            const response = await fetch(`${BACKEND_URL}/api/chat/${sessionId}`);
            if (!response.ok) throw new Error(response.status === 404 ? "Chat session not found." : `HTTP error! status: ${response.status}`);
            const data: ChatData = await response.json();
            const validMessages = data.messages?.filter(m => m.role && m.content !== undefined) || [];
            setMessages(validMessages);
            setCurrentChatId(data.session_id); // Set loaded chat ID
            setInput("");
            toast({ title: "Chat Loaded", description: `Loaded: ${data.title}` });
        } catch (error: any) {
            console.error("Failed to load chat messages:", error);
            toast({ title: "Error Loading Chat", description: error.message || "Could not load chat.", variant: "destructive" });
            handleNewChat(); // Reset on error
        } finally { setIsLoading(false); }
    };

    // *** Ensures a session ID exists before calling API ***
    const ensureSessionId = (): string => {
        let sessionId = currentChatId;
        if (!sessionId) {
            sessionId = crypto.randomUUID(); // Generate new UUID if null
            console.log("Generated new session ID on frontend:", sessionId);
            setCurrentChatId(sessionId); // Set state immediately
            // If starting session via message/upload, reset messages (optional, depends on desired UX)
            // setMessages([ { role: "assistant", content: "Starting new session...", timestamp: new Date().toISOString() } ]);
        }
        return sessionId;
    };


    const sendMessage = async (messageContent: string) => {
        const trimmedContent = messageContent.trim();
        if (!trimmedContent) return;
        if (isLoading || isFileProcessing) return;

        const sessionIdToSend = ensureSessionId(); // Get or generate session ID
        const isNewSession = !currentChatId; // Was the ID just generated?

        const newUserMessage: Message = { role: "user", content: trimmedContent, timestamp: new Date().toISOString() };
        setMessages((prev) => [...prev, newUserMessage, { role: "assistant", content: "", isTyping: true }]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/api/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: trimmedContent, chat_id: sessionIdToSend }), // Send consistent ID
            });

            setMessages((prev) => prev.filter(m => !m.isTyping));

            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ error: "Unknown server error" }));
                 throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (!data.answer) { throw new Error("Received empty answer from server."); }

            const assistantMessage: Message = { role: "assistant", content: data.answer, timestamp: new Date().toISOString() };
            setMessages((prev) => [...prev, assistantMessage]);

            // Update state ONLY if backend confirms the ID (should match sessionIdToSend now)
            if (data.chat_id && data.chat_id !== currentChatId) {
                console.log(`Confirming session ID from backend: ${data.chat_id}`);
                setCurrentChatId(data.chat_id);
            }
            if (isNewSession) { fetchHistory(); } // Refresh list if it was a new session

        } catch (error: any) {
            console.error("Failed to send/process query:", error);
             setMessages((prev) => prev.filter(m => !m.isTyping));
            const errorMessage: Message = { role: "assistant", content: `Sorry, error: ${error.message || "Could not get response."}`, timestamp: new Date().toISOString() };
             setMessages((prev) => [...prev, errorMessage]);
             toast({ title: "API Error", description: error.message || "Could not get response.", variant: "destructive" });
        } finally {
            setIsLoading(false);
            setMessages((prev) => prev.filter(m => !m.isTyping));
        }
    };

    const saveChatToServer = async () => {
       // Explicit save function - same as before
       if (!currentChatId || isLoading || isFileProcessing || messages.length <= 1) {
           if (messages.length > 1 && !isLoading && !isFileProcessing && !currentChatId) { toast({ title: "Cannot Save", description: "Start a conversation first or load a chat.", variant: "default" }); }
           else if (messages.length <= 1) { toast({ title: "Nothing to Save", description: "Chat is empty.", variant: "default" }); }
            return;
       }
       setIsLoading(true);
       try {
            const response = await fetch(`${BACKEND_URL}/api/chats`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: currentChatId, messages: messages }) });
            if (!response.ok) { const errorData = await response.json().catch(() => ({ error: "Failed to save." })); throw new Error(errorData.error || `HTTP error! status: ${response.status}`); }
            const result = await response.json();
            toast({ title: "Chat Saved", description: result.message || `Session ${currentChatId} updated.` });
            fetchHistory();
       } catch (error: any) {
            console.error("Failed to save chat:", error);
            toast({ title: "Save Error", description: error.message || "Could not save chat.", variant: "destructive" });
       } finally { setIsLoading(false); }
    };


    // --- Event Handlers ---
    const handleSendClick = () => { sendMessage(input); };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === "Enter" && !e.shiftKey && !isLoading && !isFileProcessing) { e.preventDefault(); sendMessage(input); } };

    const handleNewChat = () => {
        if (isLoading || isFileProcessing) return;
        setMessages([ { role: "assistant", content: "Hello! Ask me anything...", timestamp: new Date().toISOString() } ]);
        setCurrentChatId(null);
        setActiveDocument(null); // Clear active document
        setInput("");
        toast({ title: "New Chat Started" });
    };

    // --- File Handling Logic ---
    const handleFileUploadTrigger = (type: "image" | "document") => {
        // Triggers the hidden file input click
        if (fileInputRef.current && !isLoading && !isFileProcessing) {
          const acceptType = type === "image" ? "image/*" : ".pdf,.xlsx,.csv,.txt"; // Limit allowed types
          fileInputRef.current.setAttribute("accept", acceptType);
          fileInputRef.current.click();
        } else if (isLoading || isFileProcessing) { toast({ title: "Please wait", description: "Cannot upload file while processing." }); }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Gets file and calls upload function
        const files = e.target.files;
        if (files && files.length > 0) {
            const fileToUpload = files[0];
            if (fileToUpload.size > (10 * 1024 * 1024)) { // 10MB limit
                 toast({ title: "File Too Large", description: "Max 10MB.", variant: "destructive"});
                 if (e.target) e.target.value = ""; return;
            }
            processAndUploadFile(fileToUpload); // Call upload
        }
        if (e.target) { e.target.value = ""; } // Reset input
    };

    const processAndUploadFile = async (file: File) => {
        // Handles the API call to /api/upload
        if (isFileProcessing || isLoading) return;
        setIsFileProcessing(true);
        setActiveDocument(null); // Clear previous doc info
        toast({ title: "Processing Document...", description: `Uploading ${file.name}. Please wait.` });

        const sessionIdToSend = ensureSessionId(); // --- Generate ID if needed ---

        const formData = new FormData();
        formData.append("file", file);
        formData.append("session_id", sessionIdToSend); // --- Send consistent ID ---

        try {
            const response = await fetch(`${BACKEND_URL}/api/upload`, { method: "POST", body: formData });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Upload failed." }));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            toast({ title: "Document Processed", description: `Context from '${result.filename}' is now active for this session.` });
            // Set the active document context indicator using the ID we sent
            setActiveDocument({ filename: result.filename, session_id: sessionIdToSend });
            // Don't need to update currentChatId here, already done by ensureSessionId if needed

        } catch (error: any) {
            console.error("Failed to upload/process file:", error);
            setActiveDocument(null);
            toast({ title: "File Processing Error", description: error.message || "Could not process document.", variant: "destructive" });
        } finally { setIsFileProcessing(false); }
    };

    const clearActiveDocument = () => {
         // TODO: Call backend endpoint to clear session_document_store[session_id] later
         setActiveDocument(null);
         toast({title: "Document Context Cleared"});
    };


    // --- JSX Rendering ---
    return (
        <div className="flex flex-1 flex-col bg-background h-full overflow-hidden">
            {/* Header */}
             <ChatHeader
                chatHistory={chatHistory}
                onNewChat={handleNewChat}
                onSaveChat={saveChatToServer}
                onLoadChat={loadChatMessages}
                currentChatId={currentChatId}
                isHistoryLoading={isHistoryLoading}
            />
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4 pb-2">
                        {messages.map((message, index) => (
                            <div key={`${currentChatId || 'new'}-${index}`} className={cn( "flex gap-3", message.role === "user" ? "justify-end" : "justify-start" )}>
                                {/* Icon */}
                                <div className={cn( "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0", message.role === 'user' ? 'bg-muted' : '' )}>
                                    {message.role === "assistant" ? ( <Image src={logo} alt="RagFin AI Logo" width={32} height={32} className="rounded-full" /> ) : ( <User className="h-5 w-5 text-muted-foreground" /> )}
                                </div>
                                {/* Bubble Container */}
                                <div className={cn("flex flex-col max-w-[75%]", message.role === "user" ? "items-end" : "items-start")}>
                                     {/* Optional Attachment Display (if needed for history) */}
                                     {message.attachments && message.attachments.length > 0 && ( <div className="flex flex-wrap gap-2 mb-1.5"> {message.attachments.map((file, i) => ( <div key={i} className="bg-accent/60 rounded-md p-1.5 px-2 flex items-center gap-1.5 border border-border/20 max-w-xs"> {file.type === "image" ? <ImageIcon className="h-3.5 w-3.5 text-primary/80 flex-shrink-0" /> : <FileText className="h-3.5 w-3.5 text-primary/80 flex-shrink-0" />} <span className="text-xs text-muted-foreground truncate" title={file.name}>{file.name}</span> </div> ))} </div> )}
                                     {/* Message Content */}
                                    <div className={cn("p-3 rounded-lg message-bubble", message.role === "assistant" ? "bg-accent text-accent-foreground rounded-bl-none" : "bg-primary/20 text-foreground rounded-br-none","max-w-full" )}>
                                        {message.isTyping ? ( <div className="flex space-x-1.5 items-center h-5 px-2"> <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce delay-75"></span> <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce delay-150"></span> <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce delay-225"></span> </div> )
                                        : ( <p className="text-sm whitespace-pre-wrap break-words"> {message.content} </p> )}
                                    </div>
                                    {/* Assistant Actions */}
                                    {message.role === "assistant" && !message.isTyping && message.content && !message.content.startsWith("Sorry,") && ( <div className="flex items-center gap-1 mt-1"> <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Copy" onClick={() => { navigator.clipboard.writeText(message.content); toast({ title: "Copied!"}); }} > <Copy className="h-3.5 w-3.5" /> </Button> </div> )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} /> {/* Scroll Anchor */}
                    </div>
                </ScrollArea>

                 {/* Active Document Indicator Bar */}
                 {activeDocument && (
                    <div className="px-4 py-1.5 border-t border-border/40 bg-blue-950/30 text-xs">
                        <div className="flex items-center justify-between gap-2">
                             <div className="flex items-center gap-1.5 text-blue-300 truncate flex-1 min-w-0"> {/* Allow truncation */}
                                 <Info className="h-3.5 w-3.5 flex-shrink-0" />
                                 <span className="font-medium">Active Context:</span>
                                 <span className="text-foreground/80 truncate" title={activeDocument.filename}>{activeDocument.filename}</span>
                             </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0" title="Clear Document Context" onClick={clearActiveDocument} disabled={isFileProcessing || isLoading}>
                                 <X className="h-3.5 w-3.5" />
                             </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-border/40 bg-background">
                <div className="relative flex items-center">
                     {/* Hidden file input */}
                     <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} multiple={false} disabled={isLoading || isFileProcessing} />
                      {/* Attachment buttons */}
                      <div className="absolute bottom-0 left-0 top-0 flex items-center pl-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleFileUploadTrigger("image")} disabled={isLoading || isFileProcessing} title="Upload image document"> <ImageIcon className="h-4 w-4" /> </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleFileUploadTrigger("document")} disabled={isLoading || isFileProcessing} title="Upload text/pdf/excel document"> <FileText className="h-4 w-4" /> </Button>
                      </div>
                     {/* Textarea */}
                     <Textarea
                         placeholder={activeDocument ? `Ask about ${activeDocument.filename}...` : "Message RagFin AI..."} // Dynamic placeholder
                         value={input}
                         onChange={(e) => setInput(e.target.value)}
                         onKeyDown={handleKeyDown}
                         className="min-h-[44px] max-h-32 w-full bg-muted/50 border-input focus:ring-primary resize-none pr-12 pl-24 py-2.5"
                         disabled={isLoading || isFileProcessing}
                         rows={1}
                     />
                     {/* Send Button */}
                     <div className="absolute bottom-0 right-0 top-0 flex items-center pr-2">
                         <Button onClick={handleSendClick} size="icon" className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading || isFileProcessing || !input.trim()} >
                             {(isLoading || isFileProcessing) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                         </Button>
                    </div>
                 </div>
            </div>
        </div>
    );
}