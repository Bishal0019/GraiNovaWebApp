'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Papa from 'papaparse';
import { Button } from '../components/ui/button';

// Dynamically import the Select component for client-side rendering
const Select = dynamic(() => import('react-select'), { ssr: false });

export default function WeatherAlertsPage() {
    const [districtData, setDistrictData] = useState([]);
    const [stateOptions, setStateOptions] = useState([]);
    const [selectedState, setSelectedState] = useState(null);
    const [districtOptions, setDistrictOptions] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch and parse the CSV file on component mount
    useEffect(() => {
        const fetchCsv = async () => {
            try {
                const response = await fetch('/District_Masters.csv');
                if (!response.ok) {
                    throw new Error('Failed to fetch District_Masters.csv');
                }
                const csvText = await response.text();
                Papa.parse(csvText, {
                    header: true,
                    complete: (results) => {
                        const parsedData = results.data.filter(
                            (row) => row && typeof row === 'object' && row['State Name']
                        );
                        setDistrictData(parsedData);

                        // Extract unique states and sort them
                        const states = [...new Set(parsedData.map(row => row['State Name']))]
                            .sort()
                            .map(stateName => ({
                                value: stateName,
                                label: stateName
                            }));
                        setStateOptions(states);
                    },
                });
            } catch (err) {
                console.error('Error fetching or parsing CSV:', err);
                setError('Failed to load district data. Please try again.');
            }
        };
        fetchCsv();
    }, []);

    // Update district options when a state is selected
    useEffect(() => {
        if (selectedState) {
            const districts = districtData
                .filter((row) => row['State Name'] === selectedState.value)
                .map((row) => ({
                    label: row['District Name'],
                    value: row['District Name'],
                }))
                .sort((a, b) => a.label.localeCompare(b.label)); // Sort districts alphabetically
            setDistrictOptions(districts);
        } else {
            setDistrictOptions([]);
            setSelectedDistrict(null);
        }
    }, [selectedState, districtData]);

    const handleGetWeather = async () => {
        if (!selectedState || !selectedDistrict) {
            setError('Please select both a state and a district.');
            return;
        }

        setLoading(true);
        setWeatherData(null);
        setError(null);

        try {
            const res = await fetch('/api/weather', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    district: selectedDistrict.value,
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to fetch weather data.');
            }

            const data = await res.json();
            setWeatherData(data.weatherAlert);
        } catch (err) {
            console.error('Failed to get weather data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
            <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <h1 className="text-3xl md:text-4xl font-extrabold text-green-800 text-center mb-8">
                    Weather Alerts
                </h1>

                <div className="space-y-6">
                    {/* State & District Dropdowns */}
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

                    {/* Get Weather Button */}
                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleGetWeather}
                            disabled={loading || !selectedState || !selectedDistrict}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                        >
                            {loading ? "Getting Alert..." : "Get Weather Alert"}
                        </Button>
                    </div>

                    {/* Weather Alert Display */}
                    {weatherData && (
                        <div className="mt-8 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-600 shadow-sm transition-all duration-300">
                            <h2 className="text-xl font-bold text-blue-800 mb-3">
                                Weather Report for {selectedDistrict.label}
                            </h2>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {weatherData}
                            </p>
                        </div>
                    )}

                    {/* Error Message Display */}
                    {error && (
                        <div className="mt-6 p-4 rounded-lg bg-red-100 border border-red-300 text-red-700">
                            <p className="font-semibold">Error:</p>
                            <p>{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}