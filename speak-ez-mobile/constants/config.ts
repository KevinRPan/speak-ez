/**
 * App configuration
 */

// Change this to your deployed Cloudflare Pages URL in production
export const API_BASE_URL = __DEV__
  ? 'http://localhost:8788'
  : 'https://speak-sharp.pages.dev';
