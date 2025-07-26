/**
 * React hooks and components for cookie consent management
 * @module @cookie-ja/react
 */

export { CookieConsentProvider } from './CookieConsentProvider';
export { useCookieConsent } from './hooks/useCookieConsent';
export { CookieBanner } from './components/CookieBanner';
export type { CookieConsentProviderProps } from './CookieConsentProvider';

// Re-export core types for convenience
export type {
  ConsentCategories,
  ConsentData,
  CookieConsentConfig
} from '@cookie-ja/core'; 