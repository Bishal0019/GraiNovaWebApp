'use client';

import { useState, useRef } from 'react';

// List of supported languages with their codes
const languages = [
  { value: 'en-IN', label: 'English' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'bn-IN', label: 'Bengali' },
  { value: 'te-IN', label: 'Telugu' },
  { value: 'mr-IN', label: 'Marathi' },
  { value: 'ta-IN', label: 'Tamil' },
  { value: 'gu-IN', label: 'Gujarati' },
  { value: 'kn-IN', label: 'Kannada' },
  { value: 'ml-IN', label: 'Malayalam' },
  { value: 'pa-IN', label: 'Punjabi' },
  { value: 'or-IN', label: 'Odia' },
  { value: 'ur-IN', label: 'Urdu' },
];

export default function PestDetectionPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]); // Default to English (IN)
  const audioPlayerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);

    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      setReport(null);
      setError(null);
      handleStopSpeaking(); // Stop any audio on new image
    } else {
      setPreviewUrl(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select an image to analyze.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setReport(null);
    handleStopSpeaking();

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('language', selectedLanguage.value);

    try {
      const response = await fetch('/api/analyze-plant', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to get a report from the server.');
      }

      const data = await response.json();
      setReport(data.report);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async () => {
    if (!report) {
        setError("No report to speak.");
        return;
    }
    
    // Stop any currently playing audio
    handleStopSpeaking();

    // Clean the text before sending it to the TTS API
    const cleanText = report
      .replace(/(\d)\s*[-–—]\s*(\d)/g, '$1 to $2') // Convert numeric ranges
      .replace(/[#*`_>]/g, '') // Remove markdown characters
      .replace(/[-–—]/g, ' ') // Replace remaining hyphens
      .replace(/\n/g, ' ') // Replace newlines
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();

    setIsPlaying(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: cleanText,
            languageCode: selectedLanguage.value,
            gender: "FEMALE",
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech.');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioPlayerRef.current) {
          audioPlayerRef.current.src = audioUrl;
          audioPlayerRef.current.play();
      } else {
          const newAudio = new Audio(audioUrl);
          newAudio.play();
          audioPlayerRef.current = newAudio;
      }
      
      audioPlayerRef.current.onended = () => {
          setIsPlaying(false);
      };
    } catch (err) {
      console.error('TTS error:', err);
      setError('Failed to play the audio report.');
      setIsPlaying(false);
    }
  };

  const handleStopSpeaking = () => {
    if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
        setIsPlaying(false);
    }
  };

  return (
    <div className="min-w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg border border-green-200">
        <h2 className="text-3xl font-bold mb-4 text-center text-green-800">
          Pest & Disease Detection 🌱
        </h2>
        
        <p className="text-center text-gray-600 mb-6">
          Upload a picture of an affected plant, and our AI will analyze it for you.
        </p>

        {/* Image Upload Area */}
        <div className="border-2 border-dashed border-green-300 rounded-lg p-6 mb-6 text-center hover:border-green-500 transition-colors cursor-pointer bg-green-50">
          <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Selected plant preview" 
                className="max-h-80 w-auto mx-auto rounded-lg shadow-md" 
              />
            ) : (
              <>
                <svg
                  className="mx-auto h-12 w-12 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-4-4v-1a4 4 0 014-4h10a4 4 0 014 4v1a4 4 0 01-4 4H7z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p className="mt-2 text-green-600">
                  <span className="font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB</p>
              </>
            )}
            <input 
              id="file-upload" 
              type="file" 
              className="hidden" 
              accept="image/png, image/jpeg, image/jpg" 
              onChange={handleFileChange} 
            />
          </label>
        </div>

        {/* Language Selection */}
        <div className="mb-6 w-full">
          <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Report Language
          </label>
          <select
            id="language-select"
            value={selectedLanguage.value}
            onChange={(e) => setSelectedLanguage(languages.find(lang => lang.value === e.target.value))}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-green-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md bg-white text-gray-900"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAnalyze}
          className={`w-full py-3 rounded-lg text-white font-semibold transition-all duration-300 ${
            selectedFile && !isLoading ? 'bg-green-600 hover:bg-green-700 shadow-md' : 'bg-green-400 cursor-not-allowed opacity-70'
          }`}
          disabled={!selectedFile || isLoading}
        >
          {isLoading ? 'Analyzing...' : 'Analyze Image'}
        </button>

        {/* Report & Error Display */}
        {isLoading && (
          <div className="mt-6 text-center text-green-600 animate-pulse">
            AI is analyzing your plant...
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 rounded-lg bg-red-100 border border-red-300 text-red-700 text-center">
            {error}
          </div>
        )}

        {report && (
          <div className="mt-6 p-6 rounded-xl bg-green-50 border border-green-200">
            <h3 className="text-2xl font-semibold mb-3 text-green-800">Analysis Report</h3>
            <div className="prose text-gray-700 max-w-none leading-relaxed">
              <p>{report}</p>
            </div>
            
            {/* TTS Buttons */}
            <div className="mt-4 flex gap-4">
              <button
                onClick={handleSpeak}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-semibold transition-colors ${isPlaying ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                disabled={isPlaying}
              >
                Listen 🔊
              </button>
              <button
                onClick={handleStopSpeaking}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-semibold transition-colors ${!isPlaying ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                disabled={!isPlaying}
              >
                Stop ⏹️
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}