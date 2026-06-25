'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

const RECOMMENDATIONS = [
  "Take a moment to recognize a student's positive effort today.",
  "A quick encouraging word can change a student's entire day.",
  "Look for small wins in the classroom today and celebrate them.",
  "Consider reaching out to a parent with some positive news today.",
  "Take a deep breath and remember the impact you have on your students.",
  "Acknowledge improved behavior, no matter how small.",
  "Smile and greet students by name as they enter the room today.",
];

export default function DailyRecommendationBanner({ name }: { name: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const [recommendation, setRecommendation] = useState('');

  useEffect(() => {
    // Only show once per day
    const today = new Date().toLocaleDateString();
    const dismissedDate = localStorage.getItem('dailyRecommendationDismissed');
    
    if (dismissedDate !== today) {
      // Pick a random recommendation based on the date to be consistent for the day
      const dateSeed = new Date().getDate();
      const recIndex = dateSeed % RECOMMENDATIONS.length;
      setRecommendation(RECOMMENDATIONS[recIndex]);
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    const today = new Date().toLocaleDateString();
    localStorage.setItem('dailyRecommendationDismissed', today);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 shadow-sm relative animate-fade-in">
      <button 
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300 transition-colors"
      >
        <X size={18} />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
          <Sparkles size={20} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">
            Good morning, {name}!
          </h3>
          <p className="text-blue-800 dark:text-blue-200 mt-1 font-medium">
            Today's Recommendation: <span className="font-normal text-gray-700 dark:text-gray-300">{recommendation}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
