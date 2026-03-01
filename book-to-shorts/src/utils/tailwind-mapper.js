/**
 * Tailwind CSS to inline style mapper
 * Converts Tailwind-like class names to React inline styles for Remotion
 */

const tailwindMap = {
  // Background colors
  'bg-black': { backgroundColor: '#000000' },
  'bg-white': { backgroundColor: '#ffffff' },
  'bg-gray-50': { backgroundColor: '#f9fafb' },
  'bg-gray-100': { backgroundColor: '#f3f4f6' },
  'bg-gray-200': { backgroundColor: '#e5e7eb' },
  'bg-gray-300': { backgroundColor: '#d1d5db' },
  'bg-gray-400': { backgroundColor: '#9ca3af' },
  'bg-gray-500': { backgroundColor: '#6b7280' },
  'bg-gray-600': { backgroundColor: '#4b5563' },
  'bg-gray-700': { backgroundColor: '#374151' },
  'bg-gray-800': { backgroundColor: '#1f2937' },
  'bg-gray-900': { backgroundColor: '#111827' },
  'bg-red': { backgroundColor: '#ef4444' },
  'bg-red-900': { backgroundColor: '#7f1d1d' },
  'bg-red-800': { backgroundColor: '#991b1b' },
  'bg-red-700': { backgroundColor: '#b91c1c' },
  'bg-blue': { backgroundColor: '#3b82f6' },
  'bg-blue-900': { backgroundColor: '#1e3a8a' },
  'bg-green': { backgroundColor: '#10b981' },
  'bg-yellow': { backgroundColor: '#f59e0b' },
  'bg-purple': { backgroundColor: '#a855f7' },
  'bg-indigo': { backgroundColor: '#6366f1' },
  'bg-gold': { backgroundColor: '#fbbf24' },

  // Text colors
  'text-white': { color: '#ffffff' },
  'text-black': { color: '#000000' },
  'text-gray-50': { color: '#f9fafb' },
  'text-gray-100': { color: '#f3f4f6' },
  'text-gray-200': { color: '#e5e7eb' },
  'text-gray-300': { color: '#d1d5db' },
  'text-gray-400': { color: '#9ca3af' },
  'text-gray-500': { color: '#6b7280' },
  'text-gray-600': { color: '#4b5563' },
  'text-gray-700': { color: '#374151' },
  'text-gray-800': { color: '#1f2937' },
  'text-gray-900': { color: '#111827' },
  'text-red': { color: '#ef4444' },
  'text-red-500': { color: '#ef4444' },
  'text-red-600': { color: '#dc2626' },
  'text-blue': { color: '#3b82f6' },
  'text-green': { color: '#10b981' },
  'text-yellow': { color: '#f59e0b' },
  'text-purple': { color: '#a855f7' },
  'text-gold': { color: '#fbbf24' },
  'text-orange': { color: '#f97316' },

  // Text sizes
  'text-xs': { fontSize: '20px', lineHeight: 1.4 },
  'text-sm': { fontSize: '28px', lineHeight: 1.4 },
  'text-base': { fontSize: '36px', lineHeight: 1.4 },
  'text-lg': { fontSize: '44px', lineHeight: 1.3 },
  'text-xl': { fontSize: '52px', lineHeight: 1.3 },
  'text-2xl': { fontSize: '60px', lineHeight: 1.3 },
  'text-3xl': { fontSize: '72px', lineHeight: 1.2 },
  'text-4xl': { fontSize: '88px', lineHeight: 1.2 },
  'text-5xl': { fontSize: '104px', lineHeight: 1.1 },
  'text-6xl': { fontSize: '128px', lineHeight: 1.1 },

  // Font weights
  'font-thin': { fontWeight: 100 },
  'font-light': { fontWeight: 300 },
  'font-normal': { fontWeight: 400 },
  'font-medium': { fontWeight: 500 },
  'font-semibold': { fontWeight: 600 },
  'font-bold': { fontWeight: 700 },
  'font-extrabold': { fontWeight: 800 },
  'font-black': { fontWeight: 900 },

  // Text alignment
  'text-left': { textAlign: 'left' },
  'text-center': { textAlign: 'center' },
  'text-right': { textAlign: 'right' },

  // Opacity
  'opacity-0': { opacity: 0 },
  'opacity-25': { opacity: 0.25 },
  'opacity-50': { opacity: 0.5 },
  'opacity-75': { opacity: 0.75 },
  'opacity-100': { opacity: 1 },
};

// Gradient patterns
const gradientPatterns = {
  'bg-gradient-to-b from-gray-900 to-black': 'linear-gradient(to bottom, #111827, #000000)',
  'bg-gradient-to-t from-gray-900 to-black': 'linear-gradient(to top, #111827, #000000)',
  'bg-gradient-to-r from-gray-900 to-black': 'linear-gradient(to right, #111827, #000000)',
  'bg-gradient-to-b from-black to-gray-900': 'linear-gradient(to bottom, #000000, #111827)',
  'bg-gradient-to-b from-red-900 to-black': 'linear-gradient(to bottom, #7f1d1d, #000000)',
  'bg-gradient-to-b from-blue-900 to-black': 'linear-gradient(to bottom, #1e3a8a, #000000)',
  'bg-gradient-to-b from-purple-900 to-black': 'linear-gradient(to bottom, #581c87, #000000)',
};

/**
 * Parse Tailwind classes to inline styles
 * @param {string} classString - Space-separated Tailwind classes
 * @returns {object} React inline style object
 */
export function parseStyle(classString) {
  if (!classString) return {};

  const classes = classString.trim().split(/\s+/);
  let styles = {};

  // Check for gradient first (multi-class patterns)
  const classKey = classes.join(' ');
  if (gradientPatterns[classKey]) {
    return { background: gradientPatterns[classKey] };
  }

  // Process individual classes
  for (const className of classes) {
    if (tailwindMap[className]) {
      styles = { ...styles, ...tailwindMap[className] };
    } else {
      // Try to parse custom values (e.g., bg-[#123456])
      const customColor = parseCustomColor(className);
      if (customColor) {
        styles = { ...styles, ...customColor };
      }
    }
  }

  return styles;
}

/**
 * Parse custom color values like bg-[#123456]
 */
function parseCustomColor(className) {
  const bgMatch = className.match(/^bg-\[(.+)\]$/);
  if (bgMatch) {
    return { backgroundColor: bgMatch[1] };
  }

  const textMatch = className.match(/^text-\[(.+)\]$/);
  if (textMatch) {
    return { color: textMatch[1] };
  }

  return null;
}

/**
 * Get text size in pixels from Tailwind class
 * @param {string} sizeClass - Tailwind size class (e.g., 'text-4xl')
 * @returns {number} Font size in pixels
 */
export function getTextSize(sizeClass) {
  const style = tailwindMap[sizeClass];
  if (style && style.fontSize) {
    return parseInt(style.fontSize);
  }
  return 64; // default
}

/**
 * Parse multiple style strings and merge them
 * @param {string[]} styleStrings - Array of Tailwind class strings
 * @returns {object} Merged style object
 */
export function mergeStyles(...styleStrings) {
  return styleStrings.reduce((acc, styleString) => {
    return { ...acc, ...parseStyle(styleString) };
  }, {});
}

export default parseStyle;
