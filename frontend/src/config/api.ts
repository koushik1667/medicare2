// API Configuration for Vite
// Vite uses import.meta.env instead of process.env
// Environment variables must start with VITE_ to be exposed to client

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Helper function to build API URLs
export const buildApiUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/api/v1/${cleanPath}`;
};
