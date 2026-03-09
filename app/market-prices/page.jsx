"use client";

import { useEffect, useState } from "react";

// A simple SVG-based loading spinner
const Spinner = () => (
  <svg className="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// Custom Searchable Dropdown Component
const SearchableDropdown = ({ options = [], value, onChange, placeholder, isDisabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value?.label || "");
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    setInputValue(value?.label || "");
  }, [value]);

  useEffect(() => {
    if (inputValue) {
      setFilteredOptions(
        options.filter((option) =>
          option?.label?.toLowerCase().includes(inputValue.toLowerCase())
        )
      );
    } else {
      setFilteredOptions(options);
    }
  }, [inputValue, options]);

  const handleSelect = (option) => {
    onChange(option.value);
    setInputValue(option.label);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        disabled={isDisabled}
        className="rounded-lg p-2 w-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-200"
      />
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                onMouseDown={() => handleSelect(option)}
                className="p-2 cursor-pointer hover:bg-green-100 transition-colors"
              >
                {option.label}
              </div>
            ))
          ) : (
            <div className="p-2 text-gray-500 text-center">No options found.</div>
          )}
        </div>
      )}
    </div>
  );
};

// Main component
export default function App() {
  const [records, setRecords] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedCommodity, setSelectedCommodity] = useState(null);

  const [filteredData, setFilteredData] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const normalizeRecord = (r) => {
    return {
      state: r.state || r.State || "",
      district: r.district || r.District || "",
      market: r.market || r.Market || "",
      commodity: r.commodity || r.Commodity || "",
      variety: r.variety || r.Variety || "",
      min_price: r.min_price || r["Min Price"] || "",
      max_price: r.max_price || r["Max Price"] || "",
      modal_price: r.modal_price || r["Modal Price"] || "",
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const API_URL =
          "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd000001cdc3b564546246a772a26393094f5645&offset=0&limit=all&format=json";

        const res = await fetch(API_URL);
        const json = await res.json();

        const normalized = json.records.map(normalizeRecord);
        setRecords(normalized);

        const uniqueStates = [...new Set(normalized.map((r) => r.state).filter(Boolean))].sort();
        setStates(uniqueStates.map((s) => ({ value: s, label: s })));

      } catch (err) {
        console.error("API fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedState) {
      const filteredDistricts = records.filter(r => r.state === selectedState);
      const uniqueDistricts = [...new Set(filteredDistricts.map(r => r.district).filter(Boolean))].sort();
      setDistricts(uniqueDistricts.map(d => ({ value: d, label: d })));
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
    }
  }, [selectedState, records]);

  useEffect(() => {
    if (selectedState && selectedDistrict) {
      const filteredCommodities = records.filter(
        r => r.state === selectedState && r.district === selectedDistrict
      );

      const uniqueCommodities = [...new Set(filteredCommodities.map(r => r.commodity).filter(Boolean))].sort();
      setCommodities(uniqueCommodities.map(c => ({ value: c, label: c })));
    } else {
      setCommodities([]);
      setSelectedCommodity(null);
    }
  }, [selectedState, selectedDistrict, records]);

  const handleSearch = () => {
    if (!selectedState || !selectedDistrict || !selectedCommodity) {
      setFilteredData([]);
      return;
    }

    const filtered = records.filter(
      (r) =>
        r.state === selectedState &&
        r.district === selectedDistrict &&
        r.commodity === selectedCommodity
    );

    setFilteredData(filtered);
  };

  if (!mounted) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto font-sans bg-gray-50 min-h-screen rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-green-700 mb-6 text-center">
        Real-Time Market Prices
      </h1>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <SearchableDropdown
              options={states}
              value={states.find(s => s.value === selectedState)}
              onChange={setSelectedState}
              placeholder="Select State"
            />

            <SearchableDropdown
              options={districts}
              value={districts.find(d => d.value === selectedDistrict)}
              onChange={setSelectedDistrict}
              placeholder="Select District"
              isDisabled={!selectedState}
            />

            <SearchableDropdown
              options={commodities}
              value={commodities.find(c => c.value === selectedCommodity)}
              onChange={setSelectedCommodity}
              placeholder="Select Commodity"
              isDisabled={!selectedDistrict}
            />
          </div>

          <div className="flex justify-end mb-6">
            <button
              onClick={handleSearch}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
            >
              Search
            </button>
          </div>

          <div className="mt-8">
            {filteredData.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block rounded-lg shadow-lg border border-gray-200 overflow-x-auto">
                  <table className="min-w-[900px] w-full border-collapse">
                    <thead>
                      <tr className="bg-green-600 text-white">
                        <th className="p-4 text-left">Market</th>
                        <th className="p-4 text-left">Commodity</th>
                        <th className="p-4 text-left">Variety</th>
                        <th className="p-4 text-left">Min Price</th>
                        <th className="p-4 text-left">Max Price</th>
                        <th className="p-4 text-left">Modal Price</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredData.map((item, idx) => (
                        <tr key={idx} className="border-b hover:bg-green-50">
                          <td className="p-4">{item.market}</td>
                          <td className="p-4">{item.commodity}</td>
                          <td className="p-4">{item.variety}</td>
                          <td className="p-4 text-right">₹{item.min_price}</td>
                          <td className="p-4 text-right">₹{item.max_price}</td>
                          <td className="p-4 text-right">₹{item.modal_price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {filteredData.map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg shadow border">
                      <div className="font-semibold">{item.market}</div>
                      <div className="text-sm text-gray-600">{item.commodity}</div>
                      <div className="text-sm text-gray-600">{item.variety}</div>
                      <div className="mt-2 text-sm">
                        Min: ₹{item.min_price} | Max: ₹{item.max_price} | Modal: ₹{item.modal_price}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-600 text-center py-8">
                {selectedState && selectedDistrict && selectedCommodity
                  ? "No results found."
                  : "Please select a state, district, and commodity."}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}