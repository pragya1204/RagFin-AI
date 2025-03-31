import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [currentChat, setCurrentChat] = useState([]);
  const [chatHistory, setChatHistory] = useState({});
  const [chatIdCounter, setChatIdCounter] = useState(1);
  const [userInput, setUserInput] = useState("");
  const [userImage, setUserImage] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch saved chats from the backend on mount
  useEffect(() => {
    async function fetchChats() {
      try {
        const res = await fetch("/chats");
        const chats = await res.json();
        const history = {};
        chats.forEach((chat) => {
          history[chat.session_id] = chat;
        });
        setChatHistory(history);
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    }
    fetchChats();
  }, []);

  // Generate a friendly chat title from the first query.
  const generateChatTitle = (query) => {
    const maxLength = 30;
    return query.length <= maxLength ? query : query.substring(0, maxLength).trim() + "...";
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleChatSelect = (chatId) => {
    setSelectedChat(chatId);
    setCurrentChat(chatHistory[chatId]?.messages || []);
  };

  const handleNewChat = () => {
    setCurrentChat([]);
    setSelectedChat(null);
  };

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => setUserImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!userInput.trim() && !userImage) return;

    let updatedChat = [...currentChat];

    // Add text message if exists
    if (userInput.trim()) {
      const newTextMsg = { role: "user", content: userInput.trim(), type: "text", timestamp: new Date().toLocaleTimeString() };
      updatedChat.push(newTextMsg);
    }
    // Add image message if exists
    if (userImage) {
      const newImageMsg = { role: "user", content: userImage, type: "image", timestamp: new Date().toLocaleTimeString() };
      updatedChat.push(newImageMsg);
    }

    // Only query backend if there's a text message
    if (userInput.trim()) {
      try {
        const payload = { query: userInput.trim() };
        if (selectedChat) payload.chat_id = selectedChat;
        const res = await fetch("/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        const backendResponse = data.answer || "No answer received.";
        const newAssistantMsg = { role: "assistant", content: backendResponse, type: "text", timestamp: new Date().toLocaleTimeString() };
        updatedChat.push(newAssistantMsg);
      } catch (error) {
        console.error("Error fetching response:", error);
        updatedChat.push({ role: "assistant", content: "Error fetching response.", type: "text", timestamp: new Date().toLocaleTimeString() });
      }
    }

    // Save or update the chat session
    let chatId = selectedChat;
    if (!chatId) {
      chatId = `Chat ${chatIdCounter}`;
      setChatIdCounter((prev) => prev + 1);
      const newChat = {
        session_id: chatId,
        title: generateChatTitle(userInput.trim() || "New Chat"),
        messages: updatedChat,
      };
      setChatHistory((prev) => ({ ...prev, [chatId]: newChat }));
      setSelectedChat(chatId);
    } else {
      setChatHistory((prev) => ({
        ...prev,
        [chatId]: { ...prev[chatId], messages: updatedChat },
      }));
    }
    setCurrentChat(updatedChat);
    setUserInput("");
    setUserImage(null);
  };

  return (
    <div className="app-container">
      <nav className="nav-bar">
        <div className="app-title">RagFin AI</div>
        <div className="welcome">Welcome back!</div>
      </nav>
      <div className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
        <button onClick={toggleSidebar} className="sidebar-toggle">
          {sidebarOpen ? "«" : "»"}
        </button>
        {sidebarOpen && (
          <div className="chat-list">
            <h2>Chat Sessions</h2>
            <button onClick={handleNewChat} id="newchatbtn">
              New Chat ➕
            </button>
            {Object.keys(chatHistory).length === 0 && <p>No chats yet.</p>}
            <ul>
              {Object.entries(chatHistory).map(([chatId, chat]) => (
                <li
                  key={chatId}
                  onClick={() => handleChatSelect(chatId)}
                  className={selectedChat === chatId ? "selected" : ""}
                >
                  {chat.title || chatId}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="chat-container">
        {currentChat.map((message, index) =>
          message.role === "user" ? (
            <div key={index} className="chat-row">
              <div className="user-bubble">
                <strong>User:</strong> {message.type === "text" ? message.content : <img src={message.content} alt="User Upload" />}
                <span className="timestamp">{message.timestamp}</span>
              </div>
              <div className="empty-col"></div>
            </div>
          ) : (
            <div key={index} className="chat-row">
              <div className="empty-col"></div>
              <div className="assistant-bubble">
                <strong>Assistant:</strong> {message.content}
                <span className="timestamp">{message.timestamp}</span>
              </div>
            </div>
          )
        )}
      </div>
      <div className="fixed-form">
        <form onSubmit={handleSend} className="chat-form">
          <input
            type="text"
            id="query"
            name="query"
            placeholder="Type your message here..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />
          <div className="file-actions">
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <button type="submit">Send</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
