/**
 * Course: SE4040 - Enterprise Application Development
 * Assignment: Assignment 1 - Smart Solar Microgrid Trading System
 * Component: HeaderMenu
 * Description: Dropdown navigation menu providing quick access to user profile settings and logout.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clearAuthSession } from '../auth';

/**
 * HeaderMenu provides a responsive user actions menu with click-outside listener.
 */
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
    clearAuthSession();
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
