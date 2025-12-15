import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide splash screen after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for fade out animation to complete
      setTimeout(onComplete, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-black">
      <div className="flex flex-col items-center">
        {/* Logo */}
        <div className="mb-6">
          <img 
            src="/logo.png" 
            alt="Cosmic IDE" 
            className="w-24 h-24 object-contain"
            onError={(e) => {
              // Fallback to simple text if logo fails
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* App Name */}
        <h1 className="text-3xl font-bold text-white mb-2">
          Cosmic IDE
        </h1>

        {/* Loading dots */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};