import { NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

export async function POST(req) {
  try {
    const { text, languageCode = "en-IN", gender = "FEMALE" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text required" }, { status: 400 });
    }

    const auth = new GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = await auth.getClient();
    const url = "https://texttospeech.googleapis.com/v1/text:synthesize";

    const response = await client.request({
      url,
      method: "POST",
      data: {
        input: { text },
        voice: { languageCode, ssmlGender: gender },
        audioConfig: { audioEncoding: "MP3" },
      },
    });

    const audioContent = response.data.audioContent;
    if (!audioContent) throw new Error("No audio content returned from TTS API");

    const audioBuffer = Buffer.from(audioContent, "base64");

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length,
      },
    });
  } catch (error) {
    console.error("TTS API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
