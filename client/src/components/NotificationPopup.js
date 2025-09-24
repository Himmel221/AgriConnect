import React, { useEffect } from 'react';
import './css/NotificationPopup.css';

const NotificationPopup = ({ message, type = 'success', isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`notification-popup ${type}`}>
      <div className="notification-content">
        <span>{message}</span>
      </div>
    </div>
  );
};

export default NotificationPopup; 