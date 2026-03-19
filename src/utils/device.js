// Device utilities

// Detect if the user is on a mobile device
export const isMobile = () => {
  if (typeof navigator === 'undefined') return false;

  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );
};

// Detect if biometric authentication is available (WebAuthn / Face ID / Touch ID)
export const isBiometricAvailable = () => {
  if (typeof window === 'undefined') return false;

  return (
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function'
  );
};
