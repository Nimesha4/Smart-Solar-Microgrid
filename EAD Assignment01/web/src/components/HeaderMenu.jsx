import React, { useState, useRef, useEffect } from 'react';
import { Menu, Moon, Sun, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HeaderMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
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

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="hm-container" ref={menuRef}>
      <button className="hm-btn" onClick={() => setIsOpen(!isOpen)}>
        <Menu size={20} />
      </button>
      
      {isOpen && (
        <div className="hm-dropdown">
          <button className="hm-item" onClick={toggleTheme}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
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
