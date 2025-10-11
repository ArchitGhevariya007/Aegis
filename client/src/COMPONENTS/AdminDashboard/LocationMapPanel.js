import React, { useState, useEffect } from "react";
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Activity, Globe, Loader2, Info, RefreshCw } from 'lucide-react';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom marker icons based on activity level
const createCustomIcon = (status) => {
  const colors = {
    high: '#10b981',     // green
    medium: '#f59e0b',   // yellow
    low: '#3b82f6',      // blue
    suspicious: '#ef4444' // red
  };
  
  const color = colors[status] || colors.low;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative; width: 30px; height: 40px;">
        <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
          <!-- Pin shadow -->
          <ellipse cx="15" cy="38" rx="6" ry="2" fill="rgba(0,0,0,0.2)"/>
          
          <!-- Pin body -->
          <path d="M15 2 C8 2 3 7 3 14 C3 21 15 38 15 38 C15 38 27 21 27 14 C27 7 22 2 15 2 Z" 
                fill="${color}" 
                stroke="white" 
                stroke-width="2"/>
          
          <!-- Inner circle -->
          <circle cx="15" cy="14" r="5" fill="white" opacity="0.9"/>
          
          <!-- Pulse animation circle -->
          <circle cx="15" cy="14" r="8" fill="${color}" opacity="0.3" class="pulse-circle"/>
        </svg>
      </div>
    `,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40]
  });
};

// Component to fit map bounds to markers
function MapBounds({ locations }) {
  const map = useMap();
  
  useEffect(() => {
    if (locations && locations.length > 0) {
      const bounds = locations.map(loc => [
        loc.coordinates[1] || 0,
        loc.coordinates[0] || 0
      ]);
      
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
      }
    }
  }, [locations, map]);
  
  return null;
}

export default function LocationMapPanel({ miniMode = false, activityLimit = 10 }) {
  const [mapData, setMapData] = useState({ locations: [], totalLocations: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [error, setError] = useState(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true); // Default to showing only active users

  useEffect(() => {
    fetchMapData();
    fetchRecentActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, showActiveOnly]);

  const fetchMapData = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
      console.log('Fetching map data with token:', token ? 'Token exists' : 'No token');
      
      const response = await axios.get(
        `http://localhost:5000/api/locations/map-data?timeRange=${timeRange}&activeOnly=${showActiveOnly}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('Map data response:', response.data);
      setMapData(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching map data:', error.response || error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to load map data';
      setError(errorMsg);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
      console.log('Fetching recent activity...');
      
      const limit = miniMode ? 4 : activityLimit;
      const response = await axios.get(
        `http://localhost:5000/api/locations/recent-activity?limit=${limit}&activeOnly=${showActiveOnly}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('Recent activity response:', response.data);
      setRecentActivity(response.data.activities || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error.response || error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'high':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      case 'suspicious':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (count) => {
    if (count >= 10) return { color: 'bg-green-100 text-green-700', label: 'High Activity' };
    if (count >= 5) return { color: 'bg-yellow-100 text-yellow-700', label: 'Medium Activity' };
    if (count < 3) return { color: 'bg-red-100 text-red-700', label: 'Suspicious' };
    return { color: 'bg-blue-100 text-blue-700', label: 'Low Activity' };
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow w-full">
        <h2 className="text-lg font-semibold mb-4">Login Location Map</h2>
        <div className={`flex items-center justify-center ${miniMode ? 'h-64' : 'h-96'}`}>
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span>Loading map...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-2xl shadow w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Login Location Map</h2>
          {!miniMode && (
            <p className="text-sm text-slate-500 flex items-center gap-1">
              {showActiveOnly ? (
                <>
                  <Activity className="w-4 h-4 text-green-500" />
                  <span>{mapData.totalLocations} active users online now</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Tracking {mapData.totalLocations} unique locations (all time)</span>
                </>
              )}
            </p>
          )}
        </div>
        {!miniMode && (
          <div className="flex items-center gap-3">
            {/* Active Users Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-slate-600">Active Only</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
              </div>
              {showActiveOnly && <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <Activity className="w-3 h-3 animate-pulse" />
                Online
              </span>}
            </label>
            
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        )}
      </div>

      {/* {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">{error}</p>
              <p className="text-sm">Please check:</p>
              <ul className="text-sm list-disc ml-5 mt-1">
                <li>Server is running on port 5000</li>
                <li>You're logged in as admin</li>
                <li>Open browser console (F12) for details</li>
              </ul>
            </div>
          </div>
        </div>
      )} */}

      {!error && mapData.totalLocations === 0 && !loading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">No Location Data Yet</p>
              <p className="text-sm">Location tracking will start working once users log in or register.</p>
              <p className="text-sm mt-2">To test:</p>
              <ul className="text-sm list-disc ml-5 mt-1">
                <li>Logout and login again as admin</li>
                <li>Register a new user</li>
                <li>Login with an existing user account</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Leaflet Map */}
      <div 
        className={`${miniMode ? 'mb-4' : 'mb-6'} rounded-xl overflow-hidden border ${miniMode ? 'border' : 'border-2 border-indigo-200'} shadow-lg`} 
        style={{ height: miniMode ? '280px' : '500px' }}
      >
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={!miniMode}
          zoomControl={!miniMode}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {mapData.locations && mapData.locations.map((location, index) => {
            const lat = location.coordinates[1] || 0;
            const lng = location.coordinates[0] || 0;
            
            return (
              <Marker
                key={index}
                position={[lat, lng]}
                icon={createCustomIcon(location.status)}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-lg">{location.city}</h3>
                    <p className="text-sm text-gray-600">{location.country}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="font-semibold">Logins:</span> {location.loginCount}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Unique Users:</span> {location.uniqueUsers}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Status:</span>{' '}
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          location.status === 'high' ? 'bg-green-100 text-green-700' :
                          location.status === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          location.status === 'low' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {location.status}
                        </span>
                      </p>
                      {location.lastLogin && (
                        <p className="text-xs text-gray-500 mt-1">
                          Last: {new Date(location.lastLogin).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          
          <MapBounds locations={mapData.locations} />
        </MapContainer>
      </div>

      {/* Legend */}
      {!miniMode && (
        <div className="mb-6 flex items-center justify-center gap-6 p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-sm">High (10+)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-sm">Medium (5-9)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-sm">Low (&lt;5)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-sm">Suspicious</span>
          </div>
        </div>
      )}

      {/* Top Locations Summary */}
      {!miniMode && mapData.locations.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          {mapData.locations.slice(0, 3).map((location, index) => (
            <div key={index} className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200">
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-600">{location.loginCount}</p>
                <p className="text-sm text-slate-700 font-medium mt-1">{location.city}</p>
                <p className="text-xs text-slate-500">{location.country}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-600" />
          Recent Activity
        </h3>
        
        {recentActivity.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No recent activity to display</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity, idx) => {
              const badge = getStatusBadge(activity.loginCount);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span
                      className={`w-3 h-3 rounded-full ${getStatusColor(activity.status)}`}
                    ></span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800">
                          {activity.city || 'Unknown'}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {activity.coordinates && activity.coordinates.length === 2
                          ? `${activity.coordinates[1].toFixed(4)}, ${activity.coordinates[0].toFixed(4)}`
                          : 'No coordinates'}
                        {activity.country && ` • ${activity.country}`}
                      </p>
                      {activity.lastLogin && (
                        <p className="text-xs text-slate-400 mt-1">
                          Last seen: {new Date(activity.lastLogin).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-700">
                      {activity.loginCount}
                    </span>
                    <p className="text-xs text-slate-500">logins</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={() => {
            fetchMapData();
            fetchRecentActivity();
          }}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
