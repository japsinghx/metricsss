import './style.css'

const locateBtn = document.getElementById('locate-btn');
const locationInput = document.getElementById('location-input');
const suggestionsList = document.getElementById('suggestions-list');
const loadingDiv = document.getElementById('loading');
const dashboardDiv = document.getElementById('dashboard');
const errorDiv = document.getElementById('error-message');

// UI Elements
const cityNameEl = document.getElementById('city-name');
const dateTimeEl = document.getElementById('date-time');
const aqiValueEl = document.getElementById('aqi-value');
const aqiStatusTextEl = document.getElementById('aqi-status-text');
const aqiDescEl = document.getElementById('aqi-description');
const aqiCircle = document.querySelector('.aqi-circle');
const aqiStatusHeader = document.querySelector('.aqi-info h3');

const pm25Val = document.getElementById('pm25-val');
const pm10Val = document.getElementById('pm10-val');
const no2Val = document.getElementById('no2-val');
const so2Val = document.getElementById('so2-val');
const o3Val = document.getElementById('o3-val');
const coVal = document.getElementById('co-val');

const healthTipsList = document.getElementById('health-tips');

// Store current metric values for modal display
let currentMetricValues = {};

// Top cities around the world
const topCities = [
  { name: 'New York', country: 'USA', lat: 40.7128, lon: -74.0060 },
  { name: 'Los Angeles', country: 'USA', lat: 34.0522, lon: -118.2437 },
  { name: 'Chicago', country: 'USA', lat: 41.8781, lon: -87.6298 },
  { name: 'London', country: 'UK', lat: 51.5074, lon: -0.1278 },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
  { name: 'Berlin', country: 'Germany', lat: 52.5200, lon: 13.4050 },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lon: -79.3832 },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093 },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lon: 55.2708 },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { name: 'São Paulo', country: 'Brazil', lat: -23.5505, lon: -46.6333 },
  { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lon: -99.1332 },
  { name: 'Madrid', country: 'Spain', lat: 40.4168, lon: -3.7038 },
  { name: 'Rome', country: 'Italy', lat: 41.9028, lon: 12.4964 },
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lon: 4.9041 },
  { name: 'Seoul', country: 'South Korea', lat: 37.5665, lon: 126.9780 },
  { name: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777 },
  { name: 'Shanghai', country: 'China', lat: 31.2304, lon: 121.4737 },
  { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lon: 28.9784 },
  { name: 'Moscow', country: 'Russia', lat: 55.7558, lon: 37.6173 },
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lon: 31.2357 },
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lon: -58.3816 },
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lon: 3.3792 },
  { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lon: 100.5018 }
];

// Initialize ticker on page load
async function initializeTicker() {
  const tickerTrack = document.getElementById('ticker-track');
  if (!tickerTrack) return;

  try {
    const lats = topCities.map(c => c.lat).join(',');
    const lons = topCities.map(c => c.lon).join(',');

    const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lons}&current=us_aqi`);
    const data = await response.json();

    // Open-Meteo returns an array of objects when multiple coordinates are requested
    const results = Array.isArray(data) ? data : [data];

    const citiesWithAQI = topCities.map((city, index) => ({
      ...city,
      aqi: results[index]?.current?.us_aqi ?? null
    }));

    // Create ticker items (duplicate for seamless loop)
    const items = [...citiesWithAQI, ...citiesWithAQI];

    tickerTrack.innerHTML = items.map(city => {
      const hasData = city.aqi !== null;
      const aqiClass = !hasData ? 'neutral' :
        city.aqi <= 50 ? 'good' :
          city.aqi <= 100 ? 'moderate' :
            city.aqi <= 200 ? 'unhealthy' : 'hazardous';

      const fullName = `${city.name}, ${city.country}`;
      const aqiText = hasData ? `AQI ${city.aqi}` : 'AQI --';

      return `
        <div class="ticker-item aqi-${aqiClass}" data-city="${city.name}" data-full-name="${fullName}" data-lat="${city.lat}" data-lon="${city.lon}">
          <span class="ticker-city">${city.name}</span>
          <span class="ticker-aqi ${aqiClass}">${aqiText}</span>
        </div>
      `;
    }).join('');

    // Add click handlers to ticker items
    document.querySelectorAll('.ticker-item').forEach(item => {
      item.addEventListener('click', async () => {
        const fullName = item.dataset.fullName || item.dataset.city;
        const lat = parseFloat(item.dataset.lat);
        const lon = parseFloat(item.dataset.lon);

        // Update input field
        locationInput.value = fullName;

        // Fetch and display data
        // The existing fetchAirQuality function already handles showLoading, updateUI, and showError
        await fetchAirQuality(lat, lon, fullName);
      });

      // Add hover effect
      item.style.cursor = 'pointer';
    });

    // Initialize Lucide icons for ticker
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Start the JS animation loop
    startTickerAnimation();

  } catch (err) {
    console.error('Failed to load ticker:', err);
    tickerTrack.innerHTML = '<div class="ticker-loading">Unable to load global data</div>';
  }
}

// Load ticker when page loads
initializeTicker();

let debounceTimer;
let selectedSuggestionIndex = -1;

// Event Listeners
locationInput.addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  const query = e.target.value.trim();
  selectedSuggestionIndex = -1; // Reset selection on new input

  if (query.length < 2) {
    suggestionsList.classList.add('hidden');
    return;
  }

  debounceTimer = setTimeout(() => {
    fetchSuggestions(query);
  }, 300);
});

// Keyboard navigation for suggestions
locationInput.addEventListener('keydown', (e) => {
  const suggestions = suggestionsList.querySelectorAll('.suggestion-item');

  if (suggestions.length === 0 || suggestionsList.classList.contains('hidden')) {
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
    updateSuggestionSelection(suggestions);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
    updateSuggestionSelection(suggestions);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
      suggestions[selectedSuggestionIndex].click();
    }
  } else if (e.key === 'Escape') {
    suggestionsList.classList.add('hidden');
    selectedSuggestionIndex = -1;
  }
});

function updateSuggestionSelection(suggestions) {
  suggestions.forEach((item, index) => {
    if (index === selectedSuggestionIndex) {
      item.classList.add('keyboard-selected');
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
      item.classList.remove('keyboard-selected');
    }
  });
}

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
  if (!locationInput.contains(e.target) && !suggestionsList.contains(e.target)) {
    suggestionsList.classList.add('hidden');
    selectedSuggestionIndex = -1;
  }
});

locateBtn.addEventListener('click', getCurrentLocation);

// Dark Mode Toggle
const darkModeToggle = document.getElementById('dark-mode-toggle');
if (darkModeToggle) {
  // Default to dark mode if no preference is saved
  const savedMode = localStorage.getItem('darkMode');
  const isDarkByDefault = savedMode === null || savedMode === 'enabled';

  if (isDarkByDefault) {
    document.body.classList.add('dark-mode');
    darkModeToggle.checked = true;
  }

  darkModeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  });
}

// Share Button
const shareBtn = document.getElementById('share-btn');
if (shareBtn) {
  shareBtn.addEventListener('click', async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Breeze - Air Quality',
          text: `Check out the air quality in ${cityNameEl.textContent}`,
          url: url
        });
      } catch (err) {
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  });
}

// Email Button
const emailBtn = document.getElementById('email-btn');
if (emailBtn) {
  emailBtn.addEventListener('click', () => {
    const city = cityNameEl.textContent || 'this location';
    const aqi = aqiValueEl.textContent || '--';
    const status = aqiStatusTextEl.textContent || 'Unknown';
    const subject = `Air Quality Report: ${city}`;
    const body = `Air Quality Index for ${city}:\n\nAQI: ${aqi} (${status})\n\nView full report: ${window.location.href}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

// PDF Button
const pdfBtn = document.getElementById('pdf-btn');
if (pdfBtn) {
  pdfBtn.addEventListener('click', () => {
    window.print();
  });
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Link copied to clipboard!');
  }).catch(() => {
    alert('Failed to copy link');
  });
}

// Functions
async function fetchSuggestions(query) {
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      showSuggestions(data.results);
    } else {
      suggestionsList.classList.add('hidden');
    }
  } catch (err) {
    console.error('Error fetching suggestions:', err);
  }
}

function showSuggestions(results) {
  suggestionsList.innerHTML = '';
  results.forEach(place => {
    const div = document.createElement('div');
    div.className = 'suggestion-item';

    const country = place.country ? `, ${place.country}` : '';
    const admin1 = place.admin1 ? `, ${place.admin1}` : '';
    const fullName = `${place.name}${admin1}${country}`;

    div.innerHTML = `
      <span class="suggestion-primary">${place.name}</span>
      <span class="suggestion-secondary">${fullName}</span>
    `;

    div.addEventListener('click', () => {
      locationInput.value = fullName;
      suggestionsList.classList.add('hidden');
      fetchAirQuality(place.latitude, place.longitude, fullName);
    });

    suggestionsList.appendChild(div);
  });
  suggestionsList.classList.remove('hidden');
}

function getCurrentLocation() {
  if (!navigator.geolocation) {
    showError('Geolocation not supported.');
    return;
  }

  showLoading();
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      await fetchAirQuality(latitude, longitude, "Your Location");
    },
    (err) => {
      showError('Unable to get your location.');
      console.error(err);
    }
  );
}

async function fetchAirQuality(lat, lon, locationName) {
  showLoading();
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.current) {
      showError('No air quality data available.');
      return;
    }

    // Update URL with location data for deep linking
    updateURL(locationName, lat, lon);

    updateUI(data.current, locationName);
  } catch (err) {
    showError('Unable to fetch air quality data.');
    console.error(err);
  }
}

// Update URL with location parameters
function updateURL(locationName, lat, lon) {
  const params = new URLSearchParams();
  params.set('city', locationName);
  params.set('lat', lat.toFixed(4));
  params.set('lon', lon.toFixed(4));

  const newURL = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState({ locationName, lat, lon }, '', newURL);
}

// Load location from URL on page load
function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  const city = params.get('city');
  const lat = params.get('lat');
  const lon = params.get('lon');

  if (city && lat && lon) {
    // Auto-load the location from URL
    fetchAirQuality(parseFloat(lat), parseFloat(lon), city);
    // Update the input field
    if (locationInput) {
      locationInput.value = city;
    }
  }
}

// Call loadFromURL when page loads
window.addEventListener('DOMContentLoaded', loadFromURL);

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
  if (event.state && event.state.locationName) {
    // Restore from history state
    fetchAirQuality(event.state.lat, event.state.lon, event.state.locationName);
    if (locationInput) {
      locationInput.value = event.state.locationName;
    }
  } else {
    // No state, reload from URL or go back to landing
    loadFromURL();
  }
});

const appDiv = document.getElementById('app');

function updateUI(data, locationName) {
  hideLoading();
  dashboardDiv.classList.remove('hidden');
  errorDiv.classList.add('hidden');

  // Trigger Layout Animation
  appDiv.classList.add('has-results');

  // Header
  cityNameEl.textContent = locationName;
  const now = new Date();
  dateTimeEl.textContent = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // AQI
  const aqi = data.us_aqi;
  aqiValueEl.textContent = aqi;

  const status = getAQIStatus(aqi);
  aqiStatusTextEl.textContent = status.text;
  aqiDescEl.textContent = status.description;

  // Color the AQI number and status indicator
  const aqiNumberEl = document.querySelector('.aqi-number-large');
  const statusIndicator = document.querySelector('.status-indicator');

  if (aqiNumberEl) {
    aqiNumberEl.style.color = status.color;
  }

  if (statusIndicator) {
    statusIndicator.style.backgroundColor = status.color;
    statusIndicator.style.boxShadow = `0 0 0 3px ${status.color}20`;
  }

  // Update status text color
  const statusH3 = document.querySelector('.status-text h3');
  if (statusH3) {
    statusH3.style.color = status.color;
  }

  // Pollutants - Update values and colors
  updatePollutant('pm25', data.pm2_5, 12, 35.4);
  updatePollutant('pm10', data.pm10, 54, 154);
  updatePollutant('no2', data.nitrogen_dioxide, 53, 100);
  updatePollutant('so2', data.sulphur_dioxide, 35, 75);
  updatePollutant('o3', data.ozone, 54, 70);
  updatePollutant('co', data.carbon_monoxide, 4400, 9400);

  // Health Tips
  healthTipsList.innerHTML = status.tips.map(tip => `<li>${tip}</li>`).join('');
}

function updatePollutant(id, value, goodLimit, moderateLimit) {
  const valEl = document.getElementById(`${id}-val`);
  const cardEl = document.getElementById(`${id}-card`);

  if (!valEl || !cardEl) return;

  const roundedValue = Math.round(value);
  valEl.textContent = roundedValue;

  // Store value for modal display
  currentMetricValues[id] = roundedValue;

  // Remove existing status classes
  cardEl.classList.remove('status-good', 'status-moderate', 'status-poor');

  // Determine status
  if (value <= goodLimit) {
    cardEl.classList.add('status-good');
  } else if (value <= moderateLimit) {
    cardEl.classList.add('status-moderate');
  } else {
    cardEl.classList.add('status-poor');
  }
}

function getAQIStatus(aqi) {
  // Granular AQI Categories with playful emojis
  if (aqi <= 25) {
    return {
      text: 'Excellent ✨',
      description: 'Air quality is pristine! Perfect day for adventures.',
      color: 'var(--aqi-good)',
      tips: ['Go outside and soak it all in! 🌟', 'Perfect time for that morning jog! 🏃', 'Windows open, fresh air flowing! 🪟']
    };
  } else if (aqi <= 50) {
    return {
      text: 'Good 😊',
      description: 'Air quality is great. Breathe easy!',
      color: 'var(--aqi-good)',
      tips: ['Open those windows! 🪟', 'Great day for outdoor activities! ⚽', 'Take a deep breath and enjoy! 🌬️']
    };
  } else if (aqi <= 75) {
    return {
      text: 'Moderate 😐',
      description: 'Air quality is acceptable for most people.',
      color: 'var(--aqi-moderate)',
      tips: ['Sensitive folks, take it easy! 🤔', 'Maybe skip that marathon today 🏃‍♀️', 'Still pretty good for most activities!']
    };
  } else if (aqi <= 100) {
    return {
      text: 'Moderate High 😕',
      description: 'Getting a bit iffy for sensitive groups.',
      color: 'var(--aqi-moderate)',
      tips: ['If you have asthma, keep that inhaler handy! 💨', 'Light outdoor activities are okay 👍', 'Stay hydrated! 💧']
    };
  } else if (aqi <= 150) {
    return {
      text: 'Unhealthy for Sensitive Groups 😷',
      description: 'Sensitive groups should be cautious.',
      color: 'var(--aqi-unhealthy-sensitive)',
      tips: ['Kids and elderly, maybe stay inside 🏠', 'Asthma? Keep medicine close! 💊', 'Cut that outdoor workout short ⏱️']
    };
  } else if (aqi <= 200) {
    return {
      text: 'Unhealthy 😨',
      description: 'Everyone may feel the effects now.',
      color: 'var(--aqi-unhealthy)',
      tips: ['Indoor day, folks! 🏠', 'Mask up if you must go out 😷', 'Windows closed, please! 🚪']
    };
  } else if (aqi <= 300) {
    return {
      text: 'Very Unhealthy 🚨',
      description: 'Serious health concerns for everyone.',
      color: 'var(--aqi-very-unhealthy)',
      tips: ['Stay inside! Not a suggestion! 🛑', 'Air purifier time! 💨', 'Seal those windows ASAP! 🔒']
    };
  } else {
    return {
      text: 'Hazardous ☠️',
      description: 'Emergency conditions. Seriously bad air.',
      color: 'var(--aqi-hazardous)',
      tips: ['STAY INSIDE. Really. 🏠', 'N95 mask minimum if you go out 😷', 'Air purifier on full blast! 💨', 'Check on your neighbors! 👥']
    };
  }
}

function showLoading() {
  const messages = [
    'Checking the air...',
    'Reading conditions...',
    'Getting data...',
    'Analyzing atmosphere...',
    'Measuring quality...'
  ];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  loadingDiv.classList.remove('hidden');
  dashboardDiv.classList.add('hidden');
  errorDiv.classList.add('hidden');

  const loadingText = loadingDiv.querySelector('p');
  if (loadingText) {
    loadingText.textContent = randomMessage;
  }
}

function showError(msg) {
  loadingDiv.classList.add('hidden');
  dashboardDiv.classList.add('hidden');
  errorDiv.textContent = msg;
  errorDiv.classList.remove('hidden');
}

function hideLoading() {
  loadingDiv.classList.add('hidden');
}

// Metric Info Modal
const metricModal = document.getElementById('metric-modal');
const metricModalBackdrop = document.getElementById('metric-modal-backdrop');
const metricModalClose = document.getElementById('metric-modal-close');
const metricModalTitle = document.getElementById('metric-modal-title');
const metricModalSubtitle = document.getElementById('metric-modal-subtitle');
const metricModalCurrent = document.getElementById('metric-modal-current');
const metricModalRanges = document.getElementById('metric-modal-ranges');

// Metric information data
const metricInfo = {
  pm25: {
    title: 'Fine Particulate Matter (PM2.5)',
    description: 'Tiny particles ≤2.5 micrometers that can penetrate deep into lungs and bloodstream.',
    ranges: [
      { label: 'Good', range: '0-12 µg/m³', class: 'range-good', min: 0, max: 12 },
      { label: 'Moderate', range: '12.1-35.4 µg/m³', class: 'range-moderate', min: 12.1, max: 35.4 },
      { label: 'Unhealthy', range: '>35.4 µg/m³', class: 'range-poor', min: 35.4, max: Infinity }
    ]
  },
  pm10: {
    title: 'Coarse Particulate Matter (PM10)',
    description: 'Inhalable particles ≤10 micrometers from dust, pollen, and mold. Affects respiratory system.',
    ranges: [
      { label: 'Good', range: '0-54 µg/m³', class: 'range-good', min: 0, max: 54 },
      { label: 'Moderate', range: '55-154 µg/m³', class: 'range-moderate', min: 55, max: 154 },
      { label: 'Unhealthy', range: '>154 µg/m³', class: 'range-poor', min: 154, max: Infinity }
    ]
  },
  no2: {
    title: 'Nitrogen Dioxide (NO₂)',
    description: 'Reddish-brown gas from vehicle emissions and power plants. Irritates airways and reduces immunity.',
    ranges: [
      { label: 'Good', range: '0-53 µg/m³', class: 'range-good', min: 0, max: 53 },
      { label: 'Moderate', range: '54-100 µg/m³', class: 'range-moderate', min: 54, max: 100 },
      { label: 'Unhealthy', range: '>100 µg/m³', class: 'range-poor', min: 100, max: Infinity }
    ]
  },
  so2: {
    title: 'Sulfur Dioxide (SO₂)',
    description: 'Colorless gas from fossil fuel combustion. Can trigger asthma and respiratory issues.',
    ranges: [
      { label: 'Good', range: '0-35 µg/m³', class: 'range-good', min: 0, max: 35 },
      { label: 'Moderate', range: '36-75 µg/m³', class: 'range-moderate', min: 36, max: 75 },
      { label: 'Unhealthy', range: '>75 µg/m³', class: 'range-poor', min: 75, max: Infinity }
    ]
  },
  o3: {
    title: 'Ground-Level Ozone (O₃)',
    description: 'Formed by sunlight reacting with pollutants. Harmful to lungs, especially during outdoor activities.',
    ranges: [
      { label: 'Good', range: '0-54 µg/m³', class: 'range-good', min: 0, max: 54 },
      { label: 'Moderate', range: '55-70 µg/m³', class: 'range-moderate', min: 55, max: 70 },
      { label: 'Unhealthy', range: '>70 µg/m³', class: 'range-poor', min: 70, max: Infinity }
    ]
  },
  co: {
    title: 'Carbon Monoxide (CO)',
    description: 'Odorless, colorless gas from incomplete combustion. Reduces oxygen delivery to body tissues.',
    ranges: [
      { label: 'Good', range: '0-4,400 µg/m³', class: 'range-good', min: 0, max: 4400 },
      { label: 'Moderate', range: '4,401-9,400 µg/m³', class: 'range-moderate', min: 4401, max: 9400 },
      { label: 'Unhealthy', range: '>9,400 µg/m³', class: 'range-poor', min: 9400, max: Infinity }
    ]
  }
};

function openMetricModal(metricId) {
  const info = metricInfo[metricId];
  if (!info) return;

  // Set modal content
  metricModalTitle.textContent = info.title;
  metricModalSubtitle.textContent = info.description;

  // Get current value
  const currentValue = currentMetricValues[metricId] || '--';

  // Determine current status
  let statusText = 'Unknown';
  if (currentValue !== '--') {
    const value = parseFloat(currentValue);
    for (const range of info.ranges) {
      if (value >= range.min && value <= range.max) {
        statusText = range.label;
        break;
      }
    }
  }

  // Set current level display
  if (currentValue !== '--') {
    metricModalCurrent.innerHTML = `<strong>${currentValue} µg/m³</strong> (${statusText})`;
  } else {
    metricModalCurrent.innerHTML = '<strong>--</strong>';
  }

  // Populate ranges
  metricModalRanges.innerHTML = info.ranges.map(range => {
    const isCurrent = currentValue !== '--' &&
      parseFloat(currentValue) >= range.min &&
      parseFloat(currentValue) <= range.max;
    return `
      <div class="range-item ${range.class} ${isCurrent ? 'current' : ''}">
        <span>${range.label}</span>
        <span>${range.range}</span>
      </div>
    `;
  }).join('');

  // Show modal
  metricModal.classList.add('active');
  metricModalBackdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeMetricModal() {
  metricModal.classList.remove('active');
  metricModalBackdrop.classList.remove('active');
  document.body.style.overflow = '';
}

// Click handler for info buttons
document.addEventListener('click', (e) => {
  const infoBtn = e.target.closest('.metric-info-btn');
  if (infoBtn) {
    e.stopPropagation();
    const metric = infoBtn.dataset.metric;
    openMetricModal(metric);
  }
});

// Close modal handlers
metricModalClose.addEventListener('click', closeMetricModal);
metricModalBackdrop.addEventListener('click', closeMetricModal);

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && metricModal.classList.contains('active')) {
    closeMetricModal();
  }
});

// Ticker Animation State
let tickerPos = 0;
let tickerBaseSpeed = 0.015; // Adjusted for longer list length
let tickerCurrentSpeed = tickerBaseSpeed;
let isTickerPaused = false;
let tickerAnimFrame;

function startTickerAnimation() {
  const track = document.getElementById('ticker-track');
  if (!track) return;

  function animate() {
    if (!isTickerPaused) {
      tickerPos += tickerCurrentSpeed;

      // Reset when we've scrolled half the width (since content is duplicated)
      if (tickerPos >= 50) {
        tickerPos = 0;
      }

      track.style.transform = `translateX(-${tickerPos}%)`;
    }
    tickerAnimFrame = requestAnimationFrame(animate);
  }

  // Cancel any existing loop
  if (tickerAnimFrame) cancelAnimationFrame(tickerAnimFrame);
  animate();
}

const playPauseBtn = document.getElementById('ticker-play-pause');
const fastForwardBtn = document.getElementById('ticker-fast-forward');

if (playPauseBtn) {
  playPauseBtn.addEventListener('click', () => {
    isTickerPaused = !isTickerPaused;

    const playIcon = playPauseBtn.querySelector('.play-icon');
    const pauseIcon = playPauseBtn.querySelector('.pause-icon');

    if (isTickerPaused) {
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
    } else {
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
    }
  });
}

if (fastForwardBtn) {
  fastForwardBtn.addEventListener('click', () => {
    // If paused, unpause temporarily or permanently? 
    // Let's force play during the fast forward, then revert to previous state?
    // User said "scrolls through", implying movement.

    const wasPaused = isTickerPaused;
    isTickerPaused = false;

    // Smoothly boost speed
    tickerCurrentSpeed = 0.5; // Fast speed

    // Animate the button to show feedback
    fastForwardBtn.style.transform = 'scale(0.9)';
    setTimeout(() => fastForwardBtn.style.transform = '', 100);

    // Revert after a short duration
    setTimeout(() => {
      tickerCurrentSpeed = tickerBaseSpeed;
      if (wasPaused) isTickerPaused = true;
    }, 800);
  });
}
