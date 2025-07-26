import { useCookieConsentContext } from '../CookieConsentProvider';

/**
 * Cookie consent state and actions
 */
export function useCookieConsent() {
  const context = useCookieConsentContext();

  return {
    // 現在の同意状態
    consent: context.consent,
    hasConsent: context.consent !== null,
    categories: context.consent?.categories || {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    },

    // バナー表示状態
    showBanner: context.showBanner,

    // アクション
    acceptAll: context.acceptAll,
    rejectAll: context.rejectAll,
    updateConsent: context.updateConsent,
    showPreferences: context.showPreferences,
    hideBanner: context.hideBanner,
    resetConsent: context.resetConsent,

    // 設定
    config: context.config,
  };
}
