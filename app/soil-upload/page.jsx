"use client"

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Select component with ssr: false
const Select = dynamic(() => import("react-select"), { ssr: false });

// Define the list of languages and their codes for react-select
const languages = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi (हिन्दी)' },
  { value: 'bn', label: 'Bengali (বাংলা)' },
  { value: 'gu', label: 'Gujarati (ગુજરાતી)' },
  { value: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
  { value: 'ml', label: 'Malayalam (മലയാളം)' },
  { value: 'mr', label: 'Marathi (मराठी)' },
  { value: 'or', label: 'Odia (ଓଡ଼ିଆ)' },
  { value: 'pa', label: 'Punjabi (ਪੰਜਾਬੀ)' },
  { value: 'ta', label: 'Tamil (தமிழ்)' },
  { value: 'te', label: 'Telugu (తెలుగు)' },
];

export default function SoilUpload() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  
  // Ref for managing audio playback
  const audioPlayerRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        setPreviewUrl('');
      }
      setError('');
    }
  };

  const handleDeleteFile = () => {
    setFile(null);
    setPreviewUrl('');
    setAnalysis('');
    setError('');
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setIsLoading(true);
    setAnalysis('');
    setError('');

    try {
      const base64 = await toBase64(file);
      
      const response = await fetch('/api/analyze-soil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          file: {
            data: base64,
            type: file.type,
          },
          language: selectedLanguage.value, 
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.analysis) {
        setAnalysis(result.analysis);
      } else {
        setError('No analysis was returned. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during analysis. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async () => {
    if (!analysis) {
        alert("No analysis to speak.");
        return;
    }
    
    // Check if the selected language has a corresponding voice
    if (!selectedLanguage || !selectedLanguage.value) {
        alert("Please select a language first.");
        return;
    }
    
    // Clean up the text for better speech synthesis
    const cleanText = analysis
        .replace(/(\d)\s*[-–—]\s*(\d)/g, '$1 to $2')
        .replace(/[#*`_>]/g, '')
        .replace(/[-–—]/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    try {
        const response = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: cleanText,
                languageCode: selectedLanguage.value,
                gender: "FEMALE",
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("TTS error:", error);
            alert("TTS failed: " + error.error);
            return;
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        if (audioPlayerRef.current) {
            audioPlayerRef.current.src = audioUrl;
            await audioPlayerRef.current.play();
        } else {
            const audio = new Audio(audioUrl);
            audio.play();
            audioPlayerRef.current = audio;
        }
    } catch (error) {
        console.error("Error during text-to-speech:", error);
        alert("Could not play audio.");
    }
};

const handleStopSpeaking = () => {
    if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
    }
};

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });

  return (
    <div className="min-w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden p-6 sm:p-8 lg:p-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-900 mb-2">
          Soil Health Analyzer
        </h1>
        <p className="text-center text-gray-500 mb-8 sm:mb-10 text-sm sm:text-base">
          Upload an image, PDF, or document for a detailed AI-powered analysis.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
          {/* Left Column: File Upload */}
          <label
            htmlFor="file-upload"
            className="flex-1 w-full flex flex-col items-center justify-center border-2 border-dashed border-green-300 rounded-2xl px-6 py-12 cursor-pointer hover:bg-green-100 transition-colors duration-200"
          >
            <img src="/file-upload.svg" alt="upload-file" />
            <span className="text-center text-gray-600 font-medium">
              {file ? file.name : 'Click to upload or drag & drop'}
            </span>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept="image/*,application/pdf,text/*"
              onChange={handleFileChange}
            />
          </label>
          
          {/* Right Column: Language & Analyze Button */}
          <div className="flex-1 w-full flex flex-col items-stretch gap-6">
            {/* Language Selection Dropdown */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Select Language
              </label>
              <Select
                options={languages}
                placeholder="Select Language..."
                onChange={setSelectedLanguage}
                value={selectedLanguage}
                isClearable={false}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>

            <button
              onClick={handleUploadAndAnalyze}
              disabled={isLoading || !file}
              className={`w-full px-8 py-3 rounded-2xl font-bold transition-all duration-300
                ${
                  isLoading || !file
                    ? 'bg-green-200 text-green-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
                }`}
            >
              {isLoading ? 'Analyzing...' : 'Analyze Soil'}
            </button>
            
            {file && (
              <button
                onClick={handleDeleteFile}
                disabled={isLoading}
                className="w-full px-8 py-3 rounded-2xl font-bold transition-all duration-300 bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-md hover:shadow-lg"
              >
                Delete File
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 rounded-lg p-4 text-center mb-6">
            {error}
          </div>
        )}

        {previewUrl && (
          <div className="w-full flex justify-center mb-8">
            <img
              src={previewUrl}
              alt="File Preview"
              className="max-w-full h-auto rounded-xl shadow-md border border-gray-200"
              style={{ maxHeight: '300px' }}
            />
          </div>
        )}

        {analysis && (
          <div className="bg-white border border-green-200 rounded-2xl p-6 mt-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
              AI Analysis Report
              <div className="flex gap-2">
                <button
                  onClick={handleSpeak}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                >
                  Listen 🔊
                </button>
                <button
                  onClick={handleStopSpeaking}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                >
                  Stop ⏹️
                </button>
              </div>
            </h2>
            <div
              className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }}
            />
          </div>
        )}
      </div>
    </div>
  );
}