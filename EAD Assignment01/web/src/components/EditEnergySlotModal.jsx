import React, { useState } from 'react';
import { X, Clock, Check, AlertCircle, Zap, BatteryCharging, Trash2 } from 'lucide-react';

export default function EditEnergySlotModal({ slot, nodes = [], onClose, onSave, onDelete }) {
  const [hubId, setHubId] = useState(slot?.hubId || '');
  const [date, setDate] = useState(slot?.date || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(slot?.startTime || '08:00');
  const [endTime, setEndTime] = useState(slot?.endTime || '10:00');
  const [capacityKwh, setCapacityKwh] = useState(slot?.capacityKwh ?? 20);
  const [batterySlots, setBatterySlots] = useState(slot?.batterySlots ?? 4);
  const [status, setStatus] = useState(slot?.status || 'Available');
  const [ratePerKwh, setRatePerKwh] = useState(slot?.ratePerKwh ?? 0.35);
  const [error, setError] = useState('');

  if (!slot) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!hubId) {
      setError('Please select a Microgrid Hub.');
      return;
    }

    const cap = parseFloat(capacityKwh);
    if (isNaN(cap) || cap <= 0) {
      setError('Capacity must be greater than 0 kWh.');
      return;
    }

    const slots = parseInt(batterySlots, 10);
    if (isNaN(slots) || slots < 1) {
      setError('Battery slots must be at least 1.');
      return;
    }

    if (startTime >= endTime) {
      setError('End time must be after start time.');
      return;
    }

    const selectedHub = nodes.find(n => String(n.id) === String(hubId));
    const hubName = selectedHub ? selectedHub.name : slot.hubName || 'Microgrid Hub';

    const updated = {
      ...slot,
      hubId,
      hubName,
      date,
      startTime,
      endTime,
      capacityKwh: cap,
      batterySlots: slots,
      status,
      ratePerKwh: parseFloat(ratePerKwh) || 0.35
    };

    onSave(updated);
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
            background: 'rgba(224, 142, 43, 0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#A65A0E'
          }}>
            <Clock size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#14201B', fontFamily: 'Sora, sans-serif' }}>
              Update Energy Slot
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#5F6F67' }}>
              Edit available booking window and allocated capacity
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
            <label htmlFor="slot-hub">Assigned Microgrid Hub</label>
            <select
              id="slot-hub"
              value={hubId}
              onChange={(e) => setHubId(e.target.value)}
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
              required
            >
              <option value="">Select a hub</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.name} (Max: {n.capacityKwh} kWh)</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
            <div className="prof-group">
              <label htmlFor="slot-date">Slot Date</label>
              <input
                id="slot-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="prof-group">
              <label htmlFor="slot-start">Start Time</label>
              <input
                id="slot-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="prof-group">
              <label htmlFor="slot-end">End Time</label>
              <input
                id="slot-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="prof-group">
              <label htmlFor="slot-cap">Slot Capacity (kWh)</label>
              <input
                id="slot-cap"
                type="number"
                step="0.5"
                min="1"
                value={capacityKwh}
                onChange={(e) => setCapacityKwh(e.target.value)}
                required
              />
            </div>
            <div className="prof-group">
              <label htmlFor="slot-slots">Battery Storage Slots</label>
              <input
                id="slot-slots"
                type="number"
                min="1"
                value={batterySlots}
                onChange={(e) => setBatterySlots(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="prof-group">
              <label htmlFor="slot-status">Availability Status</label>
              <select
                id="slot-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
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
                <option value="Available">Available (Open for Booking)</option>
                <option value="Booked">Booked (Occupied)</option>
                <option value="Maintenance">Maintenance (Offline)</option>
              </select>
            </div>
            <div className="prof-group">
              <label htmlFor="slot-rate">Tariff / Credit ($/kWh)</label>
              <input
                id="slot-rate"
                type="number"
                step="0.01"
                min="0"
                value={ratePerKwh}
                onChange={(e) => setRatePerKwh(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
            <button
              type="submit"
              className="prof-btn prof-btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                flex: 1
              }}
            >
              <Check size={16} /> Save Slot
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(slot.id)}
                className="prof-btn prof-btn-danger"
                style={{ width: 'auto', padding: '10px 16px' }}
                title="Delete this slot"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="prof-btn prof-btn-quiet"
              style={{
                width: 'auto',
                padding: '10px 18px',
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
