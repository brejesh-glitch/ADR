const form = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const locateBtn = document.getElementById('locate-btn');
const statusEl = document.getElementById('status');
const card = document.getElementById('weather-card');

const cityNameEl = document.getElementById('city-name');
const dateTimeEl = document.getElementById('date-time');
const iconEl = document.getElementById('weather-icon');
const temperatureEl = document.getElementById('temperature');
const conditionEl = document.getElementById('condition');
const feelsLikeEl = document.getElementById('feels-like');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const precipitationEl = document.getElementById('precipitation');
const forecastEl = document.getElementById('forecast');

const WEATHER_CODES = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Fog', icon: '🌫️' },
  48: { label: 'Icy fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Drizzle', icon: '🌦️' },
  55: { label: 'Heavy drizzle', icon: '🌧️' },
  56: { label: 'Freezing drizzle', icon: '🌧️' },
  57: { label: 'Freezing drizzle', icon: '🌧️' },
  61: { label: 'Light rain', icon: '🌧️' },
  63: { label: 'Rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  66: { label: 'Freezing rain', icon: '🌧️' },
  67: { label: 'Freezing rain', icon: '🌧️' },
  71: { label: 'Light snow', icon: '🌨️' },
  73: { label: 'Snow', icon: '🌨️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  77: { label: 'Snow grains', icon: '❄️' },
  80: { label: 'Light showers', icon: '🌦️' },
  81: { label: 'Showers', icon: '🌧️' },
  82: { label: 'Violent showers', icon: '⛈️' },
  85: { label: 'Snow showers', icon: '🌨️' },
  86: { label: 'Snow showers', icon: '❄️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm with hail', icon: '⛈️' },
  99: { label: 'Thunderstorm with hail', icon: '⛈️' },
};

function describeWeather(code) {
  return WEATHER_CODES[code] || { label: 'Unknown', icon: '❓' };
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

async function geocodeCity(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not reach geocoding service');
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`No results for "${name}"`);
  }
  const place = data.results[0];
  return {
    name: place.name,
    country: place.country,
    admin1: place.admin1,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

async function reverseGeocode(lat, lon) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.results && data.results[0] ? data.results[0] : null;
  } catch {
    return null;
  }
}

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not reach weather service');
  return res.json();
}

function renderForecast(daily) {
  forecastEl.innerHTML = '';
  const days = daily.time.slice(0, 5);
  days.forEach((dateStr, i) => {
    const date = new Date(dateStr + 'T00:00:00');
    const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
    const { icon } = describeWeather(daily.weather_code[i]);
    const max = Math.round(daily.temperature_2m_max[i]);
    const min = Math.round(daily.temperature_2m_min[i]);

    const dayEl = document.createElement('div');
    dayEl.className = 'forecast-day';
    dayEl.innerHTML = `
      <span class="day-name">${dayName}</span>
      <span>${icon}</span>
      <span class="day-temps"><span class="max">${max}°</span> / <span class="min">${min}°</span></span>
    `;
    forecastEl.appendChild(dayEl);
  });
}

function renderWeather(location, data) {
  const { current, daily } = data;
  const { label, icon } = describeWeather(current.weather_code);

  const parts = [location.name];
  if (location.admin1) parts.push(location.admin1);
  if (location.country) parts.push(location.country);
  cityNameEl.textContent = parts.join(', ');

  dateTimeEl.textContent = new Date().toLocaleString(undefined, {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  iconEl.textContent = '';
  iconEl.replaceWith(Object.assign(document.createElement('span'), {
    id: 'weather-icon',
    style: 'font-size: 64px; line-height: 1;',
    textContent: icon,
  }));

  temperatureEl.textContent = `${Math.round(current.temperature_2m)}°C`;
  conditionEl.textContent = label;
  feelsLikeEl.textContent = `${Math.round(current.apparent_temperature)}°C`;
  humidityEl.textContent = `${current.relative_humidity_2m}%`;
  windEl.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  precipitationEl.textContent = `${current.precipitation} mm`;

  renderForecast(daily);

  card.classList.remove('hidden');
}

async function loadWeatherForCity(cityName) {
  setStatus('Searching...');
  card.classList.add('hidden');
  try {
    const location = await geocodeCity(cityName);
    const data = await fetchWeather(location.latitude, location.longitude);
    renderWeather(location, data);
    setStatus('');
  } catch (err) {
    setStatus(err.message || 'Something went wrong', true);
  }
}

async function loadWeatherForCoords(lat, lon) {
  setStatus('Getting your location weather...');
  card.classList.add('hidden');
  try {
    const [place, data] = await Promise.all([
      reverseGeocode(lat, lon),
      fetchWeather(lat, lon),
    ]);
    const location = place
      ? { name: place.name, admin1: place.admin1, country: place.country }
      : { name: 'Your location' };
    renderWeather(location, data);
    setStatus('');
  } catch (err) {
    setStatus(err.message || 'Something went wrong', true);
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const value = cityInput.value.trim();
  if (value) loadWeatherForCity(value);
});

locateBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    setStatus('Geolocation is not supported by your browser', true);
    return;
  }
  setStatus('Requesting location permission...');
  navigator.geolocation.getCurrentPosition(
    (pos) => loadWeatherForCoords(pos.coords.latitude, pos.coords.longitude),
    () => setStatus('Unable to retrieve your location', true)
  );
});

loadWeatherForCity('London');
