import React, { useState } from 'react';

function ChatInput({ onSend }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);

  const handleSend = () => {
    if (!text && !image) return;
    const message = {
      type: image ? 'image' : 'text',
      content: image ? image : text,
      timestamp: new Date().toLocaleTimeString(),
    };
    onSend(message);
    setText('');
    setImage(null);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input">
      <textarea
        placeholder="Type your message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <div className="input-actions">
        <input type="file" accept="image/*" onChange={handleImageChange} />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default ChatInput;
