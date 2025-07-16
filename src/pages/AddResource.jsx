import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PropTypes from 'prop-types';
import '../styles/leaflet-overrides.css'; // Part G: Import CSS overrides for compatibility

// Part G: Error boundary for robust React component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught in AddResource:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
          <h1>Something went wrong.</h1>
          <p>Error: {this.state.error?.message || 'Unknown error'}</p>
          <p>Please refresh the page or try again later.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

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

  // Log user prop for debugging
  useEffect(() => {
    console.log('AddResource user prop:', user);
  }, [user]);

  // Task 9: Initialize Leaflet map for selecting resource location
  useEffect(() => {
    console.log('Initializing AddResource map');
    if (!mapRef.current) {
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

      // Task 9: Handle map click to set coordinates and show marker
      mapRef.current.on('click', (e) => {
        e.originalEvent.preventDefault();
        const { lat, lng } = e.latlng;
        console.log('Map clicked at:', lat, lng);
        setCoords({ lat: lat.toFixed(6), lon: lng.toFixed(6) });
        const popupContent = `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        if (markerRef.current) {
          console.log('Updating marker position');
          markerRef.current.setLatLng([lat, lng]).setPopupContent(popupContent).openPopup();
        } else {
          console.log('Creating new marker');
          markerRef.current = L.marker([lat, lng])
            .addTo(mapRef.current)
            .bindPopup(popupContent, { autoClose: false, closeOnClick: false })
            .openPopup();
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        console.log('Cleaning up AddResource map');
        mapRef.current.off('click');
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Task 5: Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Task 7: Validate form inputs
  const validateForm = () => {
    if (!user || !user.username) return 'You must be logged in to add a resource';
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.category.trim()) return 'Category is required';
    if (!formData.country.trim()) return 'Country is required';
    if (!formData.region.trim()) return 'Region is required';
    if (!coords.lat || isNaN(coords.lat)) return 'Click the map to select a latitude';
    if (!coords.lon || isNaN(coords.lon)) return 'Click the map to select a longitude';
    const lat = parseFloat(coords.lat);
    const lon = parseFloat(coords.lon);
    if (lat < -90 || lat > 90) return 'Latitude must be between -90 and 90';
    if (lon < -180 || lon > 180) return 'Longitude must be between -180 and 180';
    return null;
  };

  // Task 5 & 11: Submit new resource with AJAX, restricted to logged-in users
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setSuccess(null);
      return;
    }
    try {
      console.log('Submitting resource:', { ...formData, lat: parseFloat(coords.lat), lon: parseFloat(coords.lon) }, 'User:', user);
      const response = await fetch('http://localhost:3000/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          lat: parseFloat(coords.lat),
          lon: parseFloat(coords.lon)
        }),
        credentials: 'include' // Task 11: Send session cookie
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
      console.error('Add resource error:', err.message);
    }
  };

  // Part G: Robust React component with clear structure
  return (
    <ErrorBoundary>
      <div style={{ padding: '20px' }}>
        <h1>Add Healthcare Resource</h1>
        {!user && <p style={{ color: 'red' }}>You must be logged in to add a resource</p>}
        <p>Click the map to select a location (a marker will appear)</p>
        <div id="map" style={{ width: '800px', height: '400px', margin: '20px 0' }}></div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
          <input
            type="text"
            name="name"
            id="resource-name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name"
            required
            disabled={!user || !user.username} // Task 11: Disable if not logged in
            style={{ padding: '5px' }}
            autoComplete="name"
          />
          <input
            type="text"
            name="category"
            id="resource-category"
            value={formData.category}
            onChange={handleChange}
            placeholder="Category (e.g., Clinic)"
            required
            disabled={!user || !user.username} // Task 11: Disable if not logged in
            style={{ padding: '5px' }}
            autoComplete="off"
          />
          <input
            type="text"
            name="country"
            id="resource-country"
            value={formData.country}
            onChange={handleChange}
            placeholder="Country"
            required
            disabled={!user || !user.username} // Task 11: Disable if not logged in
            style={{ padding: '5px' }}
            autoComplete="country-name"
          />
          <input
            type="text"
            name="region"
            id="resource-region"
            value={formData.region}
            onChange={handleChange}
            placeholder="Region (e.g., Southampton)"
            required
            disabled={!user || !user.username} // Task 11: Disable if not logged in
            style={{ padding: '5px' }}
            autoComplete="off"
          />
          <input
            type="text"
            name="lat"
            id="resource-lat"
            value={coords.lat}
            placeholder="Latitude (click map)"
            readOnly
            style={{ padding: '5px' }}
            autoComplete="off"
          />
          <input
            type="text"
            name="lon"
            id="resource-lon"
            value={coords.lon}
            placeholder="Longitude (click map)"
            readOnly
            style={{ padding: '5px' }}
            autoComplete="off"
          />
          <textarea
            name="description"
            id="resource-description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description (optional)"
            disabled={!user || !user.username} // Task 11: Disable if not logged in
            style={{ padding: '5px', height: '100px' }}
            autoComplete="off"
          />
          <button type="submit" style={{ padding: '5px 10px' }} disabled={!user || !user.username}>
            Add Resource
          </button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
      </div>
    </ErrorBoundary>
  );
}

AddResource.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string
  })
};