"use client";

import type React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Settings,
  Users,
  BarChart2,
  X,
  Bot,
  Menu,
  History, // Still potentially used for the right panel itself
  User,
  Star, // Import Star icon for Premium button
} from "lucide-react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // State for the right panel (which is no longer toggled from header)
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - No changes */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 border-r border-border/40 bg-gradient-to-b from-background to-background/90 backdrop-blur-sm transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-gradient-to-r from-primary to-secondary glow-effect" />
              <span className="font-semibold text-foreground">RagFin AI</span>
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
        {/* Sidebar Navigation */}
        <ScrollArea className="h-[calc(100vh-130px)]">
          <div className="space-y-4 p-4">
            <nav className="space-y-1">
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent">
                <Users className="mr-2 h-4 w-4 text-primary/80" /> Dashboard
              </Button>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent">
                <Settings className="mr-2 h-4 w-4 text-primary/80" /> Settings
              </Button>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent">
                <Bot className="mr-2 h-4 w-4 text-secondary" /> AI Models
              </Button>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent">
                <BarChart2 className="mr-2 h-4 w-4 text-secondary" /> Analytics
              </Button>
            </nav>
          </div>
        </ScrollArea>
        {/* Sidebar Footer/Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/40">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent h-auto py-2">
            <div className="flex items-center w-full">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-2">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">John Doe</span>
                <span className="text-xs text-muted-foreground">View Profile</span>
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-64" : "ml-0"
        )}
      >
          {/* Main Header */}
          <header className="h-14 border-b border-border/40 px-4 flex items-center justify-between bg-background/95 backdrop-blur-sm sticky top-0 z-10">
            {/* Left side: Sidebar Toggle and Title */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 mr-2 text-muted-foreground hover:text-foreground lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <h1 className="text-sm font-medium text-foreground">AI Chat Interface</h1>
            </div>

            {/* Right side: ADDED Premium button */}
            <div className="flex items-center gap-2">
              {/* --- NEW Premium Button --- */}
              <Button
                  //variant="premium" // Use a custom variant or inline styles for gold effect
                  size="sm"
                  className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700" // Example gold gradient
                  onClick={() => { alert("Premium Feature Clicked!"); }} // Add desired onClick action
                  title="Upgrade to Premium"
              >
                  <Star className="h-4 w-4 mr-1.5 fill-current" /> {/* Use fill-current for filled star */}
                  Premium
              </Button>
              {/* --- END OF Premium Button --- */}

              {/* You might keep other header items here if needed later */}
               {/* Example: Button to toggle right panel if needed elsewhere */}
               {/* <Button variant="ghost" size="icon" onClick={() => setDetailsOpen(!detailsOpen)} title="Toggle Details"> <History /> </Button> */}

            </div>
          </header>

          {/* The actual page content (e.g., chat-interface) goes here */}
          <main className="flex-1 overflow-y-auto">
              {children}
          </main>

      </div> {/* End Main Content Area */}


      {/* Right Details Panel - Unchanged, remains hidden unless toggled elsewhere */}
      <div
          className={cn(
            "fixed inset-y-0 right-0 z-20 w-80 border-l border-border/40 bg-background/95 backdrop-blur-sm transition-transform duration-300 ease-in-out",
            detailsOpen ? "translate-x-0" : "translate-x-full",
          )}
      >
          <div className="h-14 border-b border-border/40 px-4 flex items-center justify-between">
            <h2 className="font-medium text-foreground">Conversation History</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setDetailsOpen(false)} title="Close History Panel" >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4 overflow-y-auto h-[calc(100vh-56px)]">
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Previous Conversations</h3>
              <ConversationHistoryPlaceholder />
            </div>
          </div>
      </div>

    </div> // End Root Flex Container
  );
}

// --- Placeholder for Conversation History --- unchanged
function ConversationHistoryPlaceholder() {
  const conversations = [
    { id: 1, title: "Financial Analysis", date: "Apr 1, 2025", preview: "Analysis of Q1 financial data..." },
    { id: 2, title: "Market Research", date: "Mar 28, 2025", preview: "Competitive analysis of..." },
    { id: 3, title: "Investment Strategy", date: "Mar 25, 2025", preview: "Long-term investment..." },
  ];
  return (
    <div className="space-y-3">
      {conversations.map((convo) => (
        <div key={convo.id} className="p-2 rounded-md bg-accent/50 hover:bg-accent cursor-pointer">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-foreground truncate">{convo.title}</h4>
            <span className="text-xs text-muted-foreground">{convo.date}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-1">{convo.preview}</p>
        </div>
      ))}
       <p className="text-xs text-muted-foreground text-center pt-2">History loading not implemented here.</p>
    </div>
  );
}