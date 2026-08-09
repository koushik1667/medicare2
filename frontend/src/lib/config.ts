// 全局配置文件
// 检测运行环境并设置合适的 API_BASE
const getApiBase = (): string => {
  // 优先使用环境变量
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 生产环境使用相对路径，通过 Nginx 代理访问 API
  // 这样可以避免 Mixed Content 问题
  return '';
};

export const CONFIG = {
  // API configuration
  API_BASE: getApiBase(),
  API_VERSION: '/api/v1',

  // Request configuration
  REQUEST_TIMEOUT: 30000,

  // Storage keys
  TOKEN_KEY: 'medicare_token',
  REFRESH_TOKEN_KEY: 'medicare_refresh_token',
  USER_KEY: 'medicare_user',

  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // File upload
  MAX_FILE_SIZE: 200 * 1024 * 1024, // 200MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],

  // App info
  APP_NAME: 'MediCareAI',
  APP_VERSION: '1.0.0',

  // Google OAuth Client ID (set in frontend/.env)
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined,

  // Supabase (set in frontend/.env)
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
};