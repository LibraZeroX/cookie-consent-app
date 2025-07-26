/**
 * Cookie consent core types and utilities
 * @module @cookie-ja/core
 */

// 基本型定義
export interface ConsentCategories {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentData {
  version: string;
  categories: ConsentCategories;
  timestamp: number;
  siteId: string;
  uid?: string;
}

export interface CookieConsentConfig {
  siteId: string;
  version?: string;
  language?: 'ja' | 'en';
  theme?: 'light' | 'dark' | 'auto';
  position?: 'bottom' | 'top' | 'center';
  layout?: 'box' | 'bar' | 'cloud';
  acceptAllButton?: boolean;
  rejectAllButton?: boolean;
  managePreferencesButton?: boolean;
  cookieName?: string;
  cookieExpiry?: number; // days
  webhookUrl?: string;
  onAccept?: (consent: ConsentData) => void;
  onReject?: (consent: ConsentData) => void;
  onChange?: (consent: ConsentData) => void;
}

export interface WebhookPayload {
  siteId: string;
  uidHash: string;
  timestamp: string; // ISO string
  categories: ConsentCategories;
  version: string;
  ipRegion?: string;
  userAgent?: string;
}

// APPI準拠の日本語文面テンプレート
export const JAPANESE_TEXTS = {
  title: 'クッキーの使用について',
  description: 'ウェブサイトの機能向上のため、お客様の同意を得てクッキーを使用させていただきます。以下のカテゴリごとに同意をお選びいただけます。',
  acceptAll: 'すべて同意',
  rejectAll: 'すべて拒否',
  managePreferences: '設定する',
  save: '設定を保存',
  close: '閉じる',
  categories: {
    necessary: {
      title: '必要なクッキー',
      description: 'サイトの基本機能に必要なクッキーです。これらは常に有効です。'
    },
    functional: {
      title: '機能性クッキー',
      description: 'ウェブサイトの機能向上のためのクッキーです。'
    },
    analytics: {
      title: '分析クッキー',
      description: 'サイト利用状況の分析に使用するクッキーです。'
    },
    marketing: {
      title: '広告クッキー',
      description: 'パーソナライズされた広告配信のためのクッキーです。'
    }
  },
  policyLink: 'プライバシーポリシー',
  poweredBy: 'Powered by Cookie-JA'
} as const;

// 英語文面テンプレート
export const ENGLISH_TEXTS = {
  title: 'Cookie Usage',
  description: 'We use cookies to improve website functionality with your consent. You can choose consent for each category below.',
  acceptAll: 'Accept All',
  rejectAll: 'Reject All',
  managePreferences: 'Manage Preferences',
  save: 'Save Settings',
  close: 'Close',
  categories: {
    necessary: {
      title: 'Necessary Cookies',
      description: 'Cookies required for basic site functionality. These are always enabled.'
    },
    functional: {
      title: 'Functional Cookies',
      description: 'Cookies for website functionality improvements.'
    },
    analytics: {
      title: 'Analytics Cookies',
      description: 'Cookies for analyzing site usage statistics.'
    },
    marketing: {
      title: 'Marketing Cookies',
      description: 'Cookies for personalized advertising delivery.'
    }
  },
  policyLink: 'Privacy Policy',
  poweredBy: 'Powered by Cookie-JA'
} as const;

// ユーティリティ関数
export class CookieManager {
  private static readonly COOKIE_NAME = 'cookie_ja_consent';
  private static readonly LS_KEY = 'cookie_ja_consent_backup';

  static saveConsent(data: ConsentData): void {
    const payload = JSON.stringify(data);
    
    // Cookie保存 (SameSite=Lax; Secure)
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    
    try {
      document.cookie = `${this.COOKIE_NAME}=${encodeURIComponent(payload)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure`;
    } catch (e) {
      // レガシーブラウザ用フォールバック
      document.cookie = `${this.COOKIE_NAME}=${encodeURIComponent(payload)}; expires=${expires.toUTCString()}; path=/`;
    }

    // localStorage バックアップ
    try {
      localStorage.setItem(this.LS_KEY, payload);
    } catch (e) {
      console.warn('localStorage not available for consent backup');
    }
  }

  static getConsent(): ConsentData | null {
    // Cookieから読み取り
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === this.COOKIE_NAME && value) {
        try {
          return JSON.parse(decodeURIComponent(value));
        } catch (e) {
          console.warn('Failed to parse consent cookie');
        }
      }
    }

    // localStorage フォールバック
    try {
      const backup = localStorage.getItem(this.LS_KEY);
      if (backup) {
        return JSON.parse(backup);
      }
    } catch (e) {
      console.warn('Failed to parse consent localStorage backup');
    }

    return null;
  }

  static clearConsent(): void {
    // Cookie削除
    document.cookie = `${this.COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    
    // localStorage削除
    try {
      localStorage.removeItem(this.LS_KEY);
    } catch (e) {
      // ignore
    }
  }

  static hasConsent(): boolean {
    return this.getConsent() !== null;
  }
}

// Webhook送信ユーティリティ
export async function sendConsentWebhook(
  webhookUrl: string, 
  data: ConsentData,
  userAgent?: string
): Promise<void> {
  // UIDハッシュ生成（プライバシー保護）
  const uidHash = await generateUidHash(data.uid || 'anonymous');
  
  const payload: WebhookPayload = {
    siteId: data.siteId,
    uidHash,
    timestamp: new Date(data.timestamp).toISOString(),
    categories: data.categories,
    version: data.version,
    userAgent
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.warn('Failed to send consent webhook:', error);
  }
}

// SHA-256ハッシュ生成
async function generateUidHash(uid: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(uid);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // フォールバック（簡易ハッシュ）
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    const char = uid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// デフォルト設定
export const DEFAULT_CONFIG: Partial<CookieConsentConfig> = {
  version: '1.0.0',
  language: 'ja',
  theme: 'light',
  position: 'bottom',
  layout: 'box',
  acceptAllButton: true,
  rejectAllButton: true,
  managePreferencesButton: true,
  cookieName: 'cookie_ja_consent',
  cookieExpiry: 365
};

// デフォルトカテゴリ（必要以外はfalse）
export const DEFAULT_CATEGORIES: ConsentCategories = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false
}; 