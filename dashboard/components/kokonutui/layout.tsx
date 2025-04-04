"use client"

import type { ReactNode } from "react"
import TopNav from "./top-nav"
import { useEffect, useState } from "react"

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex h-screen flex-col dark">
      <header className="h-16 border-b border-[#2A2A35]">
        <TopNav />
      </header>
      <main className="flex-1 overflow-auto p-6 bg-[#0F0F1A]">{children}</main>
    </div>
  )
}

