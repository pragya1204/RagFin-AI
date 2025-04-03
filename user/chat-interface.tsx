"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Copy, Download, ThumbsUp, ThumbsDown, Send, Image, FileText, Paperclip, Mic, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  role: "assistant" | "user"
  content: string
  timestamp: string
  attachments?: {
    type: "image" | "document"
    name: string
    url: string
  }[]
  isTyping?: boolean
}

export default function ChatInterface() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello, I'm RagFin AI, your financial analysis assistant. How can I help you today?",
      timestamp: "4:08:28 PM",
    },
    {
      role: "user",
      content: "Hi, I'd like to analyze my portfolio performance.",
      timestamp: "4:08:37 PM",
    },
    {
      role: "assistant",
      content:
        "I'd be happy to help you analyze your portfolio performance.\n\nTo provide a comprehensive analysis, I'll need some information about your investments. You can either:\n\n1. Upload your portfolio statement as a PDF or spreadsheet\n2. Share specific details about your holdings\n3. Connect to your brokerage account through our secure integration\n\nWhat would you prefer?",
      timestamp: "4:08:42 PM",
    },
  ])

  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; type: "image" | "document" }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!input.trim() && uploadedFiles.length === 0) return

    const newUserMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString(),
      attachments:
        uploadedFiles.length > 0
          ? uploadedFiles.map((file) => ({
              type: file.type,
              name: file.name,
              url: URL.createObjectURL(new Blob([])), // Placeholder URL
            }))
          : undefined,
    }

    setMessages((prev) => [...prev, newUserMessage])
    setInput("")
    setUploadedFiles([])

    // Simulate AI typing
    const typingMessage: Message = {
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString(),
      isTyping: true,
    }

    setMessages((prev) => [...prev, typingMessage])

    // Simulate AI response after delay
    setTimeout(() => {
      setMessages((prev) => {
        const newMessages = [...prev]
        newMessages.pop() // Remove typing indicator

        return [
          ...newMessages,
          {
            role: "assistant",
            content:
              "I've received your request. To provide a detailed portfolio analysis, I'll need to process the information you've shared.\n\nBased on typical market patterns, I can offer some preliminary insights:\n\n1. Market volatility has increased in recent weeks\n2. Tech sector has shown strong performance\n3. Bond yields have been fluctuating\n\nWould you like me to perform a deeper analysis on specific aspects of your portfolio?",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]
      })
    }, 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileUpload = (type: "image" | "document") => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("accept", type === "image" ? "image/*" : ".pdf,.doc,.docx,.txt,.csv,.xlsx")
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setIsUploading(true)

    // Simulate upload delay
    setTimeout(() => {
      const newFiles = Array.from(files).map((file) => ({
        name: file.name,
        type: file.type.startsWith("image/") ? ("image" as const) : ("document" as const),
      }))

      setUploadedFiles((prev) => [...prev, ...newFiles])
      setIsUploading(false)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }, 1000)
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 pb-2">
            {messages.map((message, index) => (
              <div
              key={index}
              className={cn(
                "flex gap-2 max-w-[80%] p-8", // Added padding (p-8 = 2rem)
                message.role === "user" ? "ml-auto justify-end" : "justify-start" // Align user messages to the right
              )}
            >
              {message.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-secondary glow-effect flex-shrink-0" />
              )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {message.role === "assistant" ? "RagFin AI" : "You"}
                    </span>
                    <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                  </div>

                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {message.attachments.map((file, i) => (
                        <div key={i} className="bg-accent rounded-md p-2 flex items-center gap-2">
                          {file.type === "image" ? (
                            <Image className="h-4 w-4 text-primary" />
                          ) : (
                            <FileText className="h-4 w-4 text-primary" />
                          )}
                          <span className="text-xs">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    className={cn(
                      "p-3 rounded-lg message-bubble",
                      message.role === "assistant" ? "bg-accent text-foreground" : "bg-primary/20 text-foreground",
                    )}
                  >
                    {message.isTyping ? (
                      <div className="flex space-x-1 items-center h-6">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-75"></div>
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-150"></div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>

                  {message.role === "assistant" && !message.isTyping && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* File upload preview */}
        {uploadedFiles.length > 0 && (
          <div className="px-4 py-2 border-t border-border/40 bg-accent/30">
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="bg-accent rounded-md p-2 flex items-center gap-2 group">
                  {file.type === "image" ? (
                    <Image className="h-4 w-4 text-primary" />
                  ) : (
                    <FileText className="h-4 w-4 text-primary" />
                  )}
                  <span className="text-xs text-foreground">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              ))}
              {isUploading && (
                <div className="bg-accent rounded-md p-2 flex items-center">
                  <span className="text-xs text-muted-foreground">Uploading...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border/40">
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder="Message RagFin AI..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-32 bg-accent/50 border-accent focus:ring-primary resize-none"
          />
          <div className="flex justify-between items-center">
            <div className="flex gap-1">
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} multiple />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => handleFileUpload("image")}
                title="Upload image"
              >
                <Image className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => handleFileUpload("document")}
                title="Upload document"
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Voice input"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleSend} className="px-4 bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

