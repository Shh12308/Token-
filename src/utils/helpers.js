// src/utils/helpers.js

// Copy text to clipboard (with fallback for older browsers)
export const copyToClipboard = async (text) => {
  if (!text) return;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    document.execCommand('copy');
    document.body.removeChild(textarea);

    return true;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
};

// Optional: format address (short display)
export const shortenAddress = (address, chars = 4) => {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

// Optional: delay helper
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
