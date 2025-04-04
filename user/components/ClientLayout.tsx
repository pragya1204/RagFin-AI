"use client"

import type React from "react"
import { Metadata } from "next"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import logo from "@/public/ragfin_logo.jpg"
import Image from "next/image"
import {
  Settings,
  Users,
  SettingsIcon as Functions,
  Layers,
  BarChart2,
  X,
  MessageSquare,
  Database,
  Bot,
  Menu,
  History,
  User,
} from "lucide-react"

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-20 w-64 border-r border-border/40 futuristic-gradient transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
            <Image src={logo} alt="Logo" width={24} height={24} className="rounded-full" />
            <span className="font-semibold text-primary">RagFin AI</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-130px)]">
          <div className="space-y-4 p-4">
            <nav className="space-y-2">
              
            <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <Users className="mr-2 h-4 w-4 text-primary" />
                Chat Interface
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <Users className="mr-2 h-4 w-4 text-primary" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <Settings className="mr-2 h-4 w-4 text-primary" />
                Settings
              </Button>
            </nav>
            <div className="pt-4 border-t border-border/40">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <Bot className="mr-2 h-4 w-4 text-secondary" />
                AI Models
              </Button>
             
            </div>
          </div>
        </ScrollArea>

        {/* Profile section at bottom of sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/40">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <div className="flex items-center w-full">
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center mr-2">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">John Doe</span>
                <span className="text-xs text-muted-foreground">View Profile</span>
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn("flex-1 flex transition-all duration-300 ease-in-out", sidebarOpen ? "ml-64" : "ml-0")}>
        <div className="flex-1 flex flex-col relative">
          {/* Header */}
          <header className="h-14 border-b border-border/40 px-4 flex items-center justify-between futuristic-gradient">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 mr-2 text-muted-foreground hover:text-foreground"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <h1 className="text-sm font-medium text-primary"> AI Chat Interface</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                onClick={() => setDetailsOpen(!detailsOpen)}
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Save conversation
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>
          {children}
        </div>

        {/* Right Panel - Conversation Details */}
        <div
          className={cn(
            "fixed inset-y-0 right-0 z-20 w-80 border-l border-border/40 futuristic-gradient transition-transform duration-300 ease-in-out",
            detailsOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="h-14 border-b border-border/40 px-4 flex items-center justify-between">
            <h2 className="font-medium text-primary">Conversation History</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setDetailsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4">
            <div className="flex gap-4 border-b border-border/40 pb-4">
              <Button variant="secondary" size="sm" className="rounded-full">
                Recent
              </Button>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Previous Conversations</h3>
              <ConversationHistory />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConversationHistory() {
  const conversations = [
    { id: 1, title: "Financial Analysis", date: "Apr 1, 2025", preview: "Analysis of Q1 financial data..." },
    { id: 2, title: "Market Research", date: "Mar 28, 2025", preview: "Competitive analysis of..." },
    { id: 3, title: "Investment Strategy", date: "Mar 25, 2025", preview: "Long-term investment..." },
    { id: 4, title: "Portfolio Review", date: "Mar 22, 2025", preview: "Quarterly portfolio review..." },
    { id: 5, title: "Risk Assessment", date: "Mar 20, 2025", preview: "Evaluation of market risks..." },
  ]

  return (
    <div className="space-y-3">
      {conversations.map((convo) => (
        <div key={convo.id} className="p-2 rounded-md bg-accent/50 hover:bg-accent cursor-pointer">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-foreground">{convo.title}</h4>
            <span className="text-xs text-muted-foreground">{convo.date}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-1">{convo.preview}</p>
        </div>
      ))}
    </div>
  )
}



