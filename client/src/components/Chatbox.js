import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, UserCircle, X, MessageCircle, Clock, Check, CheckCheck, Smile, Image as ImageIcon, Upload, Send, ArrowLeft, Video, Settings, HelpCircle } from "lucide-react";
import { io } from "socket.io-client";
import axios from "axios";
import "./css/Chatbox.css";
import { useNavigate } from 'react-router-dom';
import { compressImage, validateImageFile } from '../utils/imageUtils';

const socket = io("http://localhost:5000");

const EmojiPicker = ({ onEmojiSelect, onClose }) => {
  const emojis = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "✨"];
  
  // Test function to verify emojis
  const testEmojis = () => {
    console.log("=== EMOJI TEST ===");
    emojis.forEach((emoji, index) => {
      console.log(`Emoji ${index}:`, {
        emoji,
        type: typeof emoji,
        length: emoji.length,
        charCode: emoji.charCodeAt(0),
        stringified: JSON.stringify(emoji),
        isValid: emoji && emoji.trim() !== ''
      });
    });
    console.log("==================");
  };
  
  // Test emojis on component mount
  React.useEffect(() => {
    testEmojis();
  }, []);
  
  console.log("EmojiPicker rendered with emojis:", emojis);
  console.log("Emoji details:", emojis.map((emoji, index) => ({
    index,
    emoji,
    type: typeof emoji,
    length: emoji.length,
    charCode: emoji.charCodeAt(0),
    stringified: JSON.stringify(emoji)
  })));
  
  const handleEmojiClick = (emoji) => {
    console.log("=== EMOJI CLICK DEBUG ===");
    console.log("Emoji clicked:", emoji);
    console.log("Emoji type:", typeof emoji);
    console.log("Emoji length:", emoji.length);
    console.log("Emoji charCode:", emoji.charCodeAt(0));
    console.log("Emoji stringified:", JSON.stringify(emoji));
    console.log("Emoji === '👍':", emoji === '👍');
    console.log("Emoji === '❤️':", emoji === '❤️');
    console.log("Emoji === '😂':", emoji === '😂');
    console.log("Emoji === '😮':", emoji === '😮');
    console.log("Emoji === '😢':", emoji === '😢');
    console.log("Emoji === '🔥':", emoji === '🔥');
    console.log("Emoji === '👏':", emoji === '👏');
    console.log("Emoji === '✨':", emoji === '✨');
    console.log("========================");
    
    // Validate emoji before passing it
    if (!emoji || emoji.trim() === '') {
      console.error("Invalid emoji detected:", emoji);
      return;
    }
    
    // Additional validation - check if emoji is in our valid list
    if (!emojis.includes(emoji)) {
      console.error("Emoji not in valid list:", emoji);
      return;
    }
    
    onEmojiSelect(emoji);
  };
  
  return (
    <div className="emoji-picker">
      {emojis.map((emoji, index) => (
        <button 
          key={index} 
          onClick={() => handleEmojiClick(emoji)}
          title={`Add ${emoji} reaction`}
          data-emoji={emoji}
          data-index={index}
        >
          {emoji}
        </button>
      ))}
      <button className="close-emoji" onClick={onClose}>×</button>
    </div>
  );
};


const Message = React.memo(({ message, isOutgoing, userId, onReactionAdd, onReactionRemove }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  //console.log("Message Debug:", {
  //  id: message._id,
  //  content: message.content,
  //  imageUrl: message.imageUrl,
  //  fullMessage: message
  //});

  const handleReactionClick = useCallback((emoji) => {
    //console.log("debug reaction click");
    //console.log("handleReactionClick called with emoji:", emoji);
    //console.log("Emoji type:", typeof emoji);
    //console.log("Emoji length:", emoji.length);
    //console.log("Emoji value:", emoji);
    //console.log("Emoji stringified:", JSON.stringify(emoji));
    //console.log("Emoji === '👍':", emoji === '👍');
    //console.log("Emoji === '❤️':", emoji === '❤️');
    //console.log("Emoji === '😂':", emoji === '😂');
    //console.log("Emoji === '😮':", emoji === '😮');
    //console.log("Emoji === '😢':", emoji === '😢');
    //console.log("Emoji === '🔥':", emoji === '🔥');
    //console.log("Emoji === '👏':", emoji === '👏');
    //console.log("Emoji === '✨':", emoji === '✨');
    //console.log("===========================");
    
    // Validate emoji before proceeding
    if (!emoji || emoji.trim() === '') {
      console.error("Invalid emoji received in handleReactionClick:", emoji);
      alert("Invalid emoji selected. Please try again.");
      setShowEmojiPicker(false);
      return;
    }
    
    if (!message._id) {
      console.error("Cannot add reaction: Message has no valid ID", message);
      alert("Cannot add reaction to this message yet");
      setShowEmojiPicker(false);
      return;
    }
    
    //console.log("Calling onReactionAdd with:", message._id, emoji);
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
  
  return (
    <div className={`message ${isOutgoing ? "outgoing" : "incoming"}`}>
      {message.senderRole && (
        <div className={`role-badge ${message.senderRole.toLowerCase()}`}>
          {message.senderRole}
        </div>
      )}
      
      <div className="message-content">
        {message.content && message.content !== "📷 Image" && (
          <div className="message-text">{message.content}</div>
        )}
        
        {}
        {message.imageUrl && (
          <div className="message-image-container">
            <img 
              src={message.imageUrl} 
              alt="Message attachment" 
              className="message-image"
              onClick={() => window.open(message.imageUrl, '_blank')}
            />
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
          disabled={!userId}
          title={!userId ? "Please wait for user to load" : "Add reaction"}
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
            <span
              key={`${reaction.emoji}-${index}`}
              className="reaction"
              onClick={reaction.userId === userId ? () => onReactionRemove(message._id, reaction.emoji) : undefined}
              title={reaction.userId === userId ? 'Remove your reaction' : undefined}
              role={reaction.userId === userId ? 'button' : undefined}
            >
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
  const [isVerified, setIsVerified] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [activeRecipientId, setActiveRecipientId] = useState(null);
  const [activeRecipientName, setActiveRecipientName] = useState("");
  const [activeRecipientIsSeller, setActiveRecipientIsSeller] = useState(false);
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
  const navigate = useNavigate();
  const [imageError, setImageError] = useState('');

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
          setUserRole(response.data.role || "Buyer");
          setIsVerified(response.data.isVerified || false);
        }
      } catch (error) {
        console.error("Error fetching user:", error.response?.data || error.message);
      }
    };
  
    fetchUser();
  }, []);

  // Add demo message when chatbox opens for demonstration
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      console.log("Adding demo message with reactions for demonstration");
      // setMessages([demoMessage]); // This line is removed
    }
  }, [isOpen, messages.length]);

  
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
            } else {
            }
            
            setMessages(response.data);
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          
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
          // We only need to check if they're a seller
          setActiveRecipientIsSeller(response.data.isSeller || false);
        }
      } catch (error) {
        console.error("Error fetching recipient details:", error.message);
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

  
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    setImageError('');
    if (!file) return;
    // Validate type/size before compression
    const validationError = validateImageFile(file, { maxSizeMB: 3 });
    if (validationError) {
      setImageError(validationError);
      setSelectedImage(null);
      setImagePreview(null);
      e.target.value = "";
      return;
    }
    // Compress and rasterize
    setImageError('Compressing image...');
    const { file: compressed, error } = await compressImage(file, { maxSizeMB: 3 });
    if (error) {
      setImageError(error);
      setSelectedImage(null);
      setImagePreview(null);
      e.target.value = "";
      return;
    }
    setSelectedImage(compressed);
    setImageError('');
    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    };
    reader.readAsDataURL(compressed);
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
    setImageError('');
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
        `${apiUrl}/api/messages/upload`,
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
        setIsUploading(false);
        return response.data.imageUrl;
      }
      
      console.error("Failed to upload image, server returned:", response.status, response.data);
      setImageError(response.data?.message || 'Failed to upload image. Please try again.');
      return null;
    } catch (error) {
      console.error("Error uploading image:", error.response?.data || error.message);
      setImageError(error.message || 'Failed to upload image. Please try again.');
      setIsUploading(false);
      return null;
    }
  }, [selectedImage, apiUrl]);

  const sendMessage = useCallback(async () => {
    if (!activeRecipientId || (!newMessage.trim() && !selectedImage)) return;
    
    if (isUploading) {
      console.log("Still uploading, please wait...");
      return; 
    }

    const token = localStorage.getItem("authToken"); 

    if (!token) {
      console.error("No auth token found. Please log in again.");
      return;
    }

    const tempMessageId = `temp-${Date.now()}`;

    try {
      const messageText = newMessage.trim();
      setNewMessage("");
      
      let imageUrl = null;
      if (selectedImage) {
        console.log("Starting image upload process...");
        setIsUploading(true);
        
        try {
          const formData = new FormData();
          formData.append('image', selectedImage);
          
          console.log("Sending image to server...");
          const uploadResponse = await axios.post(
            `${apiUrl}/api/messages/upload`,
            formData,
            { 
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'  
              } 
            }
          );
          
          console.log("Upload response:", uploadResponse);
          
          if (uploadResponse.status === 201 && uploadResponse.data && uploadResponse.data.imageUrl) {
            imageUrl = uploadResponse.data.imageUrl;
            console.log("Image uploaded successfully, URL:", imageUrl);
          } else {
            throw new Error("Invalid upload response");
          }
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          alert("Failed to upload image. Please try again.");
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
        
        if (!imageUrl && !messageText) {
          alert("Failed to upload image. Please try again.");
          return;
        }
      }

      const tempMessage = {
        _id: tempMessageId,
        senderId: userId,
        recipientId: activeRecipientId,
        content: messageText || (imageUrl ? "📷 Image" : ""),
        imageUrl: imageUrl,  
        createdAt: new Date().toISOString(),
        isDelivered: false,
        isRead: false,
        reactions: [],
        senderRole: userRole,
        isPending: true
      };

      console.log("Sending message with data:", tempMessage);

      setMessages(prev => [...prev, tempMessage]);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

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

      console.log("Sending message to server:", messageData);

      const response = await axios.post(`${apiUrl}/api/messages`, messageData, {
        headers: { Authorization: `Bearer ${token}` }, 
      });
      
      if (response.status === 201) {
        const sentMessage = response.data;
        console.log("Server response:", sentMessage);
        
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
      setMessages(prev => prev.filter(msg => msg._id !== tempMessageId));
      alert("Failed to send message. Please try again.");
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
        // Fetch seller status for each user
        const usersWithSellerStatus = await Promise.all(
          response.data.map(async (user) => {
            try {
              const sellerResponse = await axios.get(
                `${apiUrl}/api/users/seller-status/${user._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              return { 
                ...user, 
                isSeller: sellerResponse.data.isSeller || false 
              };
            } catch (error) {
              console.error("Error fetching seller status:", error);
              return { ...user, isSeller: false };
            }
          })
        );
        
        setSearchResults(usersWithSellerStatus);
      } else {
        console.error("Failed to search users:", response.data.message);
      }
    } catch (error) {
      console.error("Error searching users:", error.message);
    }
  }, []);

  const handleSelectUser = useCallback((userId, userName, isSeller) => {
    setActiveRecipientId(userId); 
    setActiveRecipientName(userName);
    setActiveRecipientIsSeller(isSeller || false);
    setSearchResults([]);
    setSearchTerm("");
  }, []);

  const handleReactionRemove = useCallback(async (messageId, emoji) => {
    if (!userId || !messageId || !emoji) return;

    // Optimistically remove
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

    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(`http://localhost:5000/api/messages/${messageId}/reactions`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { emoji, userId }
      });

      socket.emit("messageReaction", {
        messageId,
        reaction: { emoji, userId },
        recipientId: activeRecipientId
      });
    } catch (error) {
      console.error("Error removing reaction:", error.response?.data || error.message);
      // Rollback: add it back
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg._id === messageId
            ? { ...msg, reactions: [...(msg.reactions || []), { emoji, userId }] }
            : msg
        )
      );
    }
  }, [userId, activeRecipientId]);

  const handleReactionAdd = useCallback(async (messageId, emoji) => {
    console.log('=== REACTION ADD DEBUG ===');
    console.log('handleReactionAdd called with:', { messageId, emoji, userId, activeRecipientId });
    console.log('userId type:', typeof userId, 'userId value:', userId);
    console.log('emoji type:', typeof emoji, 'emoji value:', emoji);
    console.log('emoji length:', emoji.length);
    console.log('emoji stringified:', JSON.stringify(emoji));
    console.log('messageId type:', typeof messageId, 'messageId value:', messageId);
    console.log('==========================');
    
    // Check if user is properly loaded
    if (!userId) {
      console.error("User not loaded yet, cannot add reaction");
      alert("Please wait for user to load before adding reactions");
      return;
    }
    
    // Validate emoji before proceeding
    if (!emoji || emoji.trim() === '') {
      console.error("Invalid emoji received in handleReactionAdd:", emoji);
      alert("Invalid emoji selected. Please try again.");
      return;
    }
    
    if (!messageId || !emoji || !userId || !activeRecipientId) {
      console.error("Missing data for reaction:", { messageId, emoji, userId, activeRecipientId });
      console.error("Validation details:", {
        messageId: !!messageId,
        emoji: !!emoji,
        userId: !!userId,
        activeRecipientId: !!activeRecipientId
      });
      return;
    }
    
    // Check if user already reacted with the same emoji - toggle behavior
    const targetMessage = messages.find(m => m._id === messageId);
    const alreadyReacted = !!targetMessage && (targetMessage.reactions || []).some(r => r.emoji === emoji && r.userId === userId);
    if (alreadyReacted) {
      await handleReactionRemove(messageId, emoji);
      return;
    }
    
    try {
      console.log("Adding reaction:", emoji, "to message:", messageId);
      console.log("Emoji type:", typeof emoji, "Emoji length:", emoji.length);
      console.log("Emoji value:", JSON.stringify(emoji));
      
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No auth token found");
        return;
      }
      
      // Optimistically update: remove any existing reactions from this user, then add new one (1 reaction per user limit)
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === messageId 
            ? { 
                ...msg, 
                reactions: [
                  // Keep reactions from other users
                  ...(msg.reactions || []).filter(r => r.userId !== userId),
                  // Add new reaction from current user
                  { emoji, userId }
                ]
              } 
            : msg
        )
      );
      
      try {
        const requestBody = { emoji, userId };
        console.log("Sending request body:", requestBody);
        console.log("Request body stringified:", JSON.stringify(requestBody));
        
        const response = await axios.post(
          `http://localhost:5000/api/messages/${messageId}/reactions`,
          requestBody,
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
        console.error("API Error details:", apiError.response?.data);
        console.error("API Error status:", apiError.response?.status);
        console.error("Full API error:", apiError);
        
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
      
      // Rollback: restore original reactions
      const originalMessage = messages.find(m => m._id === messageId);
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === messageId 
            ? { ...msg, reactions: originalMessage?.reactions || [] }
            : msg
        )
      );
    }
  }, [userId, activeRecipientId, messages, handleReactionRemove]);

  
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

  const handleSettingsClick = () => {
    navigate('/settings', { state: { fromChatbox: true } });
  };

  useEffect(() => {
    return () => {
      socket.disconnect();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    console.log("Messages updated:", messages);
  }, [messages]);

  return (
    <>
      {!isOpen && (
        <div className="chatbox-icon" onClick={toggleChatbox}>
          <MessageCircle size={24} color="white" />
        </div>
      )}
  
      {isOpen && (
        <div className="chatbox-container">
          {!isVerified && (
            <div className="verification-modal">
              <div className="verification-modal-content">
                <button className="verification-modal-close" onClick={toggleChatbox}>×</button>
                <h3>Account Not Verified</h3>
                <p>Please verify your email address to use the chat system.</p>
                <p>This helps us maintain a safe and spam-free environment.</p>
                <button className="verification-modal-button" onClick={() => window.location.href = '/settings'}>
                  Go to Settings
                </button>
              </div>
            </div>
          )}
          {isVerified && (
            <div className={`chatbox ${isOpen ? "open" : ""}`}>
              {/* Left Column - Conversations List */}
              <div className={`chatbox-conversations-column ${!activeRecipientId ? 'active' : ''}`}>
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
    
                <ul className="chatbox-conversations">
                  {(searchResults.length > 0 ? searchResults : recipients).map((user) => (
                    <li
                      key={user._id || user.participantId}
                      onClick={() =>
                        handleSelectUser(
                          user._id || user.participantId,
                          user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}`
                            : user.participantName || "User",
                          user.isSeller
                        )
                      }
                      className={`chatbox-conversation-item ${activeRecipientId === (user._id || user.participantId) ? 'active' : ''}`}
                    >
                      <UserCircle size={32} />
                      <div className="conversation-info">
                        <span className="conversation-name">
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}`
                            : user.participantName || "User"}
                        </span>
                        <span className="conversation-role">
                          {user.isSeller && <span className="seller-badge">Seller</span>}
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
              </div>

              {/* Right Column - Chat Area */}
              <div className={`chatbox-chat-column ${activeRecipientId ? 'active' : ''}`}>
                {activeRecipientId ? (
                  <>
                    <div className="chatbox-header">
                      <div className="recipient-info">
                        <button 
                          className="back-button"
                          onClick={() => setActiveRecipientId(null)}
                          aria-label="Back to conversations"
                        >
                          <ArrowLeft size={18} />
                        </button>
                        <UserCircle size={28} />
                        <div>
                          <h3>{activeRecipientName}</h3>
                          <span className="recipient-role">
                            {activeRecipientIsSeller && <span className="seller-badge">Seller</span>}
                          </span>
                        </div>
                      </div>
                      
                      <div className="header-actions">
                        <button className="header-action-button" aria-label="Start video call">
                          <Video size={20} />
                        </button>
                        <button className="header-action-button" aria-label="Settings" onClick={handleSettingsClick}>
                          <Settings size={20} />
                        </button>
                        <button className="header-action-button" aria-label="Help">
                          <HelpCircle size={20} />
                        </button>
                      </div>
                    </div>

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
                            onReactionRemove={handleReactionRemove}
                          />
                        ))
                      )}
                      
                      {typingUsers[activeRecipientId] && (
                        <div className="typing-indicator">
                          <span>{activeRecipientName} is typing...</span>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>

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
                          className="send-btn" 
                          onClick={sendMessage}
                          disabled={isUploading || (!newMessage.trim() && !selectedImage)}
                          aria-label="Send message"
                        >
                          {isUploading ? 'Uploading...' : <Send size={20} />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="no-chat-selected">
                    <MessageCircle size={48} />
                    <h3>Select a conversation</h3>
                    <p>Choose from your existing conversations or start a new one</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
    </>
  );
};

export default Chatbox;

// On few notes, rendering issue ng image ang problem, you won't see it on the chatbox if nasend
// nakakasend kaso hindi mo makikita HAHAHAHHAHAHA
// about sa design, kayo na lang bahala madadi na lang 'yon
// line 190 to 448 ang issue if wala ron nasa tuloy ng 448 pababa
// made some several changes, chatbox.js, chatbox.css, uploadRoute.js (new) at server.js
// THERE WAS A MEMO NA WALANG DELETE FUNCTION SA IMAGE KAYA DON'T ASK ME WHY IT ISN'T INCLUDED. T H E R E W A M E M E M O
// wala rin sa kontrata na need maglagay ng delete function on the image.
// Right click > Inspect > Console to see some hidden errors
// Don't mind about the payment, idefend niyo na lang.
// - JJHXCJG