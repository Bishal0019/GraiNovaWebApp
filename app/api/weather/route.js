// app/api/weather/route.js
import { NextResponse } from 'next/server';

// Helper function to fetch weather data from Open-Meteo
async function getWeatherData(district) {
    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${district}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            console.error("Geocoding failed: Location not found.");
            return null;
        }
        
        const { latitude, longitude } = geoData.results[0];
        
        // Updated URL to fetch detailed daily forecast and precipitation
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&current_weather=true&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        
        return weatherData;

    } catch (error) {
        console.error('Error fetching weather data from Open-Meteo:', error);
        return null;
    }
}

// Helper function to convert Open-Meteo's weather code to a human-readable string
function getWeatherCondition(code) {
    const weatherMap = {
        0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Depositing rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
        55: 'Dense drizzle', 61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        71: 'Slight snow fall', 73: 'Moderate snow fall', 75: 'Heavy snow fall',
        80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Heavy rain showers',
        95: 'Thunderstorm'
    };
    return weatherMap[code] || 'N/A';
}

export async function POST(req) {
    try {
        const { district } = await req.json();

        if (!district) {
            return NextResponse.json({ error: 'District name is required' }, { status: 400 });
        }
        
        const weatherData = await getWeatherData(district);
        
        if (!weatherData || !weatherData.current_weather || !weatherData.daily) {
            return NextResponse.json({ error: 'Failed to fetch detailed weather data.' }, { status: 500 });
        }

        const { current_weather } = weatherData;
        const { daily } = weatherData;
        
        // --- Format the detailed alert message ---
        let alertMessage = `Detailed Weather Report for ${district}:\n\n`;
        
        // Today's Report
        alertMessage += `--- Today's Weather ---\n`;
        alertMessage += `Temperature: ${current_weather.temperature}°C\n`;
        alertMessage += `Wind Speed: ${current_weather.windspeed} km/h\n`;
        alertMessage += `Condition: ${getWeatherCondition(current_weather.weathercode)}\n`;
        alertMessage += `Precipitation: ${daily.precipitation_sum[0] ?? 0} mm\n\n`;

        // Upcoming Days Forecast
        alertMessage += `--- 3-Day Forecast ---\n`;
        for (let i = 1; i <= 3 && i < daily.time.length; i++) {
            const day = new Date(daily.time[i]);
            alertMessage += `${day.toLocaleDateString('en-IN', { weekday: 'long' })}:\n`;
            alertMessage += `Max Temp: ${daily.temperature_2m_max[i]}°C, Min Temp: ${daily.temperature_2m_min[i]}°C\n`;
            alertMessage += `Condition: ${getWeatherCondition(daily.weather_code[i])}\n`;
            alertMessage += `Precipitation: ${daily.precipitation_sum[i] ?? 0} mm\n\n`;
        }

        return NextResponse.json({ weatherAlert: alertMessage });

    } catch (error) {
        console.error('Backend API error:', error);
        return NextResponse.json({ error: 'Internal server error. Please try again later.' }, { status: 500 });
    }
}