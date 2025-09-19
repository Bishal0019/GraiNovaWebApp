// C:\SIH\my-app\app\api\analyze-soil\route.js

import fetch from 'node-fetch';

export async function POST(req, res) {
  const { file, language } = await req.json(); // Gets the file data and the language code from the frontend

  if (!file || !file.data || !file.type) {
    return new Response(JSON.stringify({ message: 'No file data provided or file type is missing.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return new Response(JSON.stringify({ message: 'API Key not configured on the server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let basePrompt;
  if (file.type.startsWith('image/')) {
    basePrompt = `
    Analyze this soil image in under 600 words (max 4000 bytes).
    Make the response structured and suitable for Text-to-Speech.
    Sections:
    1) Soil appearance (color, texture, visible issues)
    2) Key quality notes
    3) Recommended crops
    4) Practical improvements
    Be concise, avoid repetition.
  `;
  } else if (file.type === 'application/pdf') {
    basePrompt = `
    Analyze this soil PDF report in under 600 words (max 4000 bytes).
    Make the response structured and suitable for Text-to-Speech.
    Sections:
    1) Key findings (pH, NPK, organic matter)
    2) Suitability for crops
    3) Simple soil amendments
    Be clear and avoid unnecessary detail.
  `;
  } else if (file.type.startsWith('text/')) {
    basePrompt = `
    Analyze this soil text report in under 600 words (max 4000 bytes).
    Make the response structured and suitable for Text-to-Speech.
    Sections:
    1) Key findings (pH, NPK, organic matter)
    2) Suitability for crops
    3) Simple soil amendments
    Keep concise, avoid long explanations.
  `;
  }
  else {
    return new Response(JSON.stringify({ message: 'Unsupported file type. Please upload an image, PDF, or text file.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Appends the language request to the prompt, which is the key part of the logic.
  const finalPrompt = `${basePrompt} The report must be provided in the language corresponding to the ISO code: ${language}.`;

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;

    const payload = {
      contents: [
        {
          parts: [
            { text: finalPrompt }, // Use the modified prompt
            { inlineData: { mimeType: file.type, data: file.data } }
          ]
        }
      ]
    };

    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorData}`);
    }

    const result = await geminiResponse.json();
    const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (generatedText) {
      return new Response(JSON.stringify({ analysis: generatedText }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ message: 'No analysis was returned from the API.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (err) {
    console.error('Error in API route:', err);
    return new Response(JSON.stringify({ message: 'An internal server error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
