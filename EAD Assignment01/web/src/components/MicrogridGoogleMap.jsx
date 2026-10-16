/**
 * Course: SE4040 - Enterprise Application Development
 * Assignment: Assignment 1 - Smart Solar Microgrid Trading System
 * Component: MicrogridGoogleMap
 * Description: Interactive Google Maps integration component visualizing solar microgrid hubs with GPS pinpoints and specs.
 */

import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, Zap, BatteryCharging, Clock, Layers, ZoomIn, ZoomOut, Check, Sliders } from 'lucide-react';

/**
 * MicrogridGoogleMap displays hub coordinates, zoom controls, and hub inspection details.
 */
export default function MicrogridGoogleMap({ nodes = [], onEditNode = null, initialSelectedId = null }) {
  // Local state for active hub selection, map zoom level, and view mode (roadmap vs satellite)
  const [selectedHubId, setSelectedHubId] = useState(
    initialSelectedId || (nodes.length > 0 ? nodes[0].id : null)
  );
  const [zoom, setZoom] = useState(14);
  const [mapType, setMapType] = useState('m'); // 'm' for roadmap, 'k' for satellite

  const selectedHub = nodes.find(n => String(n.id) === String(selectedHubId)) || nodes[0];

  const lat = selectedHub?.latitude ?? 6.9271;
  const lng = selectedHub?.longitude ?? 79.8612;

  // Google Maps embed URL dynamically bound to current hub coordinates
  const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=${mapType}&z=${zoom}&ie=UTF8&iwloc=&output=embed`;

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E1E8E4',
      borderRadius: '24px',
      overflow: 'hidden',
      boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
      marginTop: '20px',
      marginBottom: '32px'
    }}>
      {/* Map Header */}
      <div style={{
        padding: '18px 24px',
        borderBottom: '1px solid #E1E8E4',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        background: '#FAFBFB'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '11px',
            background: 'rgba(20, 107, 92, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#146B5C'
          }}>
            <MapPin size={20} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#14201B', fontFamily: 'Sora, sans-serif' }}>
              Microgrid Hub Locations Map
            </h4>
            <span style={{ fontSize: '12.5px', color: '#5F6F67' }}>
              Real-time Google Maps integration with hub GPS coordinates
            </span>
          </div>
        </div>

        {/* Map Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Map / Satellite Toggle */}
          <button
            type="button"
            onClick={() => setMapType(mapType === 'm' ? 'k' : 'm')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '9px',
              border: '1px solid #D6DED9',
              background: '#FFFFFF',
              color: '#14201B',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Toggle Map / Satellite"
          >
            <Layers size={13} />
            {mapType === 'm' ? 'Satellite View' : 'Roadmap View'}
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={() => setZoom(prev => Math.min(prev + 1, 19))}
            style={{
              padding: '7px 10px',
              borderRadius: '9px',
              border: '1px solid #D6DED9',
              background: '#FFFFFF',
              cursor: 'pointer'
            }}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => setZoom(prev => Math.max(prev - 1, 5))}
            style={{
              padding: '7px 10px',
              borderRadius: '9px',
              border: '1px solid #D6DED9',
              background: '#FFFFFF',
              cursor: 'pointer'
            }}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
        </div>
      </div>

      {/* Hub selector chips */}
      <div style={{
        padding: '12px 24px',
        borderBottom: '1px solid #EEF2EF',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        background: '#FFFFFF'
      }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#5F6F67', whiteSpace: 'nowrap', marginRight: '4px' }}>
          Select Hub:
        </span>
        {nodes.map(n => {
          const isSelected = selectedHub && String(selectedHub.id) === String(n.id);
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => setSelectedHubId(n.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '12.5px',
                fontWeight: 600,
                border: isSelected ? '1.5px solid #146B5C' : '1px solid #D6DED9',
                background: isSelected ? '#146B5C' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : '#43524B',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <i style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isSelected ? '#FFFFFF' : n.isActive ? '#146B5C' : '#E08E2B'
              }} />
              {n.name}
            </button>
          );
        })}
      </div>

      {/* Map & Hub Info Split */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        minHeight: '440px',
        position: 'relative'
      }}>
        {/* Left: Google Map Iframe */}
        <div style={{ width: '100%', height: '100%', minHeight: '440px', position: 'relative' }}>
          <iframe
            title={`Google Map - ${selectedHub?.name || 'Microgrid Hub'}`}
            width="100%"
            height="100%"
            style={{
              border: 0,
              minHeight: '440px',
              display: 'block'
            }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={embedUrl}
          />
        </div>

        {/* Right: Selected Hub Details Panel */}
        {selectedHub && (
          <div style={{
            padding: '24px',
            background: '#FFFFFF',
            borderLeft: '1px solid #E1E8E4',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  background: selectedHub.isActive ? 'rgba(20, 107, 92, 0.12)' : 'rgba(224, 142, 43, 0.16)',
                  color: selectedHub.isActive ? '#146B5C' : '#A65A0E'
                }}>
                  <i style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: selectedHub.isActive ? '#146B5C' : '#A65A0E'
                  }} />
                  {selectedHub.isActive ? 'Accepting Energy' : 'Offline / Maintenance'}
                </span>
              </div>

              <h3 style={{
                margin: '0 0 6px 0',
                fontSize: '18px',
                fontWeight: 700,
                color: '#14201B',
                fontFamily: 'Sora, sans-serif'
              }}>
                {selectedHub.name}
              </h3>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12.5px',
                color: '#5F6F67',
                marginBottom: '18px'
              }}>
                <MapPin size={13} color="#146B5C" />
                <span>GPS: {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div style={{ background: '#F3F6F4', padding: '12px 14px', borderRadius: '12px' }}>
                  <b style={{ display: 'block', fontSize: '18px', fontFamily: 'Sora, sans-serif', color: '#14201B' }}>
                    {selectedHub.capacityKwh}
                  </b>
                  <small style={{ fontSize: '11.5px', color: '#5F6F67' }}>Capacity (kWh)</small>
                </div>

                <div style={{ background: '#F3F6F4', padding: '12px 14px', borderRadius: '12px' }}>
                  <b style={{ display: 'block', fontSize: '18px', fontFamily: 'Sora, sans-serif', color: '#14201B' }}>
                    {selectedHub.availableBatterySlots}
                  </b>
                  <small style={{ fontSize: '11.5px', color: '#5F6F67' }}>Battery slots</small>
                </div>
              </div>

              {selectedHub.operatingSchedule && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12.5px',
                  color: '#43524B',
                  background: '#FAFBFB',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #EEF2EF',
                  marginBottom: '16px'
                }}>
                  <Clock size={13} color="#146B5C" />
                  <span>Open: <b>{selectedHub.operatingSchedule}</b></span>
                </div>
              )}
            </div>

            {/* Hub Actions on Map */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: '#146B5C',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <Navigation size={14} />
                Get Directions
              </a>

              <a
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #D6DED9',
                  background: '#FFFFFF',
                  color: '#14201B',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <ExternalLink size={14} />
                Open Full Google Maps
              </a>

              {onEditNode && (
                <button
                  type="button"
                  onClick={() => onEditNode(selectedHub)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: '1px solid transparent',
                    background: '#F3F6F4',
                    color: '#43524B',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Sliders size={13} />
                  Edit Hub Details &amp; GPS
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
