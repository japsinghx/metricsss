import './style.css'

const locateBtn = document.getElementById('locate-btn');
const locationInput = document.getElementById('location-input');
const suggestionsList = document.getElementById('suggestions-list');
const loadingDiv = document.getElementById('loading'); // Deprecated but kept for ref ref safety
const skeletonView = document.getElementById('skeleton-view');
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

// Environmental Insights Elements
const pollenGrid = document.getElementById('pollen-grid');
const climateChart = document.getElementById('climate-chart');

// Unit toggle
let useFahrenheit = true;

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

// Apple-style letter-by-letter typing animation
function appleTypewriterEffect() {
  const animatedText = document.querySelector('.animated-text');
  if (!animatedText) return;

  const originalText = animatedText.textContent;
  animatedText.textContent = '';
  animatedText.style.opacity = '1'; // Make container visible

  // Split text into characters
  const characters = originalText.split('');

  // Create spans for each character
  characters.forEach((char, index) => {
    const span = document.createElement('span');
    span.textContent = char;
    span.style.opacity = '0';
    span.style.display = 'inline-block';
    span.style.transform = 'translateY(20px)';
    span.style.filter = 'blur(8px)';
    span.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';

    // Preserve spaces
    if (char === ' ') {
      span.style.width = '0.3em';
    }

    animatedText.appendChild(span);

    // Animate each character with delay
    setTimeout(() => {
      span.style.opacity = '1';
      span.style.transform = 'translateY(0)';
      span.style.filter = 'blur(0)';
    }, index * 120); // 120ms delay between each character for a slower, more elegant reveal
  });
}

// Run the animation when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', appleTypewriterEffect);
} else {
  appleTypewriterEffect();
}

let debounceTimer;
let selectedSuggestionIndex = -1;

const clearBtn = document.getElementById('clear-btn');

// Event Listeners
locationInput.addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  const query = e.target.value.trim();

  // Toggle clear button visibility
  if (e.target.value.length > 0) {
    clearBtn.classList.remove('hidden');
  } else {
    clearBtn.classList.add('hidden');
  }

  selectedSuggestionIndex = -1; // Reset selection on new input

  if (query.length < 2) {
    suggestionsList.classList.add('hidden');
    return;
  }

  debounceTimer = setTimeout(() => {
    fetchSuggestions(query);
  }, 300);
});

// Clear button handler
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    locationInput.value = '';
    clearBtn.classList.add('hidden');
    suggestionsList.classList.add('hidden');
    locationInput.focus();
  });
}

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

// Unit Toggle Switch
const unitToggleInput = document.getElementById('unit-toggle-input');
if (unitToggleInput) {
  unitToggleInput.addEventListener('change', () => {
    useFahrenheit = unitToggleInput.checked;

    // Re-render climate chart if data exists
    if (climateChart && !climateChart.querySelector('.climate-loading')) {
      // Trigger a re-fetch to update the display
      const params = new URLSearchParams(window.location.search);
      const lat = params.get('lat');
      const lon = params.get('lon');
      const city = params.get('city');
      if (lat && lon && city) {
        fetchClimateData(parseFloat(lat), parseFloat(lon), city);
      }
    }
  });
}

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

    // Fetch additional environmental data
    fetchPollen(lat, lon);
    fetchClimateData(lat, lon, locationName);
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
      text: 'Slightly High 😕',
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
  if (skeletonView) {
    skeletonView.classList.remove('hidden');
    // Ensure smooth entry
    skeletonView.style.opacity = '1';
  }

  if (loadingDiv) loadingDiv.classList.add('hidden'); // Ensure old loading is gone
  dashboardDiv.classList.add('hidden');
  errorDiv.classList.add('hidden');
}

function showError(msg) {
  if (skeletonView) skeletonView.classList.add('hidden');
  loadingDiv.classList.add('hidden');
  dashboardDiv.classList.add('hidden');
  errorDiv.textContent = msg;
  errorDiv.classList.remove('hidden');
}

function hideLoading() {
  if (skeletonView) skeletonView.classList.add('hidden');
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

  // Reset visibility of headers for standard metrics
  const sectionTitles = metricModal.querySelectorAll('.metric-modal-section-title');
  sectionTitles.forEach(el => el.style.display = 'block');

  const statusLabel = metricModal.querySelector('.current-status-label');
  if (statusLabel) statusLabel.style.display = 'block';

  const rangesTitle = sectionTitles[1]; // Usually the second one
  if (rangesTitle) rangesTitle.textContent = 'Health Ranges';

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

  // Handle pollen info buttons
  const pollenBtn = e.target.closest('.pollen-info-btn');
  if (pollenBtn) {
    e.stopPropagation();
    const code = pollenBtn.dataset.code;
    openPollenModal(code);
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

  // Slow down on hover
  const container = track.parentElement;
  if (container) {
    container.addEventListener('mouseenter', () => {
      tickerCurrentSpeed = tickerBaseSpeed * 0.4; // Slow down to 40% speed
    });
    container.addEventListener('mouseleave', () => {
      tickerCurrentSpeed = tickerBaseSpeed;
    });
  }

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

// --- Environmental Insights Functions ---

async function fetchPollen(lat, lon) {
  // Try Google Pollen API first (if API key is configured)
  const googleApiKey = import.meta.env.VITE_GOOGLE_POLLEN_API_KEY;

  console.log('Pollen API Key check:', {
    exists: !!googleApiKey,
    length: googleApiKey?.length,
    firstChars: googleApiKey?.substring(0, 10),
    isPlaceholder: googleApiKey === 'your_api_key_here'
  });

  if (googleApiKey && googleApiKey !== 'your_api_key_here') {
    try {
      console.log('Attempting Google Pollen API with coords:', { lat, lon });
      const googleData = await fetchGooglePollen(lat, lon, googleApiKey);
      console.log('Google Pollen API returned:', googleData);
      if (googleData) {
        updatePollenUI(googleData, 'google');
        return;
      }
    } catch (err) {
      console.warn('Google Pollen API failed, falling back to Open-Meteo:', err);
    }
  } else {
    console.log('No valid Google API key, using Open-Meteo fallback');
  }

  // Fallback to Open-Meteo (Europe only)
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen&timezone=auto&forecast_days=1`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.hourly) {
      updatePollenUI(data.hourly, 'openmeteo');
    }
  } catch (err) {
    console.error('Error fetching pollen data:', err);
    if (pollenGrid) pollenGrid.innerHTML = '<p class="error-text">Unable to load pollen data</p>';
  }
}

async function fetchGooglePollen(lat, lon, apiKey) {
  // Use GET method with URL parameters (like the working curl command)
  const url = `https://pollen.googleapis.com/v1/forecast:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lon}&days=1&languageCode=en`;

  const response = await fetch(url, {
    method: 'GET'
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Pollen API error:', response.status, errorText);
    throw new Error(`Google Pollen API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('Google Pollen API response:', data); // Debug log

  // Transform Google's format to our format
  if (data.dailyInfo && data.dailyInfo.length > 0) {
    const today = data.dailyInfo[0];
    return {
      pollenTypes: today.pollenTypeInfo || [],
      plants: today.plantInfo || []
    };
  }

  return null;
}

let currentPollenDetails = {};

function updatePollenUI(data, source) {
  if (!pollenGrid) return;

  if (source === 'google') {
    // Google Pollen API format - compact like pollutants
    const allItems = [];
    currentPollenDetails = {}; // Reset storage

    // Process Pollen Types (Grass, Tree, Weed)
    if (data.pollenTypes) {
      data.pollenTypes.forEach(type => {
        const indexInfo = type.indexInfo || {
          value: 0,
          category: 'Low',
          color: { red: 0, green: 1, blue: 0 } // Default green-ish
        };

        // Store details for modal
        currentPollenDetails[type.code] = { ...type, isPlant: false };

        allItems.push({
          code: type.code,
          name: type.displayName,
          value: indexInfo.value,
          category: indexInfo.category,
          color: getGooglePollenColor(indexInfo.category),
          hasDetails: !!(type.healthRecommendations || type.indexInfo?.indexDescription)
        });
      });
    }

    // Process Plants
    if (data.plants) {
      data.plants.forEach(plant => {
        const indexInfo = plant.indexInfo || {
          value: 0,
          category: 'Low',
          color: { red: 0, green: 1, blue: 0 }
        };

        // Fix naming confusion for Graminales
        // API often returns "Grasses" for GRAMINALES, which confuses it with the GRASS category
        let displayName = plant.displayName;
        if (plant.code === 'GRAMINALES') {
          displayName = 'Graminales';
        }

        // Store details for modal
        currentPollenDetails[plant.code] = { ...plant, displayName: displayName, isPlant: true };

        allItems.push({
          code: plant.code,
          name: displayName,
          value: indexInfo.value,
          category: indexInfo.category,
          color: getGooglePollenColor(indexInfo.category),
          isPlant: true,
          hasDetails: !!(plant.healthRecommendations || plant.plantDescription || plant.indexInfo?.indexDescription)
        });
      });
    }

    if (allItems.length === 0) {
      pollenGrid.innerHTML = `
        <div class="pollen-no-data">
          <span>No pollen data available</span>
        </div>
      `;
      return;
    }

    // Render Compact Items
    pollenGrid.innerHTML = allItems.map(item => `
      <div class="pollen-compact-item">
        <div class="pollen-compact-header">
          <span class="pollen-compact-name">${item.name}</span>
          <div style="display: flex; align-items: center; gap: 0.25rem; flex-shrink: 0;">
             <span class="pollen-compact-value ${item.color}">${item.value}</span>
             ${item.hasDetails ? `
            <button class="pollen-info-btn" data-code="${item.code}" aria-label="More info about ${item.name}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            </button>
          ` : ''}
          </div>
        </div>
        <div class="pollen-compact-bar">
          <div class="pollen-compact-fill ${item.color}" style="width: ${(item.value / 5) * 100}%"></div>
        </div>
        <span class="pollen-compact-label">${item.category}</span>
      </div>
    `).join('');
  } else {
    // Open-Meteo format (existing logic)
    const now = new Date();
    const currentHour = now.getHours();

    // Check if data is available
    if (data.alder_pollen[currentHour] === null) {
      pollenGrid.innerHTML = `
        <div class="pollen-unavailable">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 0.5rem; opacity: 0.5;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
          </svg>
          <p>Allergy data unavailable for this location.</p>
        </div>
      `;
      return;
    }

    const pollenTypes = [
      { key: 'alder_pollen', name: 'Alder' },
      { key: 'birch_pollen', name: 'Birch' },
      { key: 'grass_pollen', name: 'Grass' },
      { key: 'mugwort_pollen', name: 'Mugwort' },
      { key: 'olive_pollen', name: 'Olive' },
      { key: 'ragweed_pollen', name: 'Ragweed' }
    ];

    pollenGrid.innerHTML = pollenTypes.map(type => {
      const value = data[type.key][currentHour];
      const level = getPollenLevel(value);

      return `
        <div class="pollen-item">
          <div class="pollen-header">
            <span class="pollen-name">${type.name}</span>
            <span class="pollen-value">${value} <span class="unit">gr/m³</span></span>
          </div>
          <div class="pollen-bar-bg">
            <div class="pollen-bar-fill ${level.class}" style="width: ${Math.min((value / 100) * 100, 100)}%"></div>
          </div>
          <span class="pollen-label ${level.class}">${level.label}</span>
        </div>
      `;
    }).join('');
  }
}

function openPollenModal(code) {
  const info = currentPollenDetails[code];
  if (!info) return;

  const indexInfo = info.indexInfo || {
    value: 0,
    category: 'Low',
    indexDescription: 'No active pollen detected.'
  };

  // Set modal content
  metricModalTitle.textContent = info.displayName;
  metricModalSubtitle.textContent = indexInfo.indexDescription;

  // Hide "Your Current Level" and "Health Ranges" headers for Pollen
  const sectionTitles = metricModal.querySelectorAll('.metric-modal-section-title');
  sectionTitles.forEach(el => el.style.display = 'none');

  // Hide "Current Value" text label
  const statusLabel = metricModal.querySelector('.current-status-label');
  if (statusLabel) statusLabel.style.display = 'none';

  // Current Level & Side-by-Side Legend
  const colorClass = getGooglePollenColor(indexInfo.category);
  metricModalCurrent.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 1rem;">
      <div style="display: flex; flex-direction: column;">
        <span class="pollen-modal-value ${colorClass}" style="line-height: 1; margin-bottom: 0.25rem;">${indexInfo.value}</span>
        <span class="pollen-modal-category" style="margin: 0;">${indexInfo.category}</span>
      </div>
      
      <div class="pollen-legend-side">
        <div class="pollen-legend-grid" style="grid-template-columns: repeat(2, 1fr); gap: 0.25rem 0.75rem;">
           <div class="legend-item"><span class="legend-dot level-low"></span>Low (0-1)</div>
           <div class="legend-item"><span class="legend-dot level-moderate"></span>Mod (2-3)</div>
           <div class="legend-item"><span class="legend-dot level-high"></span>High (4)</div>
           <div class="legend-item"><span class="legend-dot level-extreme"></span>Very High (5)</div>
        </div>
      </div>
    </div>
  `;

  // Build content for the "ranges" area (repurposed for details)
  let detailsHtml = '';

  // 1. Image (Top Priority)
  if (info.plantDescription && info.plantDescription.picture) {
    detailsHtml += `
        <div class="pollen-section no-border">
            <img src="${info.plantDescription.picture}" alt="${info.displayName}" class="pollen-detail-image">
        </div>
      `;
  }

  // 2. About this Plant
  if (info.plantDescription) {
    const pd = info.plantDescription;
    detailsHtml += `
      <div class="pollen-section">
        <h4 class="pollen-section-title">About this Plant</h4>
        <div class="plant-details">
          ${pd.family ? `<p><strong>Family:</strong> ${pd.family}</p>` : ''}
          ${pd.season ? `<p><strong>Season:</strong> ${pd.season}</p>` : ''}
          ${pd.specialColors ? `<p><strong>Appearance:</strong> ${pd.specialColors}</p>` : ''}
          ${pd.crossReaction ? `<p><strong>Cross Reaction:</strong> ${pd.crossReaction}</p>` : ''}
        </div>
      </div>
    `;
  }

  // 3. Health Recommendations
  if (info.healthRecommendations && info.healthRecommendations.length > 0) {
    detailsHtml += `
      <div class="pollen-section">
        <h4 class="pollen-section-title">Health Recommendations</h4>
        <ul class="pollen-tips-list">
          ${info.healthRecommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  metricModalRanges.style.display = 'block';
  metricModalRanges.innerHTML = detailsHtml;

  // Show modal
  metricModal.classList.add('active');
  metricModalBackdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function getGooglePollenColor(category) {
  if (!category) return 'level-low'; // Default to low/green

  const cat = category.toLowerCase().replace(/\s+/g, '_');

  switch (cat) {
    case 'none':
    case 'no_data':
      return 'level-none';
    case 'very_low':
    case 'verylow':
      return 'level-low';
    case 'low':
      return 'level-low';
    case 'moderate':
      return 'level-moderate';
    case 'high':
      return 'level-high';
    case 'very_high':
    case 'veryhigh':
      return 'level-extreme';
    default:
      return 'level-low'; // Default safe
  }
}

function getPollenLevel(value) {
  if (value < 10) return { label: 'Low', class: 'level-low' };
  if (value < 30) return { label: 'Moderate', class: 'level-moderate' };
  if (value < 100) return { label: 'High', class: 'level-high' };
  return { label: 'Very High', class: 'level-extreme' };
}

// Temperature conversion helpers
function celsiusToFahrenheit(celsius) {
  return (celsius * 9 / 5) + 32;
}

// Convert temperature DIFFERENCE (not absolute temperature)
function celsiusDifferenceToFahrenheit(celsiusDiff) {
  return celsiusDiff * 9 / 5;
}

function formatTemp(celsius) {
  if (useFahrenheit) {
    return celsiusToFahrenheit(celsius).toFixed(1) + '°F';
  }
  return celsius.toFixed(1) + '°C';
}

async function fetchClimateData(lat, lon, locationName) {
  try {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    // Fetch temperature data for this day across multiple decades
    const years = [1980, 1990, 2000, 2010, 2020, today.getFullYear()];

    const requests = years.map(year => {
      const date = `${year}-${month}-${day}`;
      return fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${date}&end_date=${date}&daily=temperature_2m_max&timezone=auto`)
        .then(res => res.json())
        .catch(() => null);
    });

    const responses = await Promise.all(requests);

    const climateData = responses.map((data, index) => ({
      year: years[index],
      temp: data?.daily?.temperature_2m_max?.[0] ?? null
    })).filter(d => d.temp !== null);

    if (climateData.length > 0) {
      updateClimateUI(climateData, locationName);
    } else {
      if (climateChart) climateChart.innerHTML = '<p class="error-text">Climate data unavailable for this location</p>';
    }

  } catch (err) {
    console.error('Error fetching climate data:', err);
    if (climateChart) climateChart.innerHTML = '<p class="error-text">Unable to load climate data</p>';
  }
}

function updateClimateUI(data) {
  if (!climateChart) return;

  const temps = data.map(d => d.temp);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const range = maxTemp - minTemp || 1;

  // Calculate average warming from baseline (earliest year available)
  const baseline = data[0].temp;
  const baselineYear = data[0].year;
  const latest = data[data.length - 1].temp;
  const warming = latest - baseline;

  const warmingClass = warming > 0 ? 'warming' : warming < 0 ? 'cooling' : 'stable';
  const warmingDisplay = useFahrenheit ? celsiusDifferenceToFahrenheit(warming).toFixed(1) : warming.toFixed(1);
  const unit = useFahrenheit ? '°F' : '°C';

  climateChart.innerHTML = `
    <div class="climate-summary ${warmingClass}">
      <div class="climate-stat">
        <span class="stat-label">Change since ${baselineYear}</span>
        <span class="stat-value">${warming > 0 ? '+' : ''}${warmingDisplay}${unit}</span>
      </div>
    </div>
    <div class="climate-bars">
      ${data.map(item => {
    const heightPercent = ((item.temp - minTemp) / range) * 60 + 30;
    const diff = item.temp - baseline;

    let colorClass = 'climate-neutral';
    if (diff > 2) colorClass = 'climate-hot';
    else if (diff > 0.5) colorClass = 'climate-warm';
    else if (diff < -0.5) colorClass = 'climate-cool';

    const displayTemp = formatTemp(item.temp);

    return `
          <div class="climate-bar-wrapper">
            <div class="climate-bar ${colorClass}" style="height: ${heightPercent}%">
              <span class="climate-temp">${displayTemp}</span>
            </div>
            <span class="climate-year">${item.year}</span>
          </div>
        `;
  }).join('')}
    </div>
  `;
}
