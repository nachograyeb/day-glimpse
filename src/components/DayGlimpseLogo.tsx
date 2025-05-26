import React, { useEffect, useState } from 'react';

const DayGlimpseLogo = ({
  size = 'large', // 'small', 'medium', 'large'
  animated = true,
  showSubtitle = true,
  fixedPosition = true
}) => {
  const [animationTrigger, setAnimationTrigger] = useState(0);

  // Get font size based on size prop
  const getFontSize = () => {
    switch (size) {
      case 'small': return 'text-2xl sm:text-3xl';
      case 'medium': return 'text-3xl sm:text-4xl';
      case 'large':
      default: return 'text-4xl sm:text-5xl';
    }
  };

  // Trigger animation restart periodically if animated
  useEffect(() => {
    if (!animated) return;

    const interval = setInterval(() => {
      setAnimationTrigger(prev => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [animated]);

  return (
    <>
      {/* Fixed position logo */}
      <div className={fixedPosition ? 'fixed-logo-container' : 'logo-wrapper'}>
        <div className="logo-content" key={animated ? animationTrigger : 'static'}>
          <h1 className={`font-bold tracking-widest ${getFontSize()}`}>
            <span className={`day-text inline-block ${animated ? 'animate-slideIn' : ''}`} style={{ animationDelay: '0.1s' }}>
              DAY
            </span>
            <span className={`glimpse-text inline-block ${animated ? 'animate-slideIn' : ''}`} style={{ animationDelay: '0.5s' }}>
              GLIMPSE
            </span>
          </h1>

          {showSubtitle && (
            <div className={`logo-subtitle text-sm mt-2 ${animated ? 'opacity-0 animate-fadeIn' : 'opacity-80'}`} style={{ animationDelay: '1.2s' }}>
              your universal story
            </div>
          )}
        </div>
      </div>

      {/* Spacer to replace the fixed logo in document flow */}
      {fixedPosition && <div className="logo-spacer"></div>}

      <style jsx>{`
        .logo-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 0.75rem 0;
        }
        
        .fixed-logo-container {
          position: fixed;
          top: 4.5rem; /* Increased to move logo down */
          left: 0;
          right: 0;
          width: 100%;
          z-index: 50;
          text-align: center;
          pointer-events: none;
        }
        
        .logo-spacer {
          width: 100%;
          height: 140px; /* Adjusted to match the new position */
        }

        .logo-content {
          text-align: center;
        }

        @keyframes slideIn {
          0% { transform: translateY(-150%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 0.8; }
        }
        
        .animate-slideIn {
          animation: slideIn 1s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        
        .animate-fadeIn {
          animation: fadeIn 1s ease forwards;
        }
        
        .day-text {
          background: linear-gradient(to right, #ff00cc, #3333ff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 0 5px rgba(255, 0, 204, 0.7));
        }
        
        .glimpse-text {
          background: linear-gradient(to right, #3333ff, #00ccff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 0 5px rgba(51, 51, 255, 0.7));
          margin-left: 0.5rem;
        }
        
        .logo-subtitle {
          color: rgba(255, 255, 255, 0.8);
          font-weight: 300;
          letter-spacing: 0.4em;
          text-transform: lowercase;
        }
      `}</style>
    </>
  );
};

export default DayGlimpseLogo;
