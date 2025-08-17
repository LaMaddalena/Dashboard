// Personal Dashboard Application
// Configuration and main application logic

// ===========================================
// CONFIGURATION - Edit these values as needed
// ===========================================

const CONFIG = {
  // Frequent Links Configuration
  frequentLinks: [
    {
      name: "Work",
      color: "#2563eb",
      items: [
        {"label": "Perplexity", "url": "https://perplexity.ai", "icon": "🧠"},
        {"label": "Gmail", "url": "https://gmail.com", "icon": "📧"},
        {"label": "Google Calendar", "url": "https://calendar.google.com", "icon": "📅"},
        {"label": "Google Drive", "url": "https://drive.google.com", "icon": "💾"},
        {"label": "GitHub", "url": "https://github.com", "icon": "🐙"}
      ]
    },
    {
      name: "Personal", 
      color: "#dc2626",
      items: [
        {"label": "Notion", "url": "https://notion.so", "icon": "📝"},
        {"label": "Google Photos", "url": "https://photos.google.com", "icon": "📷"},
        {"label": "YouTube", "url": "https://youtube.com", "icon": "📺"}
      ]
    },
    {
      name: "Tools",
      color: "#059669", 
      items: [
        {"label": "GCP Console", "url": "https://console.cloud.google.com", "icon": "☁️"},
        {"label": "AWS Console", "url": "https://console.aws.amazon.com", "icon": "🛠️"},
        {"label": "Jira", "url": "https://atlassian.com", "icon": "🎯"}
      ]
    },
    {
      name: "Reading",
      color: "#7c3aed",
      items: [
        {"label": "NYTimes", "url": "https://nytimes.com", "icon": "📰"},
        {"label": "Ars Technica", "url": "https://arstechnica.com", "icon": "🔬"}, 
        {"label": "Hacker News", "url": "https://news.ycombinator.com", "icon": "🔥"}
      ]
    }
  ],

  // Location for weather (San Francisco, CA)
  location: {
    city: "San Francisco",
    lat: 37.7749,
    lon: -122.4194,
    units: "imperial" // imperial or metric
  },

  // Calendar Configuration
  // TODO: For Google Calendar, add your API key and Calendar ID
  // TODO: For iCal, add your private calendar URL
  calendar: {
    mode: "ical", // "ical" or "google"
    icalUrl: "", // Add your iCal URL here (e.g., "https://calendar.google.com/calendar/ical/your-calendar-id/private-token/basic.ics")
    googleApiKey: "", // Add your Google Calendar API key here
    calendarId: "" // Add your Google Calendar ID here
  },

  // RSS Feed URLs
  rssFeeds: [
    "https://feeds.arstechnica.com/arstechnica/index",
    "https://news.ycombinator.com/rss"
  ],

  // Stock and Crypto Tickers
  tickers: {
    stocks: ["AAPL", "MSFT", "NVDA", "GOOGL"],
    crypto: ["BTC", "ETH", "SOL"]
  },

  // Auto-refresh intervals (in seconds)
  refreshIntervals: {
    weather: 1800,    // 30 minutes
    calendar: 300,    // 5 minutes
    rss: 600,         // 10 minutes
    tickers: 60       // 1 minute
  }
};

// ===========================================
// APPLICATION STATE AND UTILITIES
// ===========================================

let refreshTimers = {};
let networkOnline = navigator.onLine;

// Cache utilities with TTL
const cache = {
  set(key, data, ttlSeconds) {
    const item = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    };
    try {
      localStorage.setItem(`dashboard_${key}`, JSON.stringify(item));
    } catch (e) {
      console.warn('Cache storage failed:', e);
    }
  },

  get(key) {
    try {
      const item = JSON.parse(localStorage.getItem(`dashboard_${key}`));
      if (!item) return null;
      
      if (Date.now() - item.timestamp > item.ttl) {
        localStorage.removeItem(`dashboard_${key}`);
        return null;
      }
      
      return item.data;
    } catch (e) {
      return null;
    }
  },

  clear() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('dashboard_'));
    keys.forEach(key => localStorage.removeItem(key));
  }
};

// Weather condition mapping
const weatherIcons = {
  0: '☀️',   // Clear sky
  1: '🌤️',   // Mainly clear
  2: '⛅',   // Partly cloudy
  3: '☁️',   // Overcast
  45: '🌫️',  // Fog
  48: '🌫️',  // Depositing rime fog
  51: '🌦️',  // Light drizzle
  53: '🌦️',  // Moderate drizzle
  55: '🌦️',  // Dense drizzle
  61: '🌧️',  // Slight rain
  63: '🌧️',  // Moderate rain
  65: '🌧️',  // Heavy rain
  71: '🌨️',  // Slight snow
  73: '🌨️',  // Moderate snow
  75: '🌨️',  // Heavy snow
  77: '🌨️',  // Snow grains
  80: '🌦️',  // Slight rain showers
  81: '🌦️',  // Moderate rain showers
  82: '🌦️',  // Violent rain showers
  85: '🌨️',  // Slight snow showers
  86: '🌨️',  // Heavy snow showers
  95: '⛈️',  // Thunderstorm
  96: '⛈️',  // Thunderstorm with hail
  99: '⛈️'   // Thunderstorm with heavy hail
};

// ===========================================
// INITIALIZATION
// ===========================================

document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  console.log('Initializing Personal Dashboard...');
  
  // Initialize theme
  initializeTheme();
  
  // Render static content
  renderFrequentLinks();
  
  // Load dynamic content
  loadAllData();
  
  // Set up auto-refresh timers
  setupRefreshTimers();
  
  // Network status monitoring
  setupNetworkMonitoring();
  
  // Keyboard navigation
  setupKeyboardNavigation();
  
  console.log('Dashboard initialized successfully');
}

// ===========================================
// THEME MANAGEMENT
// ===========================================

function initializeTheme() {
  const savedTheme = localStorage.getItem('dashboard_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  
  setTheme(theme);
  
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('dashboard_theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-color-scheme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  localStorage.setItem('dashboard_theme', newTheme);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-color-scheme', theme);
  const themeIcon = document.querySelector('.theme-toggle__icon');
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

// ===========================================
// FREQUENT LINKS
// ===========================================

function renderFrequentLinks() {
  const container = document.getElementById('linksGrid');
  if (!container) return;
  
  container.innerHTML = CONFIG.frequentLinks.map(group => `
    <div class="link-group">
      <div class="link-group__header">
        <h3 class="link-group__title">
          <span class="link-group__indicator" style="background-color: ${group.color}"></span>
          ${group.name}
        </h3>
      </div>
      <div class="link-group__items">
        ${group.items.map(item => `
          <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="link-tile">
            <span class="link-tile__icon">${item.icon || '🔗'}</span>
            <span class="link-tile__label">${item.label}</span>
          </a>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// ===========================================
// WEATHER FUNCTIONALITY
// ===========================================

async function loadWeather() {
  const weatherCard = document.getElementById('weatherCard');
  const weatherSkeleton = document.getElementById('weatherSkeleton');
  const weatherContent = document.getElementById('weatherContent');
  const weatherError = document.getElementById('weatherError');
  
  // Show loading state
  weatherSkeleton.style.display = 'block';
  weatherContent.style.display = 'none';
  weatherError.style.display = 'none';
  
  try {
    // Check cache first
    const cachedWeather = cache.get('weather');
    if (cachedWeather && networkOnline) {
      renderWeather(cachedWeather);
      return;
    }
    
    if (!networkOnline) {
      throw new Error('No network connection');
    }
    
    const { lat, lon, units } = CONFIG.location;
    const tempUnit = units === 'imperial' ? 'fahrenheit' : 'celsius';
    const windUnit = units === 'imperial' ? 'mph' : 'kmh';
    const precipUnit = units === 'imperial' ? 'inch' : 'mm';
    
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&precipitation_unit=${precipUnit}&timezone=auto&forecast_days=7`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache the data
    cache.set('weather', data, CONFIG.refreshIntervals.weather);
    
    renderWeather(data);
    
  } catch (error) {
    console.error('Weather loading failed:', error);
    weatherSkeleton.style.display = 'none';
    weatherError.style.display = 'block';
    
    // Try to show cached data even if expired
    const cachedWeather = cache.get('weather') || localStorage.getItem('dashboard_weather_backup');
    if (cachedWeather) {
      renderWeather(typeof cachedWeather === 'string' ? JSON.parse(cachedWeather) : cachedWeather);
      return;
    }
  }
}

function renderWeather(data) {
  const weatherSkeleton = document.getElementById('weatherSkeleton');
  const weatherContent = document.getElementById('weatherContent');
  const weatherError = document.getElementById('weatherError');
  
  if (!data || !data.current) {
    weatherError.style.display = 'block';
    return;
  }
  
  const current = data.current;
  const daily = data.daily;
  const units = CONFIG.location.units;
  const tempSymbol = units === 'imperial' ? '°F' : '°C';
  const windUnit = units === 'imperial' ? 'mph' : 'km/h';
  
  weatherContent.innerHTML = `
    <div class="weather-current">
      <div class="weather-icon">${weatherIcons[current.weather_code] || '🌡️'}</div>
      <div class="weather-temp">
        <h3 class="weather-temp__main">${Math.round(current.temperature_2m)}${tempSymbol}</h3>
        <p class="weather-temp__desc">Feels like ${Math.round(current.apparent_temperature)}${tempSymbol}</p>
      </div>
    </div>
    
    <div class="weather-details">
      <div class="weather-detail">
        <p class="weather-detail__label">Humidity</p>
        <p class="weather-detail__value">${current.relative_humidity_2m}%</p>
      </div>
      <div class="weather-detail">
        <p class="weather-detail__label">Wind</p>
        <p class="weather-detail__value">${Math.round(current.wind_speed_10m)} ${windUnit}</p>
      </div>
      <div class="weather-detail">
        <p class="weather-detail__label">Precipitation</p>
        <p class="weather-detail__value">${current.precipitation || 0}${units === 'imperial' ? '"' : 'mm'}</p>
      </div>
      <div class="weather-detail">
        <p class="weather-detail__label">Today's High</p>
        <p class="weather-detail__value">${Math.round(daily.temperature_2m_max[0])}${tempSymbol}</p>
      </div>
    </div>
    
    <div class="weather-forecast">
      ${daily.time.slice(1, 6).map((date, index) => {
        const day = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
        return `
          <div class="forecast-item">
            <span class="forecast-item__day">${day}</span>
            <span class="forecast-item__icon">${weatherIcons[daily.weather_code[index + 1]] || '🌡️'}</span>
            <div class="forecast-item__temps">
              <span class="forecast-item__high">${Math.round(daily.temperature_2m_max[index + 1])}°</span>
              <span class="forecast-item__low">${Math.round(daily.temperature_2m_min[index + 1])}°</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  weatherSkeleton.style.display = 'none';
  weatherContent.style.display = 'block';
  weatherError.style.display = 'none';
  
  updateLastUpdated();
}

// ===========================================
// CALENDAR FUNCTIONALITY
// ===========================================

async function loadCalendar() {
  const calendarSkeleton = document.getElementById('calendarSkeleton');
  const calendarContent = document.getElementById('calendarContent');
  const calendarSetup = document.getElementById('calendarSetup');
  const calendarError = document.getElementById('calendarError');
  
  // Check if calendar is configured
  if (!CONFIG.calendar.icalUrl && !CONFIG.calendar.googleApiKey) {
    calendarSkeleton.style.display = 'none';
    calendarContent.style.display = 'none';
    calendarSetup.style.display = 'block';
    calendarError.style.display = 'none';
    return;
  }
  
  // Show loading state
  calendarSkeleton.style.display = 'block';
  calendarContent.style.display = 'none';
  calendarSetup.style.display = 'none';
  calendarError.style.display = 'none';
  
  try {
    // Check cache first
    const cachedEvents = cache.get('calendar');
    if (cachedEvents && networkOnline) {
      renderCalendar(cachedEvents);
      return;
    }
    
    if (!networkOnline) {
      throw new Error('No network connection');
    }
    
    let events = [];
    
    if (CONFIG.calendar.mode === 'ical' && CONFIG.calendar.icalUrl) {
      events = await loadICalEvents();
    } else if (CONFIG.calendar.mode === 'google' && CONFIG.calendar.googleApiKey) {
      events = await loadGoogleCalendarEvents();
    }
    
    // Cache the events
    cache.set('calendar', events, CONFIG.refreshIntervals.calendar);
    
    renderCalendar(events);
    
  } catch (error) {
    console.error('Calendar loading failed:', error);
    calendarSkeleton.style.display = 'none';
    calendarError.style.display = 'block';
    
    // Try to show cached data
    const cachedEvents = cache.get('calendar');
    if (cachedEvents) {
      renderCalendar(cachedEvents);
    }
  }
}

async function loadICalEvents() {
  // Note: iCal loading from external URLs will likely be blocked by CORS
  // This is a simplified implementation
  const response = await fetch(CONFIG.calendar.icalUrl);
  if (!response.ok) {
    throw new Error(`iCal fetch failed: ${response.status}`);
  }
  
  const icalData = await response.text();
  return parseICalData(icalData);
}

function parseICalData(icalData) {
  // Simple iCal parser - in production, use a proper library
  const events = [];
  const lines = icalData.split('\n');
  let currentEvent = null;
  
  for (let line of lines) {
    line = line.trim();
    
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT' && currentEvent) {
      if (currentEvent.start && currentEvent.summary) {
        events.push(currentEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':');
      
      if (key.startsWith('DTSTART')) {
        currentEvent.start = parseICalDate(value);
      } else if (key === 'SUMMARY') {
        currentEvent.summary = value;
      } else if (key === 'LOCATION') {
        currentEvent.location = value;
      }
    }
  }
  
  // Filter to next 7 days and upcoming only
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return events
    .filter(event => event.start > now && event.start < nextWeek)
    .sort((a, b) => a.start - b.start)
    .slice(0, 5);
}

function parseICalDate(dateStr) {
  // Simple date parser - handle basic format YYYYMMDDTHHMMSS
  if (dateStr.length >= 8) {
    const year = parseInt(dateStr.substr(0, 4));
    const month = parseInt(dateStr.substr(4, 2)) - 1;
    const day = parseInt(dateStr.substr(6, 2));
    const hour = parseInt(dateStr.substr(9, 2)) || 0;
    const minute = parseInt(dateStr.substr(11, 2)) || 0;
    
    return new Date(year, month, day, hour, minute);
  }
  return new Date(dateStr);
}

async function loadGoogleCalendarEvents() {
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const url = `https://www.googleapis.com/calendar/v3/calendars/${CONFIG.calendar.calendarId}/events?key=${CONFIG.calendar.googleApiKey}&timeMin=${timeMin}&timeMax=${timeMax}&maxResults=5&singleEvents=true&orderBy=startTime`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Calendar API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return data.items.map(event => ({
    summary: event.summary,
    start: new Date(event.start.dateTime || event.start.date),
    location: event.location,
    htmlLink: event.htmlLink
  }));
}

function renderCalendar(events) {
  const calendarSkeleton = document.getElementById('calendarSkeleton');
  const calendarContent = document.getElementById('calendarContent');
  const calendarSetup = document.getElementById('calendarSetup');
  
  if (!events || events.length === 0) {
    calendarContent.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: var(--space-16);">No upcoming events</p>';
  } else {
    calendarContent.innerHTML = events.map(event => `
      <div class="calendar-event">
        <h4 class="calendar-event__title">${event.summary}</h4>
        <p class="calendar-event__time">${event.start.toLocaleString()}</p>
        ${event.location ? `<p class="calendar-event__location">${event.location}</p>` : ''}
      </div>
    `).join('');
  }
  
  calendarSkeleton.style.display = 'none';
  calendarContent.style.display = 'block';
  calendarSetup.style.display = 'none';
  
  updateLastUpdated();
}

// ===========================================
// RSS FUNCTIONALITY
// ===========================================

async function loadRSSFeeds() {
  const rssSkeleton = document.getElementById('rssSkeleton');
  const rssContent = document.getElementById('rssContent');
  const rssError = document.getElementById('rssError');
  
  // Show loading state
  rssSkeleton.style.display = 'block';
  rssContent.style.display = 'none';
  rssError.style.display = 'none';
  
  try {
    // Check cache first
    const cachedRSS = cache.get('rss');
    if (cachedRSS && networkOnline) {
      renderRSSFeeds(cachedRSS);
      return;
    }
    
    if (!networkOnline) {
      throw new Error('No network connection');
    }
    
    const allItems = [];
    
    for (const feedUrl of CONFIG.rssFeeds) {
      try {
        const items = await fetchRSSFeed(feedUrl);
        allItems.push(...items);
      } catch (error) {
        console.warn(`Failed to load RSS feed: ${feedUrl}`, error);
      }
    }
    
    // Sort by date, dedupe by title, limit to 20 items
    const uniqueItems = [];
    const seenTitles = new Set();
    
    allItems
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .forEach(item => {
        if (!seenTitles.has(item.title) && uniqueItems.length < 20) {
          seenTitles.add(item.title);
          uniqueItems.push(item);
        }
      });
    
    // Cache the items
    cache.set('rss', uniqueItems, CONFIG.refreshIntervals.rss);
    
    renderRSSFeeds(uniqueItems);
    
  } catch (error) {
    console.error('RSS loading failed:', error);
    rssSkeleton.style.display = 'none';
    rssError.style.display = 'block';
    
    // Try to show cached data
    const cachedRSS = cache.get('rss');
    if (cachedRSS) {
      renderRSSFeeds(cachedRSS);
    }
  }
}

async function fetchRSSFeed(feedUrl) {
  try {
    // Try direct fetch first (will fail due to CORS for most feeds)
    const response = await fetch(feedUrl);
    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`);
    }
    
    const text = await response.text();
    return parseRSSFeed(text, feedUrl);
  } catch (error) {
    // CORS proxy fallback - using a public CORS proxy (not recommended for production)
    console.warn('Direct RSS fetch failed, trying CORS proxy:', error);
    
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    
    if (data.contents) {
      return parseRSSFeed(data.contents, feedUrl);
    }
    
    throw new Error('RSS feed could not be loaded');
  }
}

function parseRSSFeed(xmlText, feedUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');
  
  const items = [];
  const feedTitle = doc.querySelector('channel > title')?.textContent || new URL(feedUrl).hostname;
  
  // Handle RSS format
  const rssItems = doc.querySelectorAll('item');
  rssItems.forEach((item, index) => {
    if (index < 5) { // Limit to 5 items per feed
      items.push({
        title: item.querySelector('title')?.textContent || 'No title',
        link: item.querySelector('link')?.textContent || '',
        pubDate: item.querySelector('pubDate')?.textContent || new Date().toISOString(),
        source: feedTitle
      });
    }
  });
  
  // Handle Atom format
  if (items.length === 0) {
    const atomItems = doc.querySelectorAll('entry');
    atomItems.forEach((item, index) => {
      if (index < 5) {
        items.push({
          title: item.querySelector('title')?.textContent || 'No title',
          link: item.querySelector('link')?.getAttribute('href') || '',
          pubDate: item.querySelector('published, updated')?.textContent || new Date().toISOString(),
          source: feedTitle
        });
      }
    });
  }
  
  return items;
}

function renderRSSFeeds(items) {
  const rssSkeleton = document.getElementById('rssSkeleton');
  const rssContent = document.getElementById('rssContent');
  
  if (!items || items.length === 0) {
    rssContent.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: var(--space-16);">No RSS items available</p>';
  } else {
    rssContent.innerHTML = items.map(item => `
      <div class="rss-item">
        <p class="rss-item__source">${item.source}</p>
        <h4 class="rss-item__title">
          <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>
        </h4>
        <p class="rss-item__meta">${new Date(item.pubDate).toLocaleDateString()}</p>
      </div>
    `).join('');
  }
  
  rssSkeleton.style.display = 'none';
  rssContent.style.display = 'block';
  
  updateLastUpdated();
}

// ===========================================
// STOCK/CRYPTO TICKERS
// ===========================================

async function loadTickers() {
  const tickersSkeleton = document.getElementById('tickersSkeleton');
  const tickersContent = document.getElementById('tickersContent');
  const tickersError = document.getElementById('tickersError');
  
  // Show loading state
  tickersSkeleton.style.display = 'block';
  tickersContent.style.display = 'none';
  tickersError.style.display = 'none';
  
  try {
    // Check cache first
    const cachedTickers = cache.get('tickers');
    if (cachedTickers && networkOnline) {
      renderTickers(cachedTickers);
      return;
    }
    
    if (!networkOnline) {
      throw new Error('No network connection');
    }
    
    const tickers = [];
    
    // Load stocks using Yahoo Finance API
    for (const symbol of CONFIG.tickers.stocks) {
      try {
        const stockData = await fetchStockData(symbol);
        if (stockData) {
          tickers.push({
            symbol,
            price: stockData.price,
            change: stockData.change,
            changePercent: stockData.changePercent,
            type: 'stock'
          });
        }
      } catch (error) {
        console.warn(`Failed to load stock ${symbol}:`, error);
      }
    }
    
    // Load crypto using CoinGecko API
    if (CONFIG.tickers.crypto.length > 0) {
      try {
        const cryptoData = await fetchCryptoData(CONFIG.tickers.crypto);
        tickers.push(...cryptoData);
      } catch (error) {
        console.warn('Failed to load crypto data:', error);
      }
    }
    
    // Cache the tickers
    cache.set('tickers', tickers, CONFIG.refreshIntervals.tickers);
    
    renderTickers(tickers);
    
  } catch (error) {
    console.error('Tickers loading failed:', error);
    tickersSkeleton.style.display = 'none';
    tickersError.style.display = 'block';
    
    // Try to show cached data
    const cachedTickers = cache.get('tickers');
    if (cachedTickers) {
      renderTickers(cachedTickers);
    }
  }
}

async function fetchStockData(symbol) {
  // Using Yahoo Finance API (unofficial)
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Stock API error: ${response.status}`);
    }
    
    const data = await response.json();
    const result = data.chart.result[0];
    const meta = result.meta;
    
    return {
      price: meta.regularMarketPrice,
      change: meta.regularMarketPrice - meta.previousClose,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
    };
  } catch (error) {
    console.warn(`Failed to fetch stock data for ${symbol}:`, error);
    return null;
  }
}

async function fetchCryptoData(symbols) {
  const ids = symbols.map(s => s.toLowerCase()).join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Crypto API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const cryptoMap = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum', 
      'SOL': 'solana'
    };
    
    return symbols.map(symbol => {
      const id = cryptoMap[symbol];
      const coinData = data[id];
      
      if (coinData) {
        return {
          symbol,
          price: coinData.usd,
          change: 0, // CoinGecko doesn't provide absolute change
          changePercent: coinData.usd_24h_change || 0,
          type: 'crypto'
        };
      }
      return null;
    }).filter(Boolean);
  } catch (error) {
    console.warn('Failed to fetch crypto data:', error);
    return [];
  }
}

function renderTickers(tickers) {
  const tickersSkeleton = document.getElementById('tickersSkeleton');
  const tickersContent = document.getElementById('tickersContent');
  
  if (!tickers || tickers.length === 0) {
    tickersContent.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: var(--space-16);">No ticker data available</p>';
  } else {
    tickersContent.innerHTML = `
      <div class="tickers-grid">
        ${tickers.map(ticker => {
          const changeClass = ticker.changePercent >= 0 ? 'ticker-item__change--positive' : 'ticker-item__change--negative';
          const changeSymbol = ticker.changePercent >= 0 ? '+' : '';
          const price = ticker.type === 'crypto' ? `$${ticker.price.toLocaleString()}` : `$${ticker.price.toFixed(2)}`;
          
          return `
            <div class="ticker-item">
              <p class="ticker-item__symbol">${ticker.symbol}</p>
              <p class="ticker-item__price">${price}</p>
              <p class="ticker-item__change ${changeClass}">
                ${changeSymbol}${ticker.changePercent.toFixed(2)}%
              </p>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  
  tickersSkeleton.style.display = 'none';
  tickersContent.style.display = 'block';
  
  updateLastUpdated();
}

// ===========================================
// AUTO-REFRESH AND UTILITIES
// ===========================================

function loadAllData() {
  loadWeather();
  loadCalendar();
  loadRSSFeeds();
  loadTickers();
}

function setupRefreshTimers() {
  // Clear existing timers
  Object.values(refreshTimers).forEach(timer => clearInterval(timer));
  
  // Set up new timers
  refreshTimers.weather = setInterval(loadWeather, CONFIG.refreshIntervals.weather * 1000);
  refreshTimers.calendar = setInterval(loadCalendar, CONFIG.refreshIntervals.calendar * 1000);
  refreshTimers.rss = setInterval(loadRSSFeeds, CONFIG.refreshIntervals.rss * 1000);
  refreshTimers.tickers = setInterval(loadTickers, CONFIG.refreshIntervals.tickers * 1000);
}

function updateLastUpdated() {
  const lastUpdatedElement = document.getElementById('lastUpdated');
  if (lastUpdatedElement) {
    lastUpdatedElement.textContent = new Date().toLocaleTimeString();
  }
}

function setupNetworkMonitoring() {
  const statusIndicator = document.getElementById('networkStatus');
  const statusText = document.querySelector('.status-text');
  
  function updateNetworkStatus() {
    networkOnline = navigator.onLine;
    if (statusIndicator && statusText) {
      statusIndicator.textContent = networkOnline ? '🟢' : '🔴';
      statusText.textContent = networkOnline ? 'Online' : 'Offline';
    }
    
    // Reload data when coming back online
    if (networkOnline) {
      setTimeout(loadAllData, 1000);
    }
  }
  
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  
  updateNetworkStatus();
}

function setupKeyboardNavigation() {
  document.addEventListener('keydown', function(e) {
    // Escape key to blur focused elements
    if (e.key === 'Escape') {
      document.activeElement.blur();
    }
    
    // Space or Enter to activate focused links
    if ((e.key === ' ' || e.key === 'Enter') && e.target.classList.contains('link-tile')) {
      e.preventDefault();
      e.target.click();
    }
  });
}

// ===========================================
// SERVICE WORKER REGISTRATION (Optional)
// ===========================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    // Register service worker for offline caching
    const swContent = `
      const CACHE_NAME = 'dashboard-v1';
      const urlsToCache = ['/', '/style.css', '/app.js'];
      
      self.addEventListener('install', event => {
        event.waitUntil(
          caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
        );
      });
      
      self.addEventListener('fetch', event => {
        event.respondWith(
          caches.match(event.request)
            .then(response => response || fetch(event.request))
        );
      });
    `;
    
    const blob = new Blob([swContent], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(blob);
    
    navigator.serviceWorker.register(swUrl)
      .then(registration => console.log('SW registered:', registration))
      .catch(error => console.log('SW registration failed:', error));
  });
}

// ===========================================
// EXPORT CONFIGURATION (Bonus Feature)
// ===========================================

function exportConfig() {
  const configData = {
    ...CONFIG,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
  
  const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dashboard-config.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Expose functions globally for easy access in console
window.dashboardAPI = {
  loadWeather,
  loadCalendar,
  loadRSSFeeds,
  loadTickers,
  exportConfig,
  clearCache: cache.clear,
  getConfig: () => CONFIG
};

console.log('Dashboard API available at window.dashboardAPI');