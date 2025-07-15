import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function ResourceSearch() {
  const [region, setRegion] = useState('');
  const [resources, setResources] = useState([]);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Initialize Leaflet map
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
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
      }
    };
  }, []);

  const handleSearch = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/resources/${encodeURIComponent(region)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }
      const data = await response.json();
      setResources(data);
      setError(null);

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add markers (Task 8)
      data.forEach(resource => {
        if (resource.lat && resource.lon) {
          const marker = L.marker([resource.lat, resource.lon])
            .addTo(mapRef.current)
            .bindPopup(`<b>${resource.name}</b><br>${resource.description || 'No description'}`);
          markersRef.current.push(marker);
        }
      });

      // Adjust map view to fit markers
      if (data.length > 0 && data[0].lat && data[0].lon) {
        const bounds = L.latLngBounds(data.map(r => [r.lat, r.lon]).filter(([lat, lon]) => lat && lon));
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (err) {
      setError(err.message);
      setResources([]);
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    }
  };

  const handleRecommend = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/resources/${id}/recommend`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to recommend resource');
      }
      setResources(resources.map(resource =>
        resource.id === id
          ? { ...resource, recommendations: resource.recommendations + 1 }
          : resource
      ));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>DiscoverHealth - Search Resources</h1>
      <div>
        <input
          type="text"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="Enter region (e.g., Southampton)"
          style={{ padding: '5px', marginRight: '10px' }}
        />
        <button onClick={handleSearch} style={{ padding: '5px 10px' }}>
          Search
        </button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div id="map" style={{ width: '800px', height: '400px', margin: '20px 0' }}></div>
      {resources.length === 0 && !error && <p>No resources found.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {resources.map(resource => (
          <li key={resource.id} style={{ margin: '10px 0' }}>
            <strong>{resource.name}</strong> ({resource.category})<br />
            {resource.description || 'No description'}<br />
            Recommendations: {resource.recommendations}
            <button
              onClick={() => handleRecommend(resource.id)}
              style={{ marginLeft: '10px', padding: '5px 10px' }}
            >
              Recommend
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}