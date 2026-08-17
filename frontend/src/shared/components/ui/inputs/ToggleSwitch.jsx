import React from 'react';

/**
 * ToggleSwitch - Horizontal toggle switch for boolean values
 * 
 * @param {boolean} checked - Current state
 * @param {function} onChange - Change handler
 * @param {boolean} disabled - Disable the switch
 * @param {string} size - Size: 'sm' | 'md' | 'lg'
 * @param {string} className - Additional CSS classes
 */
const ToggleSwitch = ({ 
  checked = false, 
  onChange, 
  disabled = false, 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-10 h-5', 
    lg: 'w-12 h-6'
  };

  const thumbSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const thumbTranslateClasses = {
    sm: checked ? 'translate-x-4' : 'translate-x-0.5',
    md: checked ? 'translate-x-5' : 'translate-x-0.5',
    lg: checked ? 'translate-x-6' : 'translate-x-0.5'
  };

  const bgClasses = disabled
    ? (checked ? 'bg-gray-400 border-gray-400' : 'bg-gray-200 border-gray-200')
    : (checked ? 'bg-green-500 border-green-500' : 'bg-gray-300 border-gray-300');

  const thumbBgClasses = checked 
    ? 'bg-white' 
    : 'bg-white';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`
        relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 
        transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 
        focus:ring-blue-500 focus:ring-offset-2 ${sizeClasses[size]} ${bgClasses} 
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block rounded-full bg-white shadow-lg 
          transform ring-0 transition duration-150 ease-in-out 
          ${thumbSizeClasses[size]} ${thumbBgClasses} ${thumbTranslateClasses[size]}
        `}
      />
    </button>
  );
};

export default ToggleSwitch;
