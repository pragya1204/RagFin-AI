// user/chat-interface.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
// Corrected Imports: Keep only used icons
import { Copy, Send, Image as ImageIcon, FileText, X, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { ChatHeader } from "@/components/ChatHeader";
// Import for Assistant Logo
import Image from "next/image";
// --- ADJUST THE PATH to your actual logo file ---
 // Example path, ensure it's correct

// Define Message structure
interface Message {
    role: "assistant" | "user";
    content: string;
    timestamp?: string; // ISO String format recommended
    attachments?: {
        type: "image" | "document";
        name: string;
        url?: string; // For potential future image previews
    }[];
    isTyping?: boolean;
}

// Define structure for chat history items from backend
interface ChatHistoryItem {
    session_id: string;
    title: string;
    last_updated?: string; // ISO String format
}

// Define structure for full chat data from backend
interface ChatData extends ChatHistoryItem {
    messages: Message[];
    created_at?: string; // ISO String format
}

// Define structure for uploaded file state (for preview)
interface UploadedFile {
    name: string;
    type: "image" | "document";
    // file?: File; // Optional: Add later if doing actual uploads
}

// Define backend URL (Use environment variable in production)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

export default function ChatInterface() {
    // --- State Variables ---
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello! Ask me anything about recent financial notifications or general finance topics.", timestamp: new Date().toISOString() },
    ]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // --- Refs ---
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Hooks ---
    const { toast } = useToast();

    // --- Utility: Auto-scroll ---
    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(() => { scrollToBottom(); }, [messages]);

    // --- API Call Functions (fetchHistory, loadChatMessages, saveChatToServer - unchanged from last correct version) ---
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

    useEffect(() => { fetchHistory(); }, []); // Run fetchHistory only on mount

    const loadChatMessages = async (sessionId: string) => {
        if (!sessionId || isLoading || sessionId === currentChatId) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/api/chat/${sessionId}`);
            if (!response.ok) throw new Error(response.status === 404 ? "Chat session not found." : `HTTP error! status: ${response.status}`);
            const data: ChatData = await response.json();
            const validMessages = data.messages?.filter(m => m.role && m.content !== undefined) || [];
            setMessages(validMessages);
            setCurrentChatId(data.session_id);
            setUploadedFiles([]); // Clear previews
            setInput("");
            toast({ title: "Chat Loaded", description: `Loaded: ${data.title}` });
        } catch (error: any) {
            console.error("Failed to load chat messages:", error);
            toast({ title: "Error Loading Chat", description: error.message || "Could not load chat.", variant: "destructive" });
            handleNewChat(); // Reset on error
        } finally { setIsLoading(false); }
    };

    // *** Corrected sendMessage function ***
    const sendMessage = async (messageContent: string) => {
        const trimmedContent = messageContent.trim();
        if (!trimmedContent && uploadedFiles.length === 0) return;

        const newUserMessage: Message = {
            role: "user",
            content: trimmedContent,
            timestamp: new Date().toISOString(),
            attachments: uploadedFiles.length > 0 ? uploadedFiles.map(f => ({ type: f.type, name: f.name })) : undefined,
        };

        setMessages((prev) => [...prev, newUserMessage, { role: "assistant", content: "", isTyping: true }]);
        setInput("");
        const filesToSend = [...uploadedFiles];
        setUploadedFiles([]);
        setIsLoading(true);
        const chatIdForRequest = currentChatId;

        try {
            const response = await fetch(`${BACKEND_URL}/api/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: trimmedContent || `User uploaded ${filesToSend.length} file(s): ${filesToSend.map(f=>f.name).join(', ')}`,
                    chat_id: chatIdForRequest
                }),
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

            if (data.chat_id) {
                setCurrentChatId(data.chat_id);
                if (!chatIdForRequest && data.chat_id) { fetchHistory(); }
            } else if (!chatIdForRequest) { console.warn("Backend did not return chat_id for new session."); }

        } catch (error: any) {
            console.error("Failed to send/process message:", error);
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
       if (!currentChatId || isLoading || messages.length <= 1) {
           if (messages.length > 1 && !isLoading && !currentChatId) {
                toast({ title: "Cannot Save", description: "Start a conversation first or load a chat.", variant: "default" });
           } else if (messages.length <= 1) {
                toast({ title: "Nothing to Save", description: "Chat is empty.", variant: "default" });
           }
            return;
       }
       setIsLoading(true);
       try {
            const response = await fetch(`${BACKEND_URL}/api/chats`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ chat_id: currentChatId, messages: messages })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Failed to save." }));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            toast({ title: "Chat Saved", description: result.message || `Session ${currentChatId} updated.` });
            fetchHistory();
       } catch (error: any) {
            console.error("Failed to save chat:", error);
            toast({ title: "Save Error", description: error.message || "Could not save chat.", variant: "destructive" });
       } finally { setIsLoading(false); }
    };

    // --- Event Handlers (handleKeyDown needs correction) ---
    const handleSendClick = () => { sendMessage(input); };

    // *** Corrected handleKeyDown ***
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !isLoading) {
            e.preventDefault();
            sendMessage(input); // Call the correct function
        }
    };

    const handleNewChat = () => {
        if (isLoading) return;
        setMessages([ { role: "assistant", content: "Hello! Ask me anything about recent financial notifications or general finance topics.", timestamp: new Date().toISOString() } ]);
        setCurrentChatId(null);
        setInput("");
        setUploadedFiles([]);
        toast({ title: "New Chat Started" });
    };

    // --- File Handling Logic (with corrected handleFileChange) ---
    const handleFileUpload = (type: "image" | "document") => {
        if (fileInputRef.current && !isLoading) {
          const acceptType = type === "image" ? "image/*" : ".pdf,.doc,.docx,.txt,.csv,.xlsx";
          fileInputRef.current.setAttribute("accept", acceptType);
          fileInputRef.current.click();
        } else if (isLoading) {
            toast({ title: "Please wait", description: "Cannot upload files while processing." });
        }
    };

    // *** Corrected handleFileChange (with timeout for preview) ***
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setIsUploading(true);
        // Simulate delay like original code snippet
        setTimeout(() => {
            const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
                name: file.name,
                type: file.type.startsWith("image/") ? ("image" as const) : ("document" as const),
            }));
            setUploadedFiles((prev) => [...prev, ...newFiles]);
            setIsUploading(false);
            toast({ title: "Files Added", description: `${files.length} file(s) added to message draft.` });
            if (fileInputRef.current) { // Reset input inside timeout
                fileInputRef.current.value = "";
            }
       }, 500); // Use 500ms delay, adjust if needed
    };

     const removeFile = (indexToRemove: number) => {
        setUploadedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    // --- JSX Rendering (Merged structure) ---
    return (
        <div className="flex flex-1 flex-col bg-background h-full overflow-hidden">
            {/* Header Component */}
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
                {/* Messages Scroll Area */}
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4 pb-2">
                        {/* Map through messages */}
                        {messages.map((message, index) => (
                            // --- Using structure from functional version + merged elements ---
                            <div key={`${currentChatId || 'new'}-${index}`} className={cn( "flex gap-3", message.role === "user" ? "justify-end" : "justify-start" )}>
                                {/* Icon - Merged: Uses next/image for assistant */}
                                <div className={cn( "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0", message.role === 'user' ? 'bg-muted' : '' )}>
                                {message.role === "assistant" ? (
                                    // Use next/image with direct path string to public folder asset
                                    <Image
                                        src="/ragfin_logo.jpg" // <<< CHANGE: Root-relative path string
                                        alt="RagFin AI Logo"
                                        width={32} // Required dimensions for non-fill images
                                        height={32}
                                        className="rounded-full"
                                    />
                                ) : (
                                    // Use Lucide icon for User
                                    <User className="h-5 w-5 text-muted-foreground" />
                                )}
                                </div>
                                {/* Message Bubble Container */}
                                <div className={cn("flex flex-col max-w-[75%]", message.role === "user" ? "items-end" : "items-start")}>
                                     {/* Display Attachments if present (Merged from older snippet) */}
                                     {message.attachments && message.attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-1.5">
                                            {message.attachments.map((file, i) => (
                                                <div key={i} className="bg-accent/60 rounded-md p-1.5 px-2 flex items-center gap-1.5 border border-border/20 max-w-xs">
                                                    {/* Use Lucide icons */}
                                                    {file.type === "image" ? <ImageIcon className="h-3.5 w-3.5 text-primary/80 flex-shrink-0" /> : <FileText className="h-3.5 w-3.5 text-primary/80 flex-shrink-0" />}
                                                    <span className="text-xs text-muted-foreground truncate" title={file.name}>{file.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                     {/* Message Content Bubble */}
                                    <div className={cn("p-3 rounded-lg message-bubble", message.role === "assistant" ? "bg-accent text-accent-foreground rounded-bl-none" : "bg-primary/20 text-foreground rounded-br-none","max-w-full" )}>
                                        {message.isTyping ? (
                                            <div className="flex space-x-1.5 items-center h-5 px-2"> <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce delay-75"></span> <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce delay-150"></span> <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce delay-225"></span> </div>
                                        ) : (
                                            <p className="text-sm whitespace-pre-wrap break-words"> {message.content} </p>
                                        )}
                                    </div>
                                    {/* Assistant Actions (Simplified) */}
                                    {message.role === "assistant" && !message.isTyping && message.content && !message.content.startsWith("Sorry, I encountered an error:") && (
                                        <div className="flex items-center gap-1 mt-1">
                                             <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Copy" onClick={() => { navigator.clipboard.writeText(message.content); toast({ title: "Copied!"}); }} >
                                                 <Copy className="h-3.5 w-3.5" />
                                             </Button>
                                        </div>
                                     )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} /> {/* Scroll Anchor */}
                    </div>
                </ScrollArea>

                 {/* File Upload Preview Area (Keep from functional version) */}
                 {uploadedFiles.length > 0 && (
                    <div className="px-4 py-2 border-t border-border/40 bg-muted/30">
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Draft Attachments:</p>
                        <div className="flex flex-wrap gap-2">
                            {uploadedFiles.map((file, index) => (
                                <div key={index} className="bg-accent rounded-md p-1.5 px-2 flex items-center gap-2 group border border-border/20 text-xs max-w-[200px]">
                                    {file.type === "image" ? ( <ImageIcon className="h-4 w-4 text-primary/80 flex-shrink-0" /> ) : ( <FileText className="h-4 w-4 text-primary/80 flex-shrink-0" /> )}
                                    <span className="text-foreground truncate flex-1" title={file.name}>{file.name}</span>
                                    <button onClick={() => removeFile(index)} className="opacity-50 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0" title="Remove file" disabled={isLoading}>
                                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                                    </button>
                                </div>
                            ))}
                            {isUploading && ( <div className="bg-accent rounded-md p-2 flex items-center text-xs text-muted-foreground"> Processing... </div> )}
                        </div>
                    </div>
                )}
            </div>

            {/* Input area (Keep from functional version) */}
            <div className="p-4 border-t border-border/40 bg-background">
                <div className="relative flex items-center">
                     <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} multiple disabled={isLoading} />
                      <div className="absolute bottom-0 left-0 top-0 flex items-center pl-2">
                          {/* Use ImageIcon alias for consistency if preferred */}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleFileUpload("image")} disabled={isLoading} title="Upload image"> <ImageIcon className="h-4 w-4" /> </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleFileUpload("document")} disabled={isLoading} title="Upload document"> <FileText className="h-4 w-4" /> </Button>
                      </div>
                     <Textarea
                         placeholder="Message RagFin AI... (Shift+Enter for new line)"
                         value={input}
                         onChange={(e) => setInput(e.target.value)}
                         onKeyDown={handleKeyDown} // Ensure this uses the corrected function
                         className="min-h-[44px] max-h-32 w-full bg-muted/50 border-input focus:ring-primary resize-none pr-12 pl-24 py-2.5"
                         disabled={isLoading}
                         rows={1}
                     />
                     <div className="absolute bottom-0 right-0 top-0 flex items-center pr-2">
                         <Button onClick={handleSendClick} size="icon" className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading || (!input.trim() && uploadedFiles.length === 0) }>
                             {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                         </Button>
                    </div>
                 </div>
            </div>
        </div>
    );
} // End of ChatInterface component