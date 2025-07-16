import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PropTypes from 'prop-types';
import '../styles/leaflet-overrides.css'; // Part G: Import CSS overrides for compatibility

// Task 13: Reusable ReviewForm component for marker popups
function ReviewForm({ resource, user, reviewStatus, setReviewStatus }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const reviewText = e.target.querySelector(`#review-input-${resource.id}`).value;
    const statusDiv = e.target.querySelector(`#review-status-${resource.id}`);
    if (!reviewText.trim()) {
      setReviewStatus({ ...reviewStatus, [resource.id]: 'Review cannot be empty' });
      statusDiv.style.color = 'red';
      statusDiv.textContent = 'Review cannot be empty';
      return;
    }
    try {
      // console.log('Submitting review for resource:', resource.id, 'User:', user);
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
        e.target.querySelector(`#review-input-${resource.id}`).value = '';
        setTimeout(() => {
          setReviewStatus({ ...reviewStatus, [resource.id]: '' });
          statusDiv.textContent = '';
        }, 3000);
      } else {
        const errorMsg = data.error || 'Failed to submit review';
        setReviewStatus({ ...reviewStatus, [resource.id]: errorMsg });
        statusDiv.style.color = 'red';
        statusDiv.textContent = errorMsg; // Handles "You must be logged in to perform this action"
        // console.error('Review submission failed:', errorMsg);
      }
    } catch (err) {
      setReviewStatus({ ...reviewStatus, [resource.id]: 'Error: ' + err.message });
      statusDiv.style.color = 'red';
      statusDiv.textContent = 'Error: ' + err.message;
      // console.error('Review submission error:', err.message);
    }
  };

  return (
    <div>
      <b>{resource.name}</b><br />
      {resource.description || 'No description'}<br />
      {user && user.username ? (
        <form id={`review-form-${resource.id}`} onSubmit={handleSubmit}>
          <textarea
            id={`review-input-${resource.id}`}
            name={`review-${resource.id}`}
            placeholder="Write your review"
            rows="3"
            style={{ width: '100%' }}
            autoComplete="off"
          ></textarea><br />
          <button type="submit" style={{ padding: '5px 10px' }}>Submit Review</button>
        </form>
      ) : (
        <p style={{ color: 'red' }}>You must be logged in to submit a review</p>
      )}
      <div
        id={`review-status-${resource.id}`}
        style={{
          color: reviewStatus[resource.id]?.includes('successfully') ? 'green' : 'red',
          fontWeight: 'bold',
          marginTop: '5px'
        }}
      >
        {reviewStatus[resource.id] || ''}
      </div>
    </div>
  );
}

ReviewForm.propTypes = {
  resource: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string
  }).isRequired,
  user: PropTypes.shape({
    username: PropTypes.string
  }),
  reviewStatus: PropTypes.object.isRequired,
  setReviewStatus: PropTypes.func.isRequired
};

export default function ResourceSearch({ user }) {
  const [region, setRegion] = useState('');
  const [resources, setResources] = useState([]);
  const [error, setError] = useState(null);
  const [reviewStatus, setReviewStatus] = useState({});
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Log user prop for debugging
  useEffect(() => {
    // console.log('ResourceSearch user prop:', user);
  }, [user]);

  // Task 4 & 8: Initialize Leaflet map for resource display
  useEffect(() => {
    // console.log('Initializing ResourceSearch map');
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
        // console.log('Cleaning up ResourceSearch map');
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
      }
    };
  }, []);

  // Task 4: Fetch resources by region using AJAX
  const handleSearch = async () => {
    try {
      // console.log('Searching resources for region:', region);
      const response = await fetch(`http://localhost:3000/api/resources/${encodeURIComponent(region)}`, {
        credentials: 'include' // Task 10: Include session for login check
      });
      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }
      const data = await response.json();
      setResources(data);
      setError(null);

      // Task 8: Clear and add markers for resources
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      data.forEach(resource => {
        if (resource.lat && resource.lon) {
          // Task 13: Add review form to marker popup with green success and red error messages
          const popupContent = document.createElement('div');
          popupContent.innerHTML = `
            <b>${resource.name}</b><br>
            ${resource.description || 'No description'}<br>
            ${user && user.username ? `
              <form id="review-form-${resource.id}">
                <textarea id="review-input-${resource.id}" name="review-${resource.id}" placeholder="Write your review" rows="3" style="width:100%" autocomplete="off"></textarea><br>
                <button type="submit" style="padding:5px 10px">Submit Review</button>
              </form>
            ` : '<p style="color:red">You must be logged in to submit a review</p>'}
            <div id="review-status-${resource.id}" style="color:${reviewStatus[resource.id]?.includes('successfully') ? 'green' : 'red'}; font-weight:bold; margin-top:5px;">
              ${reviewStatus[resource.id] || ''}
            </div>
          `;
          const marker = L.marker([resource.lat, resource.lon])
            .addTo(mapRef.current)
            .bindPopup(popupContent, { autoClose: false, closeOnClick: false });
          markersRef.current.push(marker);

          // Task 13: Handle review form submission
          if (user && user.username) {
            marker.on('popupopen', () => {
              const form = popupContent.querySelector(`#review-form-${resource.id}`);
              if (form) {
                form.addEventListener('submit', async (e) => {
                  e.preventDefault();
                  const reviewText = form.querySelector(`#review-input-${resource.id}`).value;
                  const statusDiv = popupContent.querySelector(`#review-status-${resource.id}`);
                  if (!reviewText.trim()) {
                    setReviewStatus({ ...reviewStatus, [resource.id]: 'Review cannot be empty' });
                    statusDiv.style.color = 'red';
                    statusDiv.textContent = 'Review cannot be empty';
                    marker.openPopup();
                    return;
                  }
                  try {
                    // console.log('Submitting review for resource:', resource.id, 'User:', user);
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
                      statusDiv.textContent = errorMsg;
                      marker.openPopup();
                      // console.error('Review submission failed:', errorMsg);
                    }
                  } catch (err) {
                    setReviewStatus({ ...reviewStatus, [resource.id]: 'Error: ' + err.message });
                    statusDiv.style.color = 'red';
                    statusDiv.textContent = 'Error: ' + err.message;
                    marker.openPopup();
                    // console.error('Review submission error:', err.message);
                  }
                });
              }
            });
          }
        }
      });

      // Task 8: Adjust map view
      if (data.length > 0 && data[0].lat && data[0].lon) {
        const bounds = L.latLngBounds(data.map(r => [r.lat, r.lon]).filter(([lat, lon]) => lat && lon));
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (err) {
      setError(err.message);
      setResources([]);
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      // console.error('Search error:', err.message);
    }
  };

  // Task 6: Handle resource recommendation
  const handleRecommend = async (id) => {
    if (!user || !user.username) {
      setError('You must be logged in to recommend a resource');
      return;
    }
    try {
      // console.log('Recommending resource:', id);
      const response = await fetch(`http://localhost:3000/api/resources/${id}/recommend`, {
        method: 'POST',
        credentials: 'include' // Task 11: Restrict to logged-in users
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
      // console.error('Recommend error:', err.message);
    }
  };

  // Part G: Robust React component with clear structure
  return (
    <div style={{ padding: '20px' }}>
      <h1>DiscoverHealth - Search Resources</h1>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="Enter region (e.g., Southampton)"
          style={{ padding: '5px', marginRight: '10px' }}
          id="region-search"
          autoComplete="off"
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
              disabled={!user || !user.username} // Task 11: Disable if not logged in
            >
              Recommend
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

ResourceSearch.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string
  })
};