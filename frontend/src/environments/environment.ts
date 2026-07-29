declare global {
  interface Window {
    __APP_CONFIG__?: { apiUrl?: string };
  }
}

const configuredUrl = typeof window !== 'undefined' ? window.__APP_CONFIG__?.apiUrl : undefined;
export const environment = {
  apiUrl: configuredUrl?.replace(/\/+$/, '') || 'http://localhost:8080/api/v1'
};
