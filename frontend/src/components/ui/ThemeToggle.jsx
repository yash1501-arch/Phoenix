import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Night / day theme control — compact icon button for nav.
 */
const ThemeToggle = ({ className = '', size = 18 }) => {
  const { isNight, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2.5 text-stone hover:text-ember transition-colors rounded-md ${className}`}
      aria-label={isNight ? 'Switch to day theme' : 'Switch to night theme'}
      aria-pressed={isNight}
      title={isNight ? 'Day theme' : 'Night theme'}
    >
      <span className="sr-only">{isNight ? 'Day theme' : 'Night theme'}</span>
      {isNight ? <Sun size={size} strokeWidth={2.25} /> : <Moon size={size} strokeWidth={2.25} />}
    </button>
  );
};

export default ThemeToggle;
