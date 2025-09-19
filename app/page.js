import Link from "next/link";

export default function HomePage() {
  return (
    <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-green-800">Crop Advisory Chatbot</h2>
        <p className="mt-2 text-green-700">Get personalized crop advice based on your inputs.</p>
        <div className="flex justify-end mt-4">
          <Link href="/crop-advisory">
            <div className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Get Smart Assistance</div>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-green-800">Soil Health Upload</h2>
        <p className="mt-2 text-green-700">Upload soil test report for analysis and recommendations.</p>
        <div className="flex justify-end mt-4">
          <Link href="/soil-upload">
            <div className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Upload Soil Report</div>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-green-800">Pest/Disease Detection</h2>
        <p className="mt-2 text-green-700">Upload an image to detect pests or diseases affecting your crops.</p>
        <div className="flex justify-end mt-4">
          <Link href="/pest-detection">
            <div className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Upload Image</div>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-green-800">Market Price Tracking</h2>
        <p className="mt-2 text-green-700">Check current market prices of various crops in your region.</p>
        <div className="flex justify-end mt-4">
          <Link href="/market-prices">
            <div className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Check Prices</div>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-green-800">Weather Alerts</h2>
        <p className="mt-2 text-green-700">View upcoming weather alerts and predictions for your area.</p>
        <div className="flex justify-end mt-4">
          <Link href="/weather-alerts">
            <div className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Get Prediction</div>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-green-800">Feedback</h2>
        <p className="mt-2 text-green-700">Provide your feedback to help us improve the service.</p>
        <div className="flex justify-end mt-4">
          <Link href="/feedback">
            <div className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Give Feedback</div>
          </Link>
        </div>
      </div>
    </main>
  );
}