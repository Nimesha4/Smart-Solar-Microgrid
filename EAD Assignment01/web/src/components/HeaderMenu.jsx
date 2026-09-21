import React, { useState, useRef, useEffect } from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HeaderMenu({ onProfileClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleProfile = () => {
    setIsOpen(false);
    if (onProfileClick) onProfileClick();
  };

  return (
    <div className="hm-container" ref={menuRef}>
      <button className="hm-btn" onClick={() => setIsOpen(!isOpen)}>
        <Menu size={20} />
      </button>
      
      {isOpen && (
        <div className="hm-dropdown">
          <button className="hm-item" onClick={handleProfile}>
            <User size={16} />
            <span>Profile</span>
          </button>
          <div className="hm-divider"></div>
          <button className="hm-item hm-danger" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
