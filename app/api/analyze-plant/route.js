// app/api/analyze-plant/route.js
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Make sure to set your GEMINI_API_KEY in a .env.local file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to convert a readable stream to a buffer
async function streamToBuffer(readableStream) {
  const chunks = [];
  for await (const chunk of readableStream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image');
    const languageCode = formData.get('language');

    if (!imageFile || !languageCode) {
      return NextResponse.json({ error: 'Missing image or language data' }, { status: 400 });
    }

    // Convert the image file to a format Gemini API can read
    const imageBuffer = await streamToBuffer(imageFile.stream());
    const imageBase64 = imageBuffer.toString('base64');
    const mimeType = imageFile.type;

    // --- MODIFIED PROMPT FOR CONCISE RESPONSE ---
    const prompt = `
      Analyze the plant in this image. Your goal is to provide a brief,
      to-the-point report for a farmer, suitable for a text-to-speech system.

      Identify any disease or pest infestation. The response must be short, 
      no more than 500 words.

      Your report should include:
      1. **Identification**: The name of the disease or pest.
      2. **Symptoms**: A concise description of the symptoms visible in the image.
      3. **Actionable Advice**: A very brief summary of recommended treatment or prevention.

      Ensure the entire report is in the language with the following code: ${languageCode}.
      The tone should be direct and helpful.
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    
    // Create the multimodal content for the API request
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const textReport = response.text();

    return NextResponse.json({ report: textReport });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: 'Failed to analyze the image. Please try again later.' }, { status: 500 });
  }
}