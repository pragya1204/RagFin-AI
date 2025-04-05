"use client"

import { Calendar, CreditCard, Wallet } from "lucide-react"
import List01 from "./list-01"
import List02 from "./list-02"
import List03 from "./list-03"

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

const CHAT_INTERFACE_URL = "https://chat-interface-mu-silk.vercel.app/";
const DASHBOARD_URL = "https://dashboard-psi-seven-14.vercel.app/dashboard";
export default function () {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-20 w-64 border-r border-border/40 transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
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
            asChild // <-- Use asChild to render the Button as the child Link/a
          >
            <a href={CHAT_INTERFACE_URL}> {/* <-- Standard anchor tag */}
              <Users className="mr-2 h-4 w-4 text-primary" />
              Chat Interface
            </a>
          </Button>

          {/* Link to Dashboard App */}
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
            asChild // <-- Use asChild
          >
            <a href={DASHBOARD_URL}> {/* <-- Standard anchor tag */}
              <Users className="mr-2 h-4 w-4 text-primary" />
              Dashboard
            </a>
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/40">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <div className="flex items-center w-full">
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center mr-2">
                <span className="text-primary">JD</span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">John Doe</span>
                <span className="text-xs text-muted-foreground">
                  View Profile
                </span>
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "ml-64" : "ml-0"
        )}
      >
        {/* Dashboard Content */}
        <main className="p-6 overflow-auto">
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#1A1A2E] rounded-xl p-6 flex flex-col border border-[#2A2A35]">
                <h2 className="text-lg font-bold text-white mb-4 text-left flex items-center gap-2">
                  <Wallet className="w-3.5 h-3.5 text-[#8A7BFF]" />
                  Tax Notifications
                </h2>
                <div className="flex-1">
                  <List01 className="h-full" />
                </div>
              </div>
              <div className="bg-[#1A1A2E] rounded-xl p-6 flex flex-col border border-[#2A2A35]">
                <h2 className="text-lg font-bold text-white mb-4 text-left flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-[#8A7BFF]" />
                  Recent Tax Activities
                </h2>
                <div className="flex-1">
                  <List02 className="h-full" />
                </div>
              </div>
            </div>

            <div className="bg-[#1A1A2E] rounded-xl p-6 flex flex-col items-start justify-start border border-[#2A2A35]">
              <h2 className="text-lg font-bold text-white mb-4 text-left flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#8A7BFF]" />
                Upcoming Tax Tasks
              </h2>
              <List03 />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

