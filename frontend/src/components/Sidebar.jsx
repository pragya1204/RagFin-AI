import React from 'react';

function Sidebar() {
  // For demo purposes, using static chat history
  const history = [
    { text: "Welcome to your chat history!", timestamp: "10:00 AM" },
    { text: "Query: How do I file my taxes?", timestamp: "10:05 AM" },
    { text: "Query: What's my budget status?", timestamp: "10:10 AM" },
  ];

  return (
    <div className="sidebar">
      <h2>Chat History</h2>
      <ul>
        {history.map((item, index) => (
          <li key={index}>
            <span className="history-timestamp">{item.timestamp}</span>
            <p>{item.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
