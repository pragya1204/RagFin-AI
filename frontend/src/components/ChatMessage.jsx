import React from 'react';

function ChatMessage({ message }) {
  return (
    <div className="chat-message">
      <span className="timestamp">{message.timestamp}</span>
      {message.type === 'text' ? (
        <p>{message.content}</p>
      ) : (
        <img src={message.content} alt="Uploaded" />
      )}
    </div>
  );
}

export default ChatMessage;
