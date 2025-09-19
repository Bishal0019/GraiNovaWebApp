// app/api/advisory/route.js

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);

// Helper function to fetch weather data from Open-Meteo
async function getWeatherData(district) {
    try {
        console.log(`Fetching geocoding data for: ${district}`);
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${district}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            console.error("Geocoding failed: Location not found.");
            return null;
        }
        
        console.log("Geocoding successful. Fetching weather data.");
        const { latitude, longitude } = geoData.results[0];
        
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&current=temperature_2m,wind_speed_10m,relative_humidity_2m&timezone=auto`;
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
    // Check for API key at the beginning of the function
    if (!apiKey) {
        console.error("GEMINI_API_KEY is not set. Please check your .env.local file.");
        return NextResponse.json({ 
            advice: 'API Key not configured. Please ensure GEMINI_API_KEY is set in your .env.local file.' 
        }, { status: 500 });
    }

    try {
        const { state, district, timing, cropName, specificRequest, language } = await req.json();

        if (!state || !district || !timing || !cropName || !language) {
            return NextResponse.json({ advice: 'Please provide all required information.' }, { status: 400 });
        }

        let weatherReport = 'No weather report available for this location.';
        const weatherData = await getWeatherData(district);

        if (weatherData) {
            const today = weatherData.current;
            const dailyForecast = weatherData.daily;

            weatherReport = `
                Today's Weather in ${district}:
                - Current Temperature: ${today.temperature_2m}°C
                - Weather Conditions: ${getWeatherCondition(today.weather_code)}
                - Humidity: ${today.relative_humidity_2m}%
                - Wind Speed: ${today.wind_speed_10m} km/h
            `;
        }

        const languageInstruction = `Please provide the advice in ${language} language.`;
        const promptTemplate = `
            You are a highly knowledgeable agricultural expert, providing crop advice to farmers in India.
            Your advice should be extremely practical, easy to understand, and safe. Do not recommend any dangerous or harmful practices.

            ${languageInstruction}

            Based on the following information, provide a detailed crop advisory. Your response must be extremely concise, focusing on the most critical information.

            1.  **Summary:** In a single, brief paragraph, summarize how the weather will affect the crop.
            2.  **Actions:** Provide a list of 3 actionable, bullet-pointed steps.

            ---
            **Farmer's Information:**
            - State: ${state}
            - District: ${district}
            - Intended Timing: ${timing}
            - Crop Name: ${cropName}
            
            
            **Weather Report (if available):**
            ${weatherReport}

            **Specific Request (if any):**
            ${specificRequest}
            ---
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
        console.log("Attempting to generate content with Gemini...");
        
        const result = await model.generateContent(promptTemplate);
        const response = await result.response;
        const adviceText = response.text();
        console.log("Successfully generated content from Gemini.");

        return NextResponse.json({ advice: adviceText });

    } catch (error) {
        console.error('An unexpected error occurred in the API route:', error.message);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            { advice: `An error occurred: ${error.message}. Please check your server console for more details.` },
            { status: 500 }
        );
    }
}
