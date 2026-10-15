import React, { useState } from 'react';
import { X, Zap, Check, AlertCircle } from 'lucide-react';

export default function EditNodeModal({ node, onClose, onSave }) {
  const [name, setName] = useState(node?.name || '');
  const [capacityKwh, setCapacityKwh] = useState(node?.capacityKwh ?? '');
  const [availableBatterySlots, setAvailableBatterySlots] = useState(node?.availableBatterySlots ?? '');
  const [operatingSchedule, setOperatingSchedule] = useState(node?.operatingSchedule || '08:00-18:00');
  const [latitude, setLatitude] = useState(node?.latitude ?? 6.9271);
  const [longitude, setLongitude] = useState(node?.longitude ?? 79.8612);
  const [isActive, setIsActive] = useState(node?.isActive ?? true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!node) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Hub name is required.');
      return;
    }

    const parsedCap = parseFloat(capacityKwh);
    if (isNaN(parsedCap) || parsedCap <= 0) {
      setError('Capacity must be a positive number.');
      return;
    }

    const parsedSlots = parseInt(availableBatterySlots, 10);
    if (isNaN(parsedSlots) || parsedSlots < 0) {
      setError('Available battery slots must be 0 or more.');
      return;
    }

    setIsSaving(true);

    const updatedNode = {
      ...node,
      name: name.trim(),
      capacityKwh: parsedCap,
      availableBatterySlots: parsedSlots,
      operatingSchedule: operatingSchedule.trim(),
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0,
      isActive: Boolean(isActive)
    };

    onSave(updatedNode);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content modal-content-lg" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '580px', width: '92%' }}
      >
        <button 
          className="prof-close" 
          onClick={onClose} 
          type="button" 
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'rgba(20, 107, 92, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#146B5C'
          }}>
            <Zap size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#14201B', fontFamily: 'Sora, sans-serif' }}>
              Edit Microgrid Hub
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#5F6F67' }}>
              Modify details, capacity limits, and operating schedule.
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FEE2E2',
            color: '#B91C1C',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            marginBottom: '16px',
            fontWeight: 500
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="prof-edit-form">
          <div className="prof-group">
            <label htmlFor="edit-hub-name">Hub Name</label>
            <input
              id="edit-hub-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Solar Grid Hub A"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="prof-group">
              <label htmlFor="edit-hub-cap">Capacity (kWh)</label>
              <input
                id="edit-hub-cap"
                type="number"
                step="any"
                value={capacityKwh}
                onChange={(e) => setCapacityKwh(e.target.value)}
                placeholder="e.g. 50"
                required
              />
            </div>
            <div className="prof-group">
              <label htmlFor="edit-hub-slots">Battery Slots</label>
              <input
                id="edit-hub-slots"
                type="number"
                min="0"
                value={availableBatterySlots}
                onChange={(e) => setAvailableBatterySlots(e.target.value)}
                placeholder="e.g. 10"
                required
              />
            </div>
          </div>

          <div className="prof-group">
            <label htmlFor="edit-hub-sched">Operating Schedule</label>
            <input
              id="edit-hub-sched"
              type="text"
              value={operatingSchedule}
              onChange={(e) => setOperatingSchedule(e.target.value)}
              placeholder="e.g. 08:00-18:00"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="prof-group">
              <label htmlFor="edit-hub-lat">Latitude</label>
              <input
                id="edit-hub-lat"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g. 6.9271"
              />
            </div>
            <div className="prof-group">
              <label htmlFor="edit-hub-lng">Longitude</label>
              <input
                id="edit-hub-lng"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g. 79.8612"
              />
            </div>
          </div>

          <div className="prof-group">
            <label htmlFor="edit-hub-status">Operational Status</label>
            <select
              id="edit-hub-status"
              value={isActive ? 'true' : 'false'}
              onChange={(e) => setIsActive(e.target.value === 'true')}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #D6DED9',
                fontSize: '14px',
                color: '#14201B',
                background: '#FFFFFF',
                cursor: 'pointer'
              }}
            >
              <option value="true">Accepting Energy (Active)</option>
              <option value="false">Offline / Maintenance</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="submit"
              disabled={isSaving}
              className="prof-btn prof-btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                fontWeight: 600
              }}
            >
              <Check size={16} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="prof-btn prof-btn-quiet"
              style={{
                padding: '12px 20px',
                border: '1px solid #D6DED9',
                borderRadius: '12px'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
