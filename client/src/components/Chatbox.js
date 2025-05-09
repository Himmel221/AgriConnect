import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, UserCircle, X, MessageCircle, Clock, Check, CheckCheck, Smile, Image as ImageIcon, Upload, Send } from "lucide-react";
import { io } from "socket.io-client";
import axios from "axios";
import "./css/Chatbox.css";

const socket = io("http://localhost:5000");

// optional dagdagan yo lattan nu inya
const EmojiPicker = ({ onEmojiSelect, onClose }) => {
  const emojis = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "✨"];
  
  return (
    <div className="emoji-picker">
      {emojis.map((emoji, index) => (
        <button key={index} onClick={() => onEmojiSelect(emoji)}>
          {emoji}
        </button>
      ))}
      <button className="close-emoji" onClick={onClose}>×</button>
    </div>
  );
};


const Message = React.memo(({ message, isOutgoing, userId, onReactionAdd }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  
  useEffect(() => {
    if (message.imageUrl) {
      console.log("Message has image URL:", message.imageUrl);
    }
  }, [message.imageUrl]);
  
  const handleReactionClick = useCallback((emoji) => {
    if (!message._id) {
      console.error("Cannot add reaction: Message has no valid ID", message);
      alert("Cannot add reaction to this message yet");
      setShowEmojiPicker(false);
      return;
    }
    
    onReactionAdd(message._id, emoji);
    setShowEmojiPicker(false);
  }, [message._id, onReactionAdd]);
  
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error("Invalid timestamp:", timestamp);
      return "";
    }
  };

  
  const renderMessageStatus = () => {
    if (!isOutgoing) return null;
    
    if (message.isRead) {
      return <CheckCheck size={14} className="message-read" />;
    } else if (message.isDelivered) {
      return <CheckCheck size={14} />;
    } else {
      return <Check size={14} />;
    }
  };
  
 
  const handleImageLoad = useCallback(() => {
    console.log("Image loaded successfully:", message.imageUrl);
    setImageLoaded(true);
    setImageError(false);
  }, [message.imageUrl]);
  
  
  const handleImageError = useCallback(() => {
    console.error("Failed to load image:", message.imageUrl);
    setImageError(true);
    setImageLoaded(false);
  }, [message.imageUrl]);
  
  return (
    <div className={`message ${isOutgoing ? "outgoing" : "incoming"}`}>
      {/* Role badge - display user role */}
      {message.senderRole && (
        <div className={`role-badge ${message.senderRole.toLowerCase()}`}>
          {message.senderRole}
        </div>
      )}
      
      {/* Message content */}
      <div className="message-content">
        {message.content && message.content !== "📷 Image" && (
          <div className="message-text">{message.content}</div>
        )}
        
        
        {message.imageUrl && !imageError && (
          <div className="message-image-container">
            <img 
              src={message.imageUrl} 
              alt="Attached image" 
              className={`message-image ${imageLoaded ? 'loaded' : ''}`}
              onClick={() => window.open(message.imageUrl, '_blank')}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
              
              key={message.imageUrl}
            />
            {!imageLoaded && (
              <div className="image-loading">Loading...</div>
            )}
          </div>
        )}
        
        
        {message.imageUrl && imageError && (
          <div className="image-error">
            <span>Failed to load image: {message.imageUrl.substring(0, 30)}...</span>
          </div>
        )}
      </div>
      
      <div className="message-footer">
        <span className="message-time">{formatTime(message.createdAt)}</span>
        {isOutgoing && (
          <span className="message-status">
            {renderMessageStatus()}
          </span>
        )}
        <button 
          className="reaction-button" 
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          aria-label="Add reaction"
        >
          <Smile size={14} />
        </button>
        {showEmojiPicker && (
          <EmojiPicker 
            onEmojiSelect={handleReactionClick}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
      </div>
      
      {message.reactions && message.reactions.length > 0 && (
        <div className="message-reactions">
          {message.reactions.map((reaction, index) => (
            <span key={`${reaction.emoji}-${index}`} className="reaction">
              {reaction.emoji}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

const Chatbox = () => {
  const [userId, setUserId] = useState(null); 
  const [userRole, setUserRole] = useState("Buyer"); 
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [activeRecipientId, setActiveRecipientId] = useState(null);
  const [activeRecipientName, setActiveRecipientName] = useState("");
  const [activeRecipientRole, setActiveRecipientRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageContainerHeight, setImageContainerHeight] = useState(0);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageContainerRef = useRef(null);

  const apiUrl = process.env.REACT_APP_API_URL;

  
  useEffect(() => {
    if (imagePreview) {
      
      setImageContainerHeight(170); 
    } else {
      setImageContainerHeight(0);
    }
  }, [imagePreview]);

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
          // Set user role from the server response adjust niyo na lang base sa api
          setUserRole(response.data.role || "Buyer");
        }
      } catch (error) {
        console.error("Error fetching user:", error.response?.data || error.message);
      }
    };
  
    fetchUser();
  }, []);

  
  useEffect(() => {
    if (userId) {
      
      socket.disconnect();
      socket.connect();
      
      
      socket.on("connect", () => {
        console.log("Socket reconnected with new user ID:", userId);
        
        
        if (activeRecipientId) {
          socket.emit("joinRoom", { senderId: userId, recipientId: activeRecipientId });
        }
      });
      
      return () => {
        socket.off("connect");
      };
    }
  }, [userId, activeRecipientId]);

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
        if (error.response && error.response.status === 404) {
          
          console.warn("No conversations found or endpoint not available yet");
          setRecipients([]); 
        } else {
          console.error("Error fetching conversations:", error.response?.data || error.message);
        }
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
          
          if (response.data.length > 0) {
            console.log("Sample messages received:", response.data.slice(0, 2));
          }
          
          setMessages(response.data);
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          
          // Mark messages as read
          markMessagesAsRead();
        } else {
          console.error("Failed to fetch messages:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching messages:", error.message);
      }
    };

    
    const fetchRecipientDetails = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(
          `http://localhost:5000/api/users/${activeRecipientId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 200) {
          setActiveRecipientRole(response.data.role || "Unknown");
        }
      } catch (error) {
        console.error("Error fetching recipient details:", error.message);
        setActiveRecipientRole("Unknown");
      }
    };

    fetchMessages();
    fetchRecipientDetails();
    socket.emit("joinRoom", { senderId: userId, recipientId: activeRecipientId });
    
    return () => {
      socket.emit("leaveRoom", { senderId: userId, recipientId: activeRecipientId });
    };
  }, [userId, activeRecipientId]);

  
  useEffect(() => {
    
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  }, [messages, imagePreview]);
  
  const markMessagesAsRead = useCallback(async () => {
    if (!activeRecipientId || !userId) return;
    
    try {
      const token = localStorage.getItem("authToken");
      await axios.put(
        `http://localhost:5000/api/messages/${userId}/${activeRecipientId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      socket.emit("messagesRead", { senderId: userId, recipientId: activeRecipientId });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [userId, activeRecipientId]);

  useEffect(() => {
    
    if (!socket.connected) {
      socket.connect();
    
    }
    
    const handleReceiveMessage = (message) => {
      console.log("Received message:", message);
      
      
      if (message.imageUrl) {
        console.log("Message contains image URL:", message.imageUrl);
      }
      
      setMessages((prevMessages) => [...prevMessages, message]);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      
      
      if (activeRecipientId === message.senderId) {
        markMessagesAsRead();
      }
    };
    
    const handleMessagesRead = (data) => {
      if (data.senderId === activeRecipientId) {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.senderId === userId ? { ...msg, isRead: true } : msg
          )
        );
      }
    };
    
    const handleMessageDelivered = (data) => {
      if (data.recipientId === activeRecipientId) {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.senderId === userId && !msg.isRead ? { ...msg, isDelivered: true } : msg
          )
        );
      }
    };
    
    const handleMessageReaction = (data) => {
      
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg._id === data.messageId) {
            
            const reactionExists = (msg.reactions || []).some(
              r => r.emoji === data.reaction.emoji && r.userId === data.reaction.userId
            );
            
            
            if (!reactionExists) {
              return { 
                ...msg, 
                reactions: [...(msg.reactions || []), data.reaction] 
              };
            }
          }
          return msg;
        })
      );
    };
    
    const handleUserTyping = (data) => {
      if (data.senderId === activeRecipientId) {
        setTypingUsers(prev => ({
          ...prev,
          [data.senderId]: true
        }));
        
        
        setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [data.senderId]: false
          }));
        }, 3000);
      }
    };
    
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("messageDelivered", handleMessageDelivered);
    socket.on("messageReaction", handleMessageReaction);
    socket.on("userTyping", handleUserTyping);
    
    
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      
      setTimeout(() => {
        if (!socket.connected) socket.connect();
      }, 5000);
    });

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("messageDelivered", handleMessageDelivered);
      socket.off("messageReaction", handleMessageReaction);
      socket.off("userTyping", handleUserTyping);
      socket.off("connect_error");
    };
  }, [userId, activeRecipientId, markMessagesAsRead]);

  
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size exceeds 5MB limit");
      e.target.value = ""; 
      return;
    }
    
     
    if (!file.type.match('image.*')) {
      alert("Please select an image file");
      e.target.value = ""; 
      return;
    }
    
    console.log("Image selected:", file.name, file.type, file.size);
    setSelectedImage(file);
    
    // preview with proper sizing
    const reader = new FileReader();
    reader.onloadend = () => {
      
      setImagePreview(reader.result);
      
      // scroll delay
      setTimeout(() => {
        // Scroll to bottom siguro
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    };
    reader.readAsDataURL(file);
  };
  
  
  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageContainerHeight(0);
    
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
   
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const ensureCloudinaryCorsHeaders = (url) => {
    if (!url) return url;
    
    
    if (url.includes('cloudinary.com') && !url.includes('fl_attachment')) {
      return url + (url.includes('?') ? '&' : '?') + 'fl_attachment';
    }
    
    return url;
  };

  const calculateImageDimensions = (originalWidth, originalHeight, maxWidth = 280, maxHeight = 150) => {
    let width = originalWidth;
    let height = originalHeight;
    
    
    if (width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = height * ratio;
    }
    
    
    if (height > maxHeight) {
      const ratio = maxHeight / height;
      height = maxHeight;
      width = width * ratio;
    }
    
    return { width, height };
  };
  
  const uploadImage = useCallback(async () => {
    if (!selectedImage) return null;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No auth token found");
        setIsUploading(false);
        return null;
      }
      
      console.log("Starting image upload to server...");
      
      const response = await axios.post(
        "http://localhost:5000/api/uploads/images",
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'  
          } 
        }
      );
      
      console.log("Upload response:", response);
      
      if (response.status === 201 && response.data && response.data.imageUrl) {
        console.log("Image uploaded successfully, URL:", response.data.imageUrl);
        
       
        const urlTest = new Image();
        urlTest.onload = () => console.log("Image URL is valid and accessible");
        urlTest.onerror = () => console.error("Image URL exists but might not be accessible");
        urlTest.src = response.data.imageUrl;
        
        return response.data.imageUrl;
      }
      
      console.error("Failed to upload image, server returned:", response.status, response.data);
      return null;
    } catch (error) {
      console.error("Error uploading image:", error.response?.data || error.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [selectedImage]);

  const sendMessage = useCallback(async () => {
    if (!activeRecipientId || (!newMessage.trim() && !selectedImage)) return;
    
    if (isUploading) {
      return; 
    }
  
    const token = localStorage.getItem("authToken"); 
  
    if (!token) {
      console.error("No auth token found. Please log in again.");
      return;
    }
  
    try {
      
      const tempMessageId = `temp-${Date.now()}`;
      
      
      const tempMessage = {
        _id: tempMessageId,
        senderId: userId,
        recipientId: activeRecipientId,
        content: newMessage.trim() || (selectedImage ? "📷 Image" : ""),
        createdAt: new Date().toISOString(),
        isDelivered: false,
        isRead: false,
        reactions: [],
        senderRole: userRole,
        
        isPending: true
      };
      
     
      if (selectedImage) {
        tempMessage.imageUrl = imagePreview; 
      }
      

      setMessages(prev => [...prev, tempMessage]);
      
   
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      
     
      const messageText = newMessage.trim();
      setNewMessage("");
      
     
      let imageUrl = null;
      if (selectedImage) {
        setIsUploading(true);
        imageUrl = await uploadImage();
        setIsUploading(false);
        
        if (!imageUrl && !messageText) {
          
          setMessages(prev => prev.filter(msg => msg._id !== tempMessageId));
          alert("Failed to upload image. Please try again.");
          return;
        }
      }
          if (imageUrl) {
            imageUrl = ensureCloudinaryCorsHeaders(imageUrl);
            console.log("Final image URL with CORS handling:", imageUrl);
          }
      
     
      const messageData = {
        senderId: userId, 
        recipientId: activeRecipientId, 
        content: messageText || (imageUrl ? "📷 Image" : ""),
        imageUrl: imageUrl,
        createdAt: new Date().toISOString(),
        isDelivered: false,
        isRead: false,
        reactions: [],
        senderRole: userRole
      };
      

      const response = await axios.post(`${apiUrl}/api/messages`, messageData, {
        headers: { Authorization: `Bearer ${token}` }, 
      });
      
      if (response.status === 201) {
      
        const sentMessage = response.data;
        
        setMessages(prev => prev.map(msg => 
          msg._id === tempMessageId ? sentMessage : msg
        ));
        
        socket.emit("sendMessage", sentMessage);
        
     
        socket.emit("messageDelivered", { 
          messageId: sentMessage._id,
          senderId: userId,
          recipientId: activeRecipientId
        });
        
  
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error.message);
    }
  }, [userId, activeRecipientId, newMessage, selectedImage, userRole, isUploading, imagePreview, uploadImage]);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
   
    if (!isTyping && activeRecipientId) {
      socket.emit("typing", { senderId: userId, recipientId: activeRecipientId });
      setIsTyping(true);
    }
    
   
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSearch = useCallback(async (e) => {
    const query = e.target.value;
    setSearchTerm(query);

    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No auth token found");
        return;
      }
      
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
  }, []);

  const handleSelectUser = useCallback((userId, userName, userRole) => {
    setActiveRecipientId(userId); 
    setActiveRecipientName(userName);
    setActiveRecipientRole(userRole || "Unknown");
    setSearchResults([]);
    setSearchTerm("");
  }, []);

  const handleReactionAdd = useCallback(async (messageId, emoji) => {
    
    if (!messageId || !emoji || !userId || !activeRecipientId) {
      console.error("Missing data for reaction:", { messageId, emoji, userId, activeRecipientId });
      return;
    }
    
    try {
      console.log("Adding reaction:", emoji, "to message:", messageId);
      
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No auth token found");
        return;
      }
      
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === messageId 
            ? { 
                ...msg, 
                reactions: [...(msg.reactions || []), { emoji, userId }] 
              } 
            : msg
        )
      );
      
      try {
       
        const response = await axios.post(
          `http://localhost:5000/api/messages/${messageId}/reactions`,
          { emoji, userId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.status === 200) {
      
          socket.emit("messageReaction", {
            messageId,
            reaction: { emoji, userId },
            recipientId: activeRecipientId
          });
          
          console.log("Reaction added successfully");
        }
      } catch (apiError) {
        
        if (apiError.response && apiError.response.status === 404) {
          console.warn("API endpoint not found for reactions, but keeping optimistic update");
          
          
          socket.emit("messageReaction", {
            messageId,
            reaction: { emoji, userId },
            recipientId: activeRecipientId
          });
        } else {
          
          throw apiError; 
        }
      }
    } catch (error) {
      console.error("Error adding reaction:", error.response?.data || error.message);
      
    
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === messageId 
            ? { 
                ...msg, 
                reactions: (msg.reactions || []).filter(r => !(r.emoji === emoji && r.userId === userId))
              } 
            : msg
        )
      );
    }
  }, [userId, activeRecipientId]);

  
  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  
  const handleLogout = () => {
    socket.disconnect();
    setUserId(null);
    setMessages([]);
    setRecipients([]);
    setActiveRecipientId(null);
    setActiveRecipientName("");
    setIsOpen(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socket.disconnect();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {!isOpen && (
        <div className="chatbox-icon" onClick={toggleChatbox}>
          <MessageCircle size={24} color="white" />
        </div>
      )}
  
      {isOpen && (
        <div className="chatbox-container">
          <div className={`chatbox ${isOpen ? "open" : ""}`}>
            {!activeRecipientId ? (
              <>
                {/* 🔹 Search Bar */}
                <div className="chatbox-search">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                  <button className="chatbox-close" onClick={toggleChatbox}>✖</button>
                </div>
  
                {/* 🔹 Recent Conversations List */}
                <ul className="chatbox-conversations">
                  {(searchResults.length > 0 ? searchResults : recipients).map((user) => (
                    <li
                      key={user._id || user.participantId}
                      onClick={() =>
                        handleSelectUser(
                          user._id || user.participantId,
                          user.name || user.participantName,
                          user.role || user.participantRole
                        )
                      }
                      className="chatbox-conversation-item"
                    >
                      <UserCircle size={32} />
                      <div className="conversation-info">
                        <span className="conversation-name">
                          {user.name || user.participantName}
                        </span>
                        <span className="conversation-role">
                          {user.role || user.participantRole || "User"}

                        </span>
                      </div>
                    </li>
                  ))}

                  {recipients.length === 0 && searchResults.length === 0 && (
                    <li className="no-conversations">
                      <p>No conversations yet</p>
                      <p>Search for users to start chatting</p>
                    </li>
                  )}
                </ul>
              </>
            ) : (
              <>
                {/* 🔹 Chat Header */}
                <div className="chatbox-header">
                  <div className="recipient-info">
                    <button 
                      className="back-button"
                      onClick={() => setActiveRecipientId(null)}
                      aria-label="Back to conversations"
                    >
                      <X size={18} />
                    </button>
                    <UserCircle size={28} />
                    <div>
                      <h3>{activeRecipientName}</h3>
                      <span className="recipient-role">{activeRecipientRole}</span>
                    </div>
                  </div>
                  <button className="chatbox-close" onClick={toggleChatbox}>
                    <X size={18} />
                  </button>
                </div>

                {/* 🔹 Messages Container */}
                <div className="chatbox-messages">
                  {messages.length === 0 ? (
                    <div className="no-messages">
                      <p>No messages yet</p>
                      <p>Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <Message
                        key={message._id}
                        message={message}
                        isOutgoing={message.senderId === userId}
                        userId={userId}
                        onReactionAdd={handleReactionAdd}
                      />
                    ))
                  )}
                  
                  {/* Typing indicator */}
                  {typingUsers[activeRecipientId] && (
                    <div className="typing-indicator">
                      <span>{activeRecipientName} is typing...</span>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Image preview area */}
                <div 
                  className="image-preview-container" 
                  style={{ height: `${imageContainerHeight}px` }}
                  ref={imageContainerRef}
                >
                  {imagePreview && (
                    <div className="image-preview">
                      <img 
                        src={imagePreview} 
                        alt="Selected" 
                        className="preview-image"
                      />
                      <button 
                        className="remove-image" 
                        onClick={removeSelectedImage}
                        aria-label="Remove image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* 🔹 Message Input */}
                <div className="chatbox-input">
                  <textarea
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    disabled={isUploading}
                  />
                  <div className="input-actions">
                    <button 
                      className="attach-image" 
                      onClick={handleImageButtonClick}
                      disabled={isUploading}
                      aria-label="Attach image"
                    >   
                      <ImageIcon size={20} />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageSelect}
                      style={{ display: "none" }}
                      accept="image/*"
                    />
                    <button 
                      className="send-button" 
                      onClick={sendMessage}
                      disabled={(!newMessage.trim() && !selectedImage) || isUploading}
                      aria-label="Send message"
                    >
                      {isUploading ? (
                        <div className="loading-spinner" />
                      ) : (
                        <Upload size={20} />
                      )}
                    </button>
                  </div>
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

// On few notes, rendering issue ng image ang problem, you won't see it on the chatbox if nasend
// nakakasend kaso hindi mo makikita HAHAHAHHAHAHA
// about sa design, kayo na lang bahala madali na lang 'yon
// line 190 to 448 ang issue if wala ron nasa tuloy ng 448 pababa
// made some several changes, chatbox.js, chatbox.css, uploadRoute.js (new) at server.js
// THERE WAS A MEMO NA WALANG DELETE FUNCTION SA IMAGE KAYA DON'T ASK ME WHY IT ISN'T INCLUDED. T H E R E W A S A M E M O
// wala rin sa kontrata na need maglagay ng delete function on the image.
// Right click > Inspect > Console to see some hidden errors
// Don't mind about the payment, idefend niyo na lang.
// - JJHXCJG