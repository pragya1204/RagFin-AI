// user/components/ChatHeader.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, History, Save } from "lucide-react"; // Icons for buttons
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub, // Optional: If you want submenus later
    DropdownMenuSubTrigger, // Optional
    DropdownMenuPortal, // Optional
    DropdownMenuSubContent // Optional
} from "@/components/ui/dropdown-menu"; // Ensure DropdownMenu components are imported

// Define the structure for chat history items expected from the parent
interface ChatHistoryItem {
    session_id: string;
    title: string;
    last_updated?: string; // ISO String format expected
}

// Define the props the component expects
interface ChatHeaderProps {
    chatHistory: ChatHistoryItem[];
    onNewChat: () => void;
    onSaveChat: () => void;
    onLoadChat: (sessionId: string) => void;
    currentChatId: string | null;
    isHistoryLoading?: boolean; // Optional: To show loading state in dropdown
}

export function ChatHeader({
    chatHistory,
    onNewChat,
    onSaveChat,
    onLoadChat,
    currentChatId,
    isHistoryLoading // Destructure optional prop
}: ChatHeaderProps) {

    // Helper to format date nicely
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Unknown date';
        try {
            // Format to locale date and time, adjust options as needed
            return new Date(dateString).toLocaleString(undefined, {
                dateStyle: 'short',
                timeStyle: 'short'
            });
        } catch (e) {
            return dateString; // Fallback to original string if parsing fails
        }
    };

    return (
        // This container holds the buttons below the main app header
        <div className="flex items-center justify-end gap-2 p-2 border-b border-border/40 bg-background/95 backdrop-blur-sm">
            {/* New Chat Button */}
            <Button variant="outline" size="sm" onClick={onNewChat} title="Start New Chat">
                <PlusCircle className="h-4 w-4 mr-1.5" />
                New Chat
            </Button>

            {/* History Dropdown Button */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" title="View Chat History">
                        <History className="h-4 w-4 mr-1.5" />
                        History
                        {isHistoryLoading && <span className="ml-1.5 text-xs text-muted-foreground">(Loading...)</span>}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto"> {/* Added max-height and overflow */}
                    <DropdownMenuLabel>Chat History</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {chatHistory.length > 0 ? (
                        chatHistory.map((chat) => (
                            <DropdownMenuItem
                                key={chat.session_id}
                                onClick={() => onLoadChat(chat.session_id)}
                                disabled={chat.session_id === currentChatId} // Disable if it's the currently loaded chat
                                className="text-xs cursor-pointer flex flex-col items-start p-2" // Styling for items
                            >
                                {/* Use truncate to prevent long titles from breaking layout */}
                                <span className="font-medium truncate w-full" title={chat.title}>
                                    {chat.title || "Untitled Chat"}
                                </span>
                                <span className="text-muted-foreground text-[10px] w-full">
                                    {formatDate(chat.last_updated)}
                                </span>
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <DropdownMenuItem disabled className="text-xs text-muted-foreground text-center p-2">
                            {isHistoryLoading ? "Loading history..." : "No saved chats found."}
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Save Chat Button */}
            <Button
                variant="outline"
                size="sm"
                onClick={onSaveChat}
                title="Save Current Chat"
                // Disable if it's a new chat (no currentChatId) or if there are no messages to save (optional check)
                disabled={!currentChatId}
            >
                <Save className="h-4 w-4 mr-1.5" />
                Save
            </Button>
        </div>
    );
}