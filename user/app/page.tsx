// user/app/page.tsx
import ChatInterface from "@/chat-interface"; // Corrected import path

export default function Home() {
  return (
    // flex-1 ensures it takes remaining space if layout provides flex container
    <main className="flex flex-col flex-1 h-full">
      {/* Render the chat interface */}
      <ChatInterface />
    </main>
  );
}