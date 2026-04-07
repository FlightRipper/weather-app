import { useEffect, useState } from "react";
import "./App.css";

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

type WeatherData = {
  city: string;
  country: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  population: number | null;
};

function getWeatherTheme(
  condition: string,
): "clear" | "clouds" | "rain" | "snow" | "default" {
  const value = condition.toLowerCase();

  if (
    value.includes("rain") ||
    value.includes("drizzle") ||
    value.includes("thunderstorm")
  ) {
    return "rain";
  }

  if (value.includes("clear")) {
    return "clear";
  }

  if (value.includes("cloud")) {
    return "clouds";
  }

  if (value.includes("snow")) {
    return "snow";
  }

  return "default";
}

function getWeatherIcon(condition: string): string {
  const value = condition.toLowerCase();

  if (
    value.includes("rain") ||
    value.includes("drizzle") ||
    value.includes("thunderstorm")
  ) {
    return "🌧";
  }

  if (value.includes("clear")) {
    return "☀️";
  }

  if (value.includes("cloud")) {
    return "☁️";
  }

  if (value.includes("snow")) {
    return "❄️";
  }

  return "🌤";
}

function formatPopulation(value: number | null): string {
  if (value === null) {
    return "Not available";
  }

  return value.toLocaleString();
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const theme = weather ? getWeatherTheme(weather.condition) : "default";

  useEffect(() => {
    if (weather) {
      document.title = `Weather in ${weather.city}`;
      return;
    }
    document.title = "Weather App";
  }, [weather]);

  const fetchWeather = async () => {
    const trimmedCity = city.trim();
    if (!trimmedCity) {
      setError("Please type a city name first.");
      setWeather(null);
      return;
    }
    setLoading(true);
    setError("");
    setWeather(null);
    try {
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(trimmedCity)}&appid=${API_KEY}&units=metric`,
      );

      if (!weatherResponse.ok) {
        if (weatherResponse.status === 404) {
          throw new Error("City not found. Please check the spelling.");
        }

        throw new Error("Weather API failed. Please try again.");
      }

      const weatherJson = await weatherResponse.json();

      let population: number | null = null;
      const countryCode = weatherJson?.sys?.country;

      if (countryCode) {
        const countryResponse = await fetch(
          `https://restcountries.com/v3.1/alpha/${countryCode}?fields=population`,
        );

        if (countryResponse.ok) {
          const countryJson = await countryResponse.json();

          if (Array.isArray(countryJson) && countryJson.length > 0) {
            population = countryJson[0]?.population ?? null;
          } else if (!Array.isArray(countryJson)) {
            population = countryJson?.population ?? null;
          }
        }
      }

      setWeather({
        city: weatherJson.name,
        country: weatherJson.sys?.country ?? "",
        temperature: Math.round(weatherJson.main?.temp ?? 0),
        condition: weatherJson.weather?.[0]?.main ?? "Unknown",
        humidity: weatherJson.main?.humidity ?? 0,
        windSpeed: weatherJson.wind?.speed ?? 0,
        population,
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      await fetchWeather();
    }
  };

  const displayCity = weather
    ? `${weather.city}, ${weather.country}`
    : "Live Weather";

  return (
    <main className={`app theme-${theme}`}>
      <div className="ambient-shape ambient-a" aria-hidden="true" />
      <div className="ambient-shape ambient-b" aria-hidden="true" />

      <div className="weather-shell">
        <header className="hero-header">
          <p className="hero-kicker">Forecast Studio</p>
          <h1>{displayCity}</h1>
          <p className="hero-subtitle">
            Search any city and get live weather updates instantly.
          </p>
        </header>

        <div className="search-row">
          <label htmlFor="city-input" className="search-label">
            City
          </label>
          <input
            id="city-input"
            type="text"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a city"
          />
          <button onClick={fetchWeather}>Search</button>
        </div>

        {loading && <p className="info">Loading weather...</p>}
        {error && <p className="error">{error}</p>}

        {weather && (
          <section className="cards-grid">
            <article className="glass-card primary-card">
              <div className="condition-top">
                <span className="weather-icon" aria-hidden="true">
                  {getWeatherIcon(weather.condition)}
                </span>
                <div>
                  <h2>{weather.condition}</h2>
                  <p className="temp">{weather.temperature}°C</p>
                </div>
              </div>

              <div className="stat-grid">
                <p>
                  <span className="muted">Humidity</span>
                  <strong>{weather.humidity}%</strong>
                </p>
                <p>
                  <span className="muted">Wind</span>
                  <strong>{weather.windSpeed} m/s</strong>
                </p>
              </div>
            </article>

            <article className="glass-card secondary-card">
              <h3>Details</h3>
              <p>{getTodayLabel()}</p>
              <p>City: {weather.city}</p>
              <p>Country: {weather.country}</p>
              <p>Population: {formatPopulation(weather.population)}</p>
            </article>
          </section>
        )}

        {!loading && !error && !weather && (
          <section className="cards-grid placeholder-cards">
            <article className="glass-card primary-card">
              <h2>Ready to Explore</h2>
              <p>Type a city above and press Enter or Search.</p>
            </article>
            <article className="glass-card secondary-card">
              <h3>Suggested Cities</h3>
              <p>London, Cairo, Tokyo, Paris</p>
            </article>
          </section>
        )}
      </div>
    </main>
  );
}

export default App;
