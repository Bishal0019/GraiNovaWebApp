"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Papa from "papaparse";
import { Button } from "../components/ui/button";

// Dynamically import the Select component with ssr: false
const Select = dynamic(() => import("react-select"), { ssr: false });

export default function CropAdvisoryPage() {
    const [districtData, setDistrictData] = useState([]);
    const [stateOptions, setStateOptions] = useState([]);
    const [selectedState, setSelectedState] = useState(null);
    const [districtOptions, setDistrictOptions] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedTiming, setSelectedTiming] = useState(null);
    const [cropName, setCropName] = useState("");
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [specificRequest, setSpecificRequest] = useState("");
    const [advice, setAdvice] = useState("");
    const [loading, setLoading] = useState(false);

    // --- Audio Recording State and Refs ---
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const [isTranscribing, setIsTranscribing] = useState(false);

    // --- Audio Playback Ref ---
    const audioPlayerRef = useRef(null);

    useEffect(() => {
        fetch("/District_Masters.csv")
            .then((response) => response.text())
            .then((csvText) => {
                Papa.parse(csvText, {
                    header: true,
                    complete: (results) => {
                        const parsedData = results.data.filter(
                            (row) => row && typeof row === "object" && row["State Name"]
                        );
                        setDistrictData(parsedData);
                        const uniqueStates = [
                            ...new Set(parsedData.map((row) => row["State Name"])),
                        ].sort();
                        setStateOptions(
                            uniqueStates.map((state) => ({
                                label: state,
                                value: state,
                            }))
                        );
                    },
                });
            })
            .catch((error) => {
                console.error("Error fetching or parsing CSV:", error);
            });
    }, []);

    useEffect(() => {
        if (selectedState) {
            const districts = districtData
                .filter((row) => row["State Name"] === selectedState.value)
                .map((row) => ({
                    label: row["District Name"],
                    value: row["District Name"],
                }));
            setDistrictOptions(districts);
        } else {
            setDistrictOptions([]);
            setSelectedDistrict(null);
        }
    }, [selectedState, districtData]);

    // --- Audio Recording Logic ---
    const handleVoiceToggle = async () => {
        if (!selectedLanguage) {
            alert("Please select a language first.");
            return;
        }

        if (isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach((track) =>
                track.stop()
            );
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream, {
                    mimeType: "audio/webm;codecs=opus",
                });
                audioChunksRef.current = [];

                mediaRecorderRef.current.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };

                mediaRecorderRef.current.onstop = async () => {
                    setIsTranscribing(true);
                    const audioBlob = new Blob(audioChunksRef.current, {
                        type: "audio/webm;codecs=opus",
                    });
                    const formData = new FormData();
                    formData.append("audio", audioBlob, "audio.webm");
                    formData.append("language", selectedLanguage.value);

                    try {
                        const response = await fetch("/api/transcribe", {
                            method: "POST",
                            body: formData,
                        });
                        const data = await response.json();
                        if (data.transcription) {
                            setSpecificRequest(data.transcription);
                        }
                    } catch (error) {
                        console.error("Failed to transcribe audio:", error);
                    } finally {
                        setIsTranscribing(false);
                    }
                };

                mediaRecorderRef.current.start();
                setIsRecording(true);
            } catch (error) {
                console.error("Microphone access denied:", error);
                alert(
                    "Microphone access was denied. Please check your browser settings."
                );
            }
        }
    };

    // --- Text-to-Speech ---
    const handleSpeak = async () => {
        if (!advice) {
            alert("No advice to speak.");
            return;
        }

        if (!selectedLanguage) {
            alert("Please select a language first.");
            return;
        }

        try {
            const cleanText = advice
                // 1) Convert numeric ranges "15-20" or "15 – 20" into "15 to 20"
                .replace(/(\d)\s*[-–—]\s*(\d)/g, '$1 to $2')
                // 2) Remove common markdown characters (but not hyphens handled above)
                .replace(/[#*`_>]/g, '')
                // 3) Replace any remaining hyphen/dash with a space (avoid squashing words)
                .replace(/[-–—]/g, ' ')
                // 4) Replace newlines with spaces and collapse multiple spaces
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            const response = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: cleanText,
                    languageCode: selectedLanguage.value, // pass correct languageCode
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

    const handleGetAdvice = async () => {
        if (
            !selectedState ||
            !selectedDistrict ||
            !selectedTiming ||
            !cropName ||
            !selectedLanguage
        ) {
            alert("Please fill all required fields before proceeding.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/advisory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    state: selectedState.value,
                    district: selectedDistrict.value,
                    timing: selectedTiming.value,
                    cropName,
                    specificRequest,
                    language: selectedLanguage.value,
                }),
            });

            const data = await res.json();
            setAdvice(data.advice || "No advice received.");
        } catch (error) {
            console.error("Failed to get advice:", error);
            setAdvice("Failed to get advice. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const LANGUAGES = [
        { value: "en-IN", label: "English" },
        { value: "hi-IN", label: "Hindi" },
        { value: "bn-IN", label: "Bengali" },
        { value: "te-IN", label: "Telugu" },
        { value: "mr-IN", label: "Marathi" },
        { value: "ta-IN", label: "Tamil" },
        { value: "gu-IN", label: "Gujarati" },
        { value: "kn-IN", label: "Kannada" },
        { value: "ml-IN", label: "Malayalam" },
        { value: "pa-IN", label: "Punjabi" },
        { value: "or-IN", label: "Odia" },
        { value: "ur-IN", label: "Urdu" },
    ];

    return (
        <div className="min-h-screen bg-green-50 p-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <h1 className="text-3xl md:text-4xl font-extrabold text-green-800 text-center mb-8">
                    Smart Crop Advisory
                </h1>

                <div className="space-y-6">
                    {/* State & District */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Select State
                            </label>
                            <Select
                                options={stateOptions}
                                placeholder="Select State..."
                                onChange={(state) => {
                                    setSelectedState(state);
                                    setSelectedDistrict(null);
                                }}
                                value={selectedState}
                                isClearable
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Select District
                            </label>
                            <Select
                                options={districtOptions}
                                placeholder="Select District..."
                                onChange={(district) => setSelectedDistrict(district)}
                                value={selectedDistrict}
                                isDisabled={!selectedState}
                                isClearable
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
                        </div>
                    </div>

                    {/* Crop & Timing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Crop Name
                            </label>
                            <input
                                type="text"
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                                placeholder="e.g., Wheat, Rice"
                                value={cropName}
                                onChange={(e) => setCropName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Intended Timing
                            </label>
                            <Select
                                options={[
                                    { value: "kharif", label: "Kharif (Monsoon)" },
                                    { value: "rabi", label: "Rabi (Winter)" },
                                    { value: "zaid", label: "Zaid (Summer)" },
                                    { value: "all-season", label: "All Season" },
                                ]}
                                placeholder="Select Timing..."
                                onChange={(timing) => setSelectedTiming(timing)}
                                value={selectedTiming}
                                isClearable
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
                        </div>
                    </div>

                    {/* Language */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Select Language
                        </label>
                        <Select
                            options={LANGUAGES}
                            placeholder="Select Language..."
                            onChange={(lang) => setSelectedLanguage(lang)}
                            value={selectedLanguage}
                            isClearable
                            className="react-select-container"
                            classNamePrefix="react-select"
                        />
                    </div>

                    {/* Specific Request */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Specific Request (Optional)
                        </label>
                        <div className="flex items-center gap-2">
                            <textarea
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors min-h-[100px] resize-y"
                                placeholder="e.g., I want advice for pest control..."
                                value={specificRequest}
                                onChange={(e) => setSpecificRequest(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={handleVoiceToggle}
                                disabled={isTranscribing}
                                className={`p-3 rounded-full text-white transition-colors flex-shrink-0 ${isRecording
                                    ? "bg-red-500 hover:bg-red-600"
                                    : "bg-green-600 hover:bg-green-700"
                                    }`}
                            >
                                {isRecording ? "🔴 Stop" : "🎤 Speak"}
                            </button>
                        </div>
                        {isTranscribing && (
                            <p className="text-xs text-gray-500">Transcribing audio...</p>
                        )}
                    </div>

                    {/* Get Advice Button */}
                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleGetAdvice}
                            disabled={
                                loading ||
                                !selectedState ||
                                !selectedDistrict ||
                                !selectedTiming ||
                                !cropName ||
                                !selectedLanguage
                            }
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                        >
                            {loading ? "Getting Advice..." : "Get Advice"}
                        </Button>
                    </div>

                    {/* Advice + TTS Controls */}
                    {advice && (
                        <div className="mt-8 p-6 bg-green-50 rounded-lg border-l-4 border-green-600 shadow-sm transition-all duration-300">
                            <h2 className="text-xl font-bold text-green-800 mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <span>Our Recommendation:</span>
                                <div className="flex flex-wrap gap-2">
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
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {advice}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
