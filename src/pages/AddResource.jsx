import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function AddResource({ user }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    country: '',
    region: '',
    description: ''
  });
  const [coords, setCoords] = useState({ lat: '', lon: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    // Initialize Leaflet map
    if (!mapRef.current) {
      console.log('Initializing map');
      mapRef.current = L.map('map', {
        center: [50.9079, -1.4015], // Southampton
        zoom: 12
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // Fix for Leaflet marker icons
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
      });

      // Handle map click to set coordinates and show marker
      mapRef.current.on('click', (e) => {
        e.originalEvent.preventDefault();
        const { lat, lng } = e.latlng;
        console.log('Map clicked at:', lat, lng);
        setCoords({ lat: lat.toFixed(6), lon: lng.toFixed(6) });
        if (markerRef.current) {
          console.log('Updating marker position');
          markerRef.current.setLatLng([lat, lng]);
          markerRef.current.openPopup();
        } else {
          console.log('Creating new marker');
          markerRef.current = L.marker([lat, lng])
            .addTo(mapRef.current)
            .bindPopup('Selected location')
            .openPopup();
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        console.log('Cleaning up map');
        mapRef.current.off('click');
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!user) return 'You must be logged in to add a resource';
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.category.trim()) return 'Category is required';
    if (!formData.country.trim()) return 'Country is required';
    if (!formData.region.trim()) return 'Region is required';
    if (!coords.lat || isNaN(coords.lat)) return 'Click the map to select a location';
    if (!coords.lon || isNaN(coords.lon)) return 'Click the map to select a location';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setSuccess(null);
      return;
    }
    try {
      console.log('Submitting resource:', { ...formData, lat: parseFloat(coords.lat), lon: parseFloat(coords.lon) });
      const response = await fetch('http://localhost:3000/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          lat: parseFloat(coords.lat),
          lon: parseFloat(coords.lon)
        }),
        credentials: 'include', // Send session cookie
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add resource');
      }
      setSuccess('Resource added successfully!');
      setError(null);
      setFormData({
        name: '',
        category: '',
        country: '',
        region: '',
        description: ''
      });
      setCoords({ lat: '', lon: '' });
      if (markerRef.current) {
        console.log('Removing marker after submission');
        markerRef.current.remove();
        markerRef.current = null;
      }
    } catch (err) {
      setError(err.message);
      setSuccess(null);
    }
  };

  return (
    <div>
      <h1>Add Healthcare Resource</h1>
      {!user && <p style={{ color: 'red' }}>You must be logged in to add a resource</p>}
      <p>Click the map to select a location (a marker will appear)</p>
      <div id="map" style={{ width: '800px', height: '400px', margin: '20px 0' }}></div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Name"
          required
          style={{ padding: '5px' }}
        />
        <input
          type="text"
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder="Category (e.g., Clinic)"
          required
          style={{ padding: '5px' }}
        />
        <input
          type="text"
          name="country"
          value={formData.country}
          onChange={handleChange}
          placeholder="Country"
          required
          style={{ padding: '5px' }}
        />
        <input
          type="text"
          name="region"
          value={formData.region}
          onChange={handleChange}
          placeholder="Region (e.g., Southampton)"
          required
          style={{ padding: '5px' }}
        />
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Description (optional)"
          style={{ padding: '5px', height: '100px' }}
        />
        <button type="submit" style={{ padding: '5px 10px' }} disabled={!user}>
          Add Resource
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
}