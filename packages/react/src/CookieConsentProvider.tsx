import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  ConsentData,
  ConsentCategories,
  CookieConsentConfig,
  CookieManager,
  DEFAULT_CONFIG,
  DEFAULT_CATEGORIES,
  sendConsentWebhook
} from '@cookie-ja/core';

interface CookieConsentContextValue {
  consent: ConsentData | null;
  config: CookieConsentConfig;
  showBanner: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  updateConsent: (categories: ConsentCategories) => void;
  showPreferences: () => void;
  hideBanner: () => void;
  resetConsent: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export interface CookieConsentProviderProps {
  config: CookieConsentConfig;
  children: ReactNode;
}

export function CookieConsentProvider({ config, children }: CookieConsentProviderProps) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const [consent, setConsent] = useState<ConsentData | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  // 初期化: 既存の同意データを読み込み
  useEffect(() => {
    const existingConsent = CookieManager.getConsent();
    if (existingConsent && existingConsent.siteId === mergedConfig.siteId) {
      setConsent(existingConsent);
      setShowBanner(false);
    } else {
      setShowBanner(true);
    }
  }, [mergedConfig.siteId]);

  // 同意データ保存とWebhook送信
  const saveConsentData = async (categories: ConsentCategories, action: 'accept' | 'reject' | 'update') => {
    const consentData: ConsentData = {
      version: mergedConfig.version || '1.0.0',
      categories,
      timestamp: Date.now(),
      siteId: mergedConfig.siteId!,
      uid: crypto.randomUUID?.() || Math.random().toString(36)
    };

    // ローカル保存
    CookieManager.saveConsent(consentData);
    setConsent(consentData);

    // Webhook送信
    if (mergedConfig.webhookUrl) {
      try {
        await sendConsentWebhook(
          mergedConfig.webhookUrl,
          consentData,
          navigator.userAgent
        );
      } catch (error) {
        console.warn('Failed to send consent webhook:', error);
      }
    }

    // コールバック実行
    switch (action) {
      case 'accept':
        mergedConfig.onAccept?.(consentData);
        break;
      case 'reject':
        mergedConfig.onReject?.(consentData);
        break;
      case 'update':
        mergedConfig.onChange?.(consentData);
        break;
    }
  };

  const acceptAll = () => {
    const allCategories: ConsentCategories = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    saveConsentData(allCategories, 'accept');
    setShowBanner(false);
  };

  const rejectAll = () => {
    saveConsentData(DEFAULT_CATEGORIES, 'reject');
    setShowBanner(false);
  };

  const updateConsent = (categories: ConsentCategories) => {
    // 必要なクッキーは常にtrue
    const updatedCategories = { ...categories, necessary: true };
    saveConsentData(updatedCategories, 'update');
    setShowBanner(false);
  };

  const showPreferences = () => {
    setShowBanner(true);
  };

  const hideBanner = () => {
    setShowBanner(false);
  };

  const resetConsent = () => {
    CookieManager.clearConsent();
    setConsent(null);
    setShowBanner(true);
  };

  const contextValue: CookieConsentContextValue = {
    consent,
    config: mergedConfig,
    showBanner,
    acceptAll,
    rejectAll,
    updateConsent,
    showPreferences,
    hideBanner,
    resetConsent
  };

  return (
    <CookieConsentContext.Provider value={contextValue}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsentContext(): CookieConsentContextValue {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsentContext must be used within a CookieConsentProvider');
  }
  return context;
} 