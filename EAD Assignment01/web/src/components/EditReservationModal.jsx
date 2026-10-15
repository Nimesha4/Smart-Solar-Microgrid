import React, { useState } from 'react';
import { X, CalendarClock, Check, AlertCircle, Zap, MapPin, ShieldCheck } from 'lucide-react';

export default function EditReservationModal({ reservation, nodes = [], onClose, onSave }) {
  const formatForInput = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [selectedNodeId, setSelectedNodeId] = useState(reservation?.microgridNodeId || '');
  const [energyAmount, setEnergyAmount] = useState(reservation?.energyAmountKwh ?? '');
  const [scheduledDateTime, setScheduledDateTime] = useState(formatForInput(reservation?.scheduledTime));
  const [status, setStatus] = useState(reservation?.status || 'Pending');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!reservation) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedNodeId) {
      setError('Please select a grid hub.');
      return;
    }

    const parsedEnergy = parseFloat(energyAmount);
    if (isNaN(parsedEnergy) || parsedEnergy <= 0) {
      setError('Energy amount must be a positive number.');
      return;
    }

    if (!scheduledDateTime) {
      setError('Please select a scheduled date and time.');
      return;
    }

    const scheduledDateObj = new Date(scheduledDateTime);
    if (isNaN(scheduledDateObj.getTime())) {
      setError('Invalid date and time.');
      return;
    }

    setIsSaving(true);

    const targetNode = nodes.find((n) => String(n.id) === String(selectedNodeId));
    const nodeName = targetNode?.name || reservation.microgridNodeName || 'Solar Grid Hub';

    let qrCode = reservation.qrCodeData;
    if (status === 'Approved' && !qrCode) {
      qrCode = `QR_${reservation.id}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    }

    const updated = {
      ...reservation,
      microgridNodeId: selectedNodeId,
      microgridNodeName: nodeName,
      energyAmountKwh: parsedEnergy,
      scheduledTime: scheduledDateObj.toISOString(),
      status: status,
      qrCodeData: qrCode
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
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'rgba(224, 142, 43, 0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#A65A0E'
            }}
          >
            <CalendarClock size={22} />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 700,
                color: '#14201B',
                fontFamily: 'Sora, sans-serif'
              }}
            >
              Edit Reservation
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#5F6F67' }}>
              Booking #{String(reservation.id).slice(-8)}
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
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
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="prof-edit-form">
          <div className="prof-group">
            <label htmlFor="edit-res-hub">Grid Hub</label>
            <select
              id="edit-res-hub"
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
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
              <option value="">Choose a hub</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.availableBatterySlots} slots available)
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="prof-group">
              <label htmlFor="edit-res-kwh">Energy Amount (kWh)</label>
              <input
                id="edit-res-kwh"
                type="number"
                step="0.1"
                min="0.1"
                value={energyAmount}
                onChange={(e) => setEnergyAmount(e.target.value)}
                placeholder="e.g. 15.5"
                required
              />
            </div>

            <div className="prof-group">
              <label htmlFor="edit-res-status">Status</label>
              <select
                id="edit-res-status"
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
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="prof-group">
            <label htmlFor="edit-res-time">Scheduled Date &amp; Time</label>
            <input
              id="edit-res-time"
              type="datetime-local"
              value={scheduledDateTime}
              onChange={(e) => setScheduledDateTime(e.target.value)}
              required
            />
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: '#F3F6F4',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              color: '#43524B'
            }}
          >
            <ShieldCheck size={16} color="#146B5C" style={{ flexShrink: 0 }} />
            <span>
              Updating this booking recalculates your timeline chart and status counters in real time.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
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
