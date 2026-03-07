// src/services/authApi.js
export const login = async (email, password) => {
  console.log('login called', { email, password });
  // Placeholder: simulate API response
  return new Promise((resolve) =>
    setTimeout(() => resolve({ success: true, token: 'fake-jwt-token' }), 500)
  );
};

export const logout = () => {
  console.log('logout called');
};

export const register = async (userData) => {
  console.log('register called', userData);
  return new Promise((resolve) =>
    setTimeout(() => resolve({ success: true, user: userData }), 500)
  );
};
