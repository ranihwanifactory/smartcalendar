export const DEFAULT_LOCATION = { lat: 37.5665, lon: 126.9780 }; // Seoul

export const getCurrentLocation = (): Promise<{ lat: number; lon: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(error.message || 'Unable to retrieve your location'));
        },
        { timeout: 5000 }
      );
    }
  });
};

// Map WMO Weather interpretation codes (WW) to emojis/icons
export const getWeatherIcon = (code: number): string => {
  // Codes based on Open-Meteo documentation
  if (code === 0) return '☀️'; // Clear sky
  if (code >= 1 && code <= 3) return '⛅'; // Mainly clear, partly cloudy, and overcast
  if (code >= 45 && code <= 48) return '🌫️'; // Fog
  if (code >= 51 && code <= 55) return '🌦️'; // Drizzle
  if (code >= 61 && code <= 67) return '🌧️'; // Rain
  if (code >= 71 && code <= 77) return '❄️'; // Snow
  if (code >= 80 && code <= 82) return '🌧️'; // Rain showers
  if (code >= 85 && code <= 86) return '❄️'; // Snow showers
  if (code >= 95 && code <= 99) return '⛈️'; // Thunderstorm
  return '🌡️';
};

export const fetchWeatherForecast = async (lat: number, lon: number) => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`,
      { mode: 'cors' }
    );
    
    if (!response.ok) {
      throw new Error(`Weather API returned status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform data into a map: "YYYY-MM-DD" -> WeatherInfo
    const weatherMap: Record<string, any> = {};
    
    if (data.daily && data.daily.time) {
      data.daily.time.forEach((dateStr: string, index: number) => {
        weatherMap[dateStr] = {
          maxTemp: data.daily.temperature_2m_max[index],
          minTemp: data.daily.temperature_2m_min[index],
          weatherCode: data.daily.weathercode[index],
          icon: getWeatherIcon(data.daily.weathercode[index]),
        };
      });
    }
    
    return weatherMap;
  } catch (error) {
    console.warn("Failed to fetch weather forecast:", error);
    return {};
  }
};