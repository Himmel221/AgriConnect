import React, { useState, useEffect, useRef } from "react";
import { Search, UserCircle, X, MessageCircle } from "lucide-react";
import { io } from "socket.io-client";
import axios from "axios";
import "./css/Chatbox.css";

const socket = io("http://localhost:5000");

const Chatbox = () => {
  const [userId, setUserId] = useState(null); 
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [activeRecipientId, setActiveRecipientId] = useState(null);
  const [activeRecipientName, setActiveRecipientName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef(null);

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("authToken");
  
      if (!token) {
        console.error("No auth token found. Please log in again.");
        return;
      }
  
      try {
        const response = await axios.get(`${apiUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (response.status === 200) {
          setUserId(response.data._id); 
        }
      } catch (error) {
        console.error("Error fetching user:", error.response?.data || error.message);
      }
    };
  
    fetchUser();
  }, []);

  const toggleChatbox = () => {
    setIsOpen((prevState) => !prevState);
  };

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(
          `${apiUrl}/api/messages/${userId}/conversations`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 200) {
          setRecipients(response.data);
        } else {
          console.error("Failed to fetch conversations:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error.message);
      }
    };

    fetchConversations();
  }, [userId, isOpen]);

  useEffect(() => {
    if (!activeRecipientId || !userId) return;

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(
          `${apiUrl}/api/messages/${userId}/${activeRecipientId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 200) {
          setMessages(response.data);
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        } else {
          console.error("Failed to fetch messages:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching messages:", error.message);
      }
    };

    fetchMessages();
    socket.emit("joinRoom", { senderId: userId, recipientId: activeRecipientId });
  }, [userId, activeRecipientId]);

  useEffect(() => {
    socket.on("receiveMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });

    return () => {
      socket.off("receiveMessage"); 
    };
  }, []);

  const sendMessage = async () => {
    if (!activeRecipientId || !newMessage.trim()) return;
  
    const token = localStorage.getItem("authToken"); 
  
    if (!token) {
      console.error("No auth token found. Please log in again.");
      return;
    }
  
    const messageData = {
      senderId: userId, 
      recipientId: activeRecipientId, 
      content: newMessage,
    };
  
    try {
      const response = await axios.post(`${apiUrl}/api/messages`, messageData, {
        headers: { Authorization: `Bearer ${token}` }, 
      });
  
      if (response.status === 201) {
        setMessages((prev) => [...prev, response.data]); 
        socket.emit("sendMessage", response.data); 
      }
  
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error.message);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchTerm(query);

    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${apiUrl}/api/users/search/${query}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setSearchResults(response.data);
      } else {
        console.error("Failed to search users:", response.data.message);
      }
    } catch (error) {
      console.error("Error searching users:", error.message);
    }
  };

  const handleSelectUser = (userId, userName) => {
    setActiveRecipientId(userId); 
    setActiveRecipientName(userName);
    setSearchResults([]);
    setSearchTerm("");
  };

  return (
    <>
      {/* 🔹 Chatbox Icon to Open */}
      {!isOpen && (
        <div className="chatbox-icon" onClick={toggleChatbox}>
          <MessageCircle size={24} color="white" />
        </div>
      )}
  
      {/* 🔹 Chatbox Container (Appears Only When Open) */}
      {isOpen && (
        <div className="chatbox-container">
          <div className={`chatbox ${isOpen ? "open" : ""}`}>
            
            {!activeRecipientId ? (
              <>
                {/* 🔹 Search Bar (X button overlays here) */}
                <div className="chatbox-search">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                  {/* 🔹 Close Button Inside Search Bar */}
                  <button className="chatbox-close" onClick={toggleChatbox}>✖</button>
                </div>
  
                {/* 🔹 Recent Conversations List */}
                <ul className="chatbox-conversations">
                  {searchResults.length > 0
                    ? searchResults.map((user) => (
                        <li key={user._id} onClick={() => handleSelectUser(user._id, `${user.first_name} ${user.last_name}`)}>
                          <UserCircle size={20} />
                          {`${user.first_name} ${user.last_name}`}
                        </li>
                      ))
                    : recipients.map((recipient) => (
                        <li key={recipient.participantId} onClick={() => setActiveRecipientId(recipient.participantId)}>
                          <UserCircle size={20} />
                          {recipient.latestMessage.senderName || "User"}
                        </li>
                      ))}
                </ul>
              </>
            ) : (
              /* 🔹 Show Full-Screen Chat When a Conversation Is Selected */
              <>
                <div className="chatbox-header">
                  <button className="chatbox-back" onClick={() => setActiveRecipientId(null)}>
                    ← Back
                  </button>
                  <UserCircle size={24} />
                  <h4>Chat with {activeRecipientName}</h4>
                </div>
  
                {/* 🔹 Messages */}
                <div className="chatbox-body">
                  {messages.map((msg, index) => (
                    <div key={index} className={msg.senderId === userId ? "outgoing" : "incoming"}>
                      {msg.content}
                    </div>
                  ))}
                  <div ref={messagesEndRef}></div>
                </div>
  
                {}
                <div className="chatbox-footer">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                  />
                  <button onClick={sendMessage}>Send</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbox; 