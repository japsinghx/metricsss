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

// Top 10 most populated cities with coordinates
const topCities = [
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
  { name: 'Delhi', country: 'India', lat: 28.6139, lon: 77.2090 },
  { name: 'Shanghai', country: 'China', lat: 31.2304, lon: 121.4737 },
  { name: 'São Paulo', country: 'Brazil', lat: -23.5505, lon: -46.6333 },
  { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lon: -99.1332 },
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lon: 31.2357 },
  { name: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777 },
  { name: 'Beijing', country: 'China', lat: 39.9042, lon: 116.4074 },
  { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lon: 90.4125 },
  { name: 'Osaka', country: 'Japan', lat: 34.6937, lon: 135.5022 }
];

// Initialize ticker on page load
async function initializeTicker() {
  const tickerTrack = document.getElementById('ticker-track');
  if (!tickerTrack) return;

  try {
    const cityDataPromises = topCities.map(city =>
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&current=us_aqi`)
        .then(res => res.json())
        .then(data => ({
          ...city,
          aqi: data.current?.us_aqi || null
        }))
        .catch(() => ({ ...city, aqi: null }))
    );

    const citiesWithAQI = await Promise.all(cityDataPromises);

    // Create ticker items (duplicate for seamless loop)
    const items = [...citiesWithAQI, ...citiesWithAQI];

    tickerTrack.innerHTML = items.map(city => {
      if (city.aqi === null) return '';

      const aqiClass = city.aqi <= 50 ? 'good' :
        city.aqi <= 100 ? 'moderate' :
          city.aqi <= 200 ? 'unhealthy' : 'hazardous';

      return `
        <div class="ticker-item aqi-${aqiClass}">
          <span class="ticker-city">${city.name}</span>
          <span class="ticker-aqi ${aqiClass}">AQI ${city.aqi}</span>
        </div>
      `;
    }).join('');

    // Initialize Lucide icons for ticker
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  } catch (err) {
    console.error('Failed to load ticker:', err);
    tickerTrack.innerHTML = '<div class="ticker-loading">Unable to load global data</div>';
  }
}

// Load ticker when page loads
initializeTicker();

let debounceTimer;

// Event Listeners
locationInput.addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  const query = e.target.value.trim();

  if (query.length < 2) {
    suggestionsList.classList.add('hidden');
    return;
  }

  debounceTimer = setTimeout(() => {
    fetchSuggestions(query);
  }, 300);
});

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
  if (!locationInput.contains(e.target) && !suggestionsList.contains(e.target)) {
    suggestionsList.classList.add('hidden');
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

    div.innerHTML = `
      <span class="suggestion-primary">${place.name}</span>
      <span class="suggestion-secondary">${place.name}${admin1}${country}</span>
    `;

    div.addEventListener('click', () => {
      locationInput.value = place.name;
      suggestionsList.classList.add('hidden');
      fetchAirQuality(place.latitude, place.longitude, `${place.name}${country}`);
    });

    suggestionsList.appendChild(div);
  });
  suggestionsList.classList.remove('hidden');
}

function getCurrentLocation() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser.');
    return;
  }

  showLoading();
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      await fetchAirQuality(latitude, longitude, "Your Location");
    },
    (err) => {
      showError('Unable to retrieve your location.');
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
      showError('Air quality data unavailable for this location.');
      return;
    }

    updateUI(data.current, locationName);
  } catch (err) {
    showError('Failed to fetch air quality data.');
    console.error(err);
  }
}

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

  // Color AQI display
  const aqiDisplay = document.querySelector('.aqi-display');
  if (aqiDisplay) {
    aqiDisplay.style.background = `${status.color}15`;
    aqiDisplay.style.borderLeft = `4px solid ${status.color}`;
  }

  const aqiNumber = document.querySelector('.aqi-number');
  if (aqiNumber) {
    aqiNumber.style.color = status.color;
  }

  const statusIcon = document.querySelector('.status-icon-small');
  if (statusIcon) {
    statusIcon.style.color = status.color;
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

  // Re-initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function updatePollutant(id, value, goodLimit, moderateLimit) {
  const valEl = document.getElementById(`${id}-val`);
  const cardEl = document.getElementById(`${id}-card`);

  if (!valEl || !cardEl) return;

  valEl.textContent = Math.round(value);

  // Remove existing status classes
  cardEl.classList.remove('status-good', 'status-moderate', 'status-poor');

  if (value <= goodLimit) {
    cardEl.classList.add('status-good');
  } else if (value <= moderateLimit) {
    cardEl.classList.add('status-moderate');
  } else {
    cardEl.classList.add('status-poor');
  }
}

function getAQIStatus(aqi) {
  // Granular AQI Categories
  if (aqi <= 25) {
    return {
      text: 'Excellent',
      description: 'Air quality is pristine. Perfect for all outdoor activities.',
      color: 'var(--aqi-good)',
      tips: ['Enjoy the fresh air!', 'Great time for exercise and outdoor play.']
    };
  } else if (aqi <= 50) {
    return {
      text: 'Good',
      description: 'Air quality is satisfactory and poses little or no risk.',
      color: 'var(--aqi-good)',
      tips: ['Open windows to ventilate your home.', 'Outdoor activities are safe for everyone.']
    };
  } else if (aqi <= 75) {
    return {
      text: 'Moderate',
      description: 'Air quality is acceptable; however, there may be some concern for very sensitive people.',
      color: 'var(--aqi-moderate)',
      tips: ['Sensitive individuals should consider limiting prolonged outdoor exertion.', 'Generally safe for most people.']
    };
  } else if (aqi <= 100) {
    return {
      text: 'Moderate High',
      description: 'Air quality is acceptable but approaching unhealthy for sensitive groups.',
      color: 'var(--aqi-moderate)',
      tips: ['If you have respiratory issues, keep an eye on how you feel.', 'Reduce heavy exertion outdoors if you are sensitive.']
    };
  } else if (aqi <= 150) {
    return {
      text: 'Unhealthy for Sensitive Groups',
      description: 'Members of sensitive groups may experience health effects.',
      color: 'var(--aqi-unhealthy-sensitive)',
      tips: ['People with asthma should keep medicine handy.', 'Children and older adults should limit outdoor exertion.']
    };
  } else if (aqi <= 200) {
    return {
      text: 'Unhealthy',
      description: 'Everyone may begin to experience health effects.',
      color: 'var(--aqi-unhealthy)',
      tips: ['Avoid prolonged outdoor exertion.', 'Wear a mask if you must go outside.', 'Keep windows closed.']
    };
  } else if (aqi <= 300) {
    return {
      text: 'Very Unhealthy',
      description: 'Health warnings of emergency conditions. The entire population is more likely to be affected.',
      color: 'var(--aqi-very-unhealthy)',
      tips: ['Avoid all outdoor activities.', 'Use an air purifier indoors.', 'Seal windows and doors.']
    };
  } else {
    return {
      text: 'Hazardous',
      description: 'Health alert: everyone may experience more serious health effects.',
      color: 'var(--aqi-hazardous)',
      tips: ['Stay indoors and keep activity levels low.', 'Do not open windows.', 'Wear a high-quality mask if you must go outside.']
    };
  }
}

function showLoading() {
  loadingDiv.classList.remove('hidden');
  dashboardDiv.classList.add('hidden');
  errorDiv.classList.add('hidden');
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
