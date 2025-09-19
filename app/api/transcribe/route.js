// app/api/transcribe/route.js

import { SpeechClient } from '@google-cloud/speech';
import { NextResponse } from 'next/server';

const client = new SpeechClient();

export async function POST(request) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio');
        const languageCode = formData.get('language');

        if (!audioFile) {
            return new NextResponse(JSON.stringify({ error: 'No audio file received' }), { status: 400 });
        }

        const buffer = Buffer.from(await audioFile.arrayBuffer());

        const requestConfig = {
            audio: {
                content: buffer.toString('base64'),
            },
            config: {
                encoding: 'WEBM_OPUS',
                sampleRateHertz: 48000,
                languageCode: languageCode,
            },
        };

        const [response] = await client.recognize(requestConfig);
        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

        return new NextResponse(JSON.stringify({ transcription }), { status: 200 });

    } catch (error) {
        console.error('Transcription API error:', error);
        return new NextResponse(JSON.stringify({ error: 'Transcription failed' }), { status: 500 });
    }
}