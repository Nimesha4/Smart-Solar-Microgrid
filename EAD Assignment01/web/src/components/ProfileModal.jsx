import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfileModal({ user, onClose }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  
  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const initials = (user?.name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  const handleSave = async () => {
    setError('');
    
    // Validate password change
    let finalPassword = user.passwordHash;
    if (currentPassword || newPassword) {
      if (currentPassword !== user.passwordHash) {
        setError('Current password is incorrect.');
        return;
      }
      if (!newPassword) {
        setError('Please enter a new password.');
        return;
      }
      finalPassword = newPassword;
    }

    try {
      const updatedUser = {
        ...user,
        name,
        email,
        passwordHash: finalPassword
      };

      await axios.put(`http://localhost:5199/api/users/${user.nic}`, updatedUser);
      
      // Update local storage and reload to reflect changes
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload();
    } catch (e) {
      setError('Failed to update profile.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    try {
      await axios.delete(`http://localhost:5199/api/users/${user.nic}`);
      localStorage.clear();
      navigate('/login');
    } catch (e) {
      setError('Failed to delete account.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-lg" onClick={e => e.stopPropagation()}>
        <button className="prof-close" onClick={onClose}><X size={18} /></button>
        
        {!isEditing ? (
          <>
            <div className="prof-ava">{initials}</div>
            <h3 className="prof-name">{user?.name}</h3>
            <div className="prof-role">{user?.role}</div>
            
            <div className="prof-detail">
              <span className="prof-lbl">National ID</span>
              <span className="prof-val">{user?.nic}</span>
            </div>
            <div className="prof-detail">
              <span className="prof-lbl">Email address</span>
              <span className="prof-val">{user?.email || 'N/A'}</span>
            </div>
            <div className="prof-detail">
              <span className="prof-lbl">Account type</span>
              <span className="prof-val">{user?.role}</span>
            </div>
            <div className="prof-detail">
              <span className="prof-lbl">Account status</span>
              <span className="prof-val" style={{color: user?.isActive ? '#146B5C' : '#E08E2B'}}>
                {user?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="prof-actions">
              <button className="prof-btn prof-btn-primary" onClick={() => setIsEditing(true)}>Edit profile</button>
              <button className="prof-btn prof-btn-danger" onClick={handleDelete}>Delete account</button>
            </div>
          </>
        ) : (
          <div className="prof-edit-form">
            <h3 className="prof-name" style={{marginBottom: '20px'}}>Edit Profile</h3>
            
            {error && <div className="prof-err">{error}</div>}
            
            <div className="prof-group">
              <label>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} />
            </div>
            
            <div className="prof-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            
            <div className="prof-pw-section">
              <h4>Change Password</h4>
              <p>Leave blank if you do not want to change your password.</p>
              <div className="prof-group">
                <label>Current Password</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="prof-group">
                <label>New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
              </div>
            </div>
            
            <div className="prof-actions">
              <button className="prof-btn prof-btn-primary" onClick={handleSave}>Save changes</button>
              <button className="prof-btn prof-btn-quiet" onClick={() => { setIsEditing(false); setError(''); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
