'use client';

import { useState } from 'react';
import { Button } from '../components/ui/button';

export default function FeedbackForm() {
  const [rating, setRating] = useState(0);

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-3xl font-extrabold text-green-800 text-center mb-6">
        Your Feedback Matters
      </h2>
      <p className="text-gray-600 text-center mb-8">
        We would love to hear your thoughts on our service.
      </p>
      
      <form>
        {/* Rating Section */}
        <div className="mb-6 text-center">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How would you rate our service?
          </label>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`cursor-pointer text-3xl transition-transform transform hover:scale-110 ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-300'
                }`}
                onClick={() => setRating(star)}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        {/* Feedback Textarea */}
        <div className="mb-6">
          <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
            Your Feedback
          </label>
          <textarea
            id="feedback"
            rows="5"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
            placeholder="Tell us what you think..."
          ></textarea>
        </div>

        {/* Contact Info (Optional) */}
        <div className="mb-6">
          <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
            Email or Phone (Optional)
          </label>
          <input
            type="text"
            id="contact"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
            placeholder="Enter your email or phone number"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
            Submit Feedback
          </Button>
        </div>
      </form>
    </div>
  );
}