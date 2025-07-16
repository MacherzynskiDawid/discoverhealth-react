import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function ResourceSearch() {
  const [region, setRegion] = useState('');
  const [resources, setResources] = useState([]);
  const [error, setError] = useState(null);
  const [reviewStatus, setReviewStatus] = useState({});
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Initialize Leaflet map
  useEffect(() => {
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

      // Add markers with review form
      data.forEach(resource => {
        if (resource.lat && resource.lon) {
          // Task 13: Add review form to marker popup with green success and red error messages
          const popupContent = document.createElement('div');
          popupContent.innerHTML = `
            <b>${resource.name}</b><br>
            ${resource.description || 'No description'}<br>
            <form id="review-form-${resource.id}">
              <textarea id="review-input-${resource.id}" placeholder="Write your review" rows="3" style="width:100%"></textarea><br>
              <button type="submit" style="padding:5px 10px">Submit Review</button>
            </form>
            <div id="review-status-${resource.id}" style="color:${reviewStatus[resource.id]?.includes('successfully') ? 'green' : 'red'}; font-weight:bold; margin-top:5px;">
              ${reviewStatus[resource.id] || ''}
            </div>
          `;
          const marker = L.marker([resource.lat, resource.lon])
            .addTo(mapRef.current)
            .bindPopup(popupContent, { autoClose: false, closeOnClick: false });
          markersRef.current.push(marker);

          // Task 13: Handle review submission with green confirmation for success and red for errors
          marker.on('popupopen', () => {
            const form = popupContent.querySelector(`#review-form-${resource.id}`);
            const statusDiv = popupContent.querySelector(`#review-status-${resource.id}`);
            form.addEventListener('submit', async (e) => {
              e.preventDefault();
              const reviewText = form.querySelector(`#review-input-${resource.id}`).value;
              if (!reviewText.trim()) {
                setReviewStatus({ ...reviewStatus, [resource.id]: 'Review cannot be empty' });
                statusDiv.style.color = 'red';
                statusDiv.textContent = 'Review cannot be empty';
                marker.openPopup();
                return;
              }
              try {
                const response = await fetch(`http://localhost:3000/api/resources/${resource.id}/reviews`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ review: reviewText }),
                  credentials: 'include'
                });
                const data = await response.json();
                if (response.ok) {
                  setReviewStatus({
                    ...reviewStatus,
                    [resource.id]: 'Thank you! Your review has been submitted successfully!'
                  });
                  statusDiv.style.color = 'green';
                  statusDiv.textContent = 'Thank you! Your review has been submitted successfully!';
                  form.querySelector(`#review-input-${resource.id}`).value = '';
                  marker.openPopup();
                  setTimeout(() => {
                    setReviewStatus({ ...reviewStatus, [resource.id]: '' });
                    statusDiv.textContent = '';
                    marker.openPopup();
                  }, 3000);
                } else {
                  const errorMsg = data.error || 'Failed to submit review';
                  setReviewStatus({ ...reviewStatus, [resource.id]: errorMsg });
                  statusDiv.style.color = 'red';
                  statusDiv.textContent = errorMsg; // Handles "You must be logged in to perform this action"
                  marker.openPopup();
                }
              } catch (err) {
                setReviewStatus({ ...reviewStatus, [resource.id]: 'Error: ' + err.message });
                statusDiv.style.color = 'red';
                statusDiv.textContent = 'Error: ' + err.message;
                marker.openPopup();
              }
            });
          });
        }
      });

      // Adjust map view
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