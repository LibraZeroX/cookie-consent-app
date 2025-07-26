/**
 * Cookie-JA UMD Widget
 * @module @cookie-ja/widget
 */

import {
  CookieConsentConfig,
  ConsentData,
  ConsentCategories,
  CookieManager,
  DEFAULT_CONFIG,
  DEFAULT_CATEGORIES,
  JAPANESE_TEXTS,
  ENGLISH_TEXTS,
  sendConsentWebhook,
} from '@cookie-ja/core';

// グローバルAPI
class CookieJAWidget {
  private config: CookieConsentConfig;
  private consent: ConsentData | null = null;
  private bannerElement: HTMLElement | null = null;
  private isInitialized = false;

  constructor(config: CookieConsentConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.init();
  }

  private async init() {
    if (this.isInitialized) return;

    // 既存の同意データを読み込み
    this.consent = CookieManager.getConsent();

    // DOM ready まで待機
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () =>
        this.showBannerIfNeeded()
      );
    } else {
      this.showBannerIfNeeded();
    }

    this.isInitialized = true;
  }

  private showBannerIfNeeded() {
    if (!this.consent || this.consent.siteId !== this.config.siteId) {
      this.showBanner();
    }
  }

  public showBanner() {
    if (this.bannerElement) {
      this.bannerElement.style.display = 'block';
      return;
    }

    this.bannerElement = this.createBannerElement();
    document.body.appendChild(this.bannerElement);
  }

  public hideBanner() {
    if (this.bannerElement) {
      this.bannerElement.style.display = 'none';
    }
  }

  public getConsent(): ConsentData | null {
    return this.consent;
  }

  public hasConsent(): boolean {
    return this.consent !== null;
  }

  public acceptAll() {
    const categories: ConsentCategories = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    this.saveConsent(categories, 'accept');
  }

  public rejectAll() {
    this.saveConsent(DEFAULT_CATEGORIES, 'reject');
  }

  public updateConsent(categories: ConsentCategories) {
    const updatedCategories = { ...categories, necessary: true };
    this.saveConsent(updatedCategories, 'update');
  }

  public resetConsent() {
    CookieManager.clearConsent();
    this.consent = null;
    this.showBanner();
  }

  private async saveConsent(
    categories: ConsentCategories,
    action: 'accept' | 'reject' | 'update'
  ) {
    const consentData: ConsentData = {
      version: this.config.version || '1.0.0',
      categories,
      timestamp: Date.now(),
      siteId: this.config.siteId!,
      uid: crypto.randomUUID?.() || Math.random().toString(36),
    };

    // ローカル保存
    CookieManager.saveConsent(consentData);
    this.consent = consentData;

    // Webhook送信
    if (this.config.webhookUrl) {
      try {
        await sendConsentWebhook(
          this.config.webhookUrl,
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
        this.config.onAccept?.(consentData);
        break;
      case 'reject':
        this.config.onReject?.(consentData);
        break;
      case 'update':
        this.config.onChange?.(consentData);
        break;
    }

    this.hideBanner();
  }

  private createBannerElement(): HTMLElement {
    const texts =
      this.config.language === 'en' ? ENGLISH_TEXTS : JAPANESE_TEXTS;

    const banner = document.createElement('div');
    banner.className = `cookie-ja-banner cookie-ja-banner--${this.config.position} cookie-ja-banner--${this.config.theme}`;

    banner.innerHTML = `
      <div class="cookie-ja-banner__content">
        <div class="cookie-ja-banner__text">
          <h3 class="cookie-ja-banner__title">${texts.title}</h3>
          <p class="cookie-ja-banner__description">${texts.description}</p>
        </div>
        <div class="cookie-ja-banner__actions">
          ${
            this.config.rejectAllButton
              ? `
            <button class="cookie-ja-banner__button cookie-ja-banner__button--secondary" data-action="reject">
              ${texts.rejectAll}
            </button>
          `
              : ''
          }
          ${
            this.config.managePreferencesButton
              ? `
            <button class="cookie-ja-banner__button cookie-ja-banner__button--tertiary" data-action="preferences">
              ${texts.managePreferences}
            </button>
          `
              : ''
          }
          ${
            this.config.acceptAllButton
              ? `
            <button class="cookie-ja-banner__button cookie-ja-banner__button--primary" data-action="accept">
              ${texts.acceptAll}
            </button>
          `
              : ''
          }
        </div>
      </div>
      <button class="cookie-ja-banner__close" data-action="close" aria-label="${texts.close}">×</button>
    `;

    // イベントリスナー追加
    banner.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;

      switch (action) {
        case 'accept':
          this.acceptAll();
          break;
        case 'reject':
          this.rejectAll();
          break;
        case 'preferences':
          this.showPreferencesModal();
          break;
        case 'close':
          this.hideBanner();
          break;
      }
    });

    // スタイル追加
    if (!document.getElementById('cookie-ja-styles')) {
      const style = document.createElement('style');
      style.id = 'cookie-ja-styles';
      style.textContent = this.getCSS();
      document.head.appendChild(style);
    }

    return banner;
  }

  private showPreferencesModal() {
    const texts =
      this.config.language === 'en' ? ENGLISH_TEXTS : JAPANESE_TEXTS;
    const currentCategories = this.consent?.categories || DEFAULT_CATEGORIES;

    const modal = document.createElement('div');
    modal.className = 'cookie-ja-preferences';

    modal.innerHTML = `
      <div class="cookie-ja-preferences__overlay"></div>
      <div class="cookie-ja-preferences__content">
        <div class="cookie-ja-preferences__header">
          <h2 class="cookie-ja-preferences__title">${texts.managePreferences}</h2>
          <button class="cookie-ja-preferences__close" data-action="close">×</button>
        </div>
        <div class="cookie-ja-preferences__body">
          ${Object.entries(texts.categories)
            .map(
              ([category, categoryTexts]) => `
            <div class="cookie-ja-category">
              <div class="cookie-ja-category__header">
                <div class="cookie-ja-category__info">
                  <h3 class="cookie-ja-category__title">${categoryTexts.title}</h3>
                  <p class="cookie-ja-category__description">${categoryTexts.description}</p>
                </div>
                <label class="cookie-ja-toggle">
                  <input 
                    type="checkbox" 
                    data-category="${category}"
                    ${currentCategories[category as keyof ConsentCategories] ? 'checked' : ''}
                    ${category === 'necessary' ? 'disabled' : ''}
                  />
                  <span class="cookie-ja-toggle__slider"></span>
                </label>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
        <div class="cookie-ja-preferences__footer">
          <button class="cookie-ja-banner__button cookie-ja-banner__button--secondary" data-action="close">
            ${texts.close}
          </button>
          <button class="cookie-ja-banner__button cookie-ja-banner__button--primary" data-action="save">
            ${texts.save}
          </button>
        </div>
      </div>
    `;

    // イベントリスナー
    modal.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;

      if (action === 'close') {
        document.body.removeChild(modal);
      } else if (action === 'save') {
        const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
        const categories: ConsentCategories = { ...DEFAULT_CATEGORIES };

        checkboxes.forEach(checkbox => {
          const input = checkbox as HTMLInputElement;
          const category = input.dataset.category as keyof ConsentCategories;
          if (category) {
            categories[category] = input.checked;
          }
        });

        this.updateConsent(categories);
        document.body.removeChild(modal);
      }
    });

    // オーバーレイクリックで閉じる
    const overlay = modal.querySelector('.cookie-ja-preferences__overlay');
    overlay?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    document.body.appendChild(modal);
  }

  private getCSS(): string {
    return `
      .cookie-ja-banner {
        position: fixed;
        left: 1rem;
        right: 1rem;
        background: var(--cookie-banner-bg, #fff);
        color: var(--cookie-banner-text, #333);
        border: 1px solid var(--cookie-banner-border, #e0e0e0);
        border-radius: var(--cookie-banner-radius, 8px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        font-family: var(--cookie-banner-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
        font-size: 14px;
        line-height: 1.5;
      }

      .cookie-ja-banner--bottom { bottom: 1rem; }
      .cookie-ja-banner--top { top: 1rem; }
      .cookie-ja-banner--center { top: 50%; transform: translateY(-50%); }

      .cookie-ja-banner--dark {
        --cookie-banner-bg: #2d3748;
        --cookie-banner-text: #f7fafc;
        --cookie-banner-border: #4a5568;
      }

      .cookie-ja-banner__content {
        padding: 1.5rem;
        padding-right: 3rem;
      }

      .cookie-ja-banner__title {
        margin: 0 0 0.5rem 0;
        font-size: 1.1em;
        font-weight: 600;
      }

      .cookie-ja-banner__description {
        margin: 0 0 1rem 0;
        color: var(--cookie-banner-text-muted, #666);
      }

      .cookie-ja-banner--dark .cookie-ja-banner__description {
        color: #a0aec0;
      }

      .cookie-ja-banner__actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .cookie-ja-banner__button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: var(--cookie-banner-button-radius, 4px);
        font-size: 0.9em;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .cookie-ja-banner__button--primary {
        background: var(--cookie-banner-primary, #3182ce);
        color: white;
      }

      .cookie-ja-banner__button--primary:hover {
        background: var(--cookie-banner-primary-hover, #2c5aa0);
      }

      .cookie-ja-banner__button--secondary {
        background: var(--cookie-banner-secondary, #e2e8f0);
        color: var(--cookie-banner-text, #333);
      }

      .cookie-ja-banner__button--secondary:hover {
        background: var(--cookie-banner-secondary-hover, #cbd5e0);
      }

      .cookie-ja-banner__button--tertiary {
        background: transparent;
        color: var(--cookie-banner-primary, #3182ce);
        text-decoration: underline;
      }

      .cookie-ja-banner__close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--cookie-banner-text-muted, #666);
        line-height: 1;
      }

      .cookie-ja-preferences {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }

      .cookie-ja-preferences__overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
      }

      .cookie-ja-preferences__content {
        position: relative;
        background: var(--cookie-banner-bg, #fff);
        border-radius: var(--cookie-banner-radius, 8px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        max-width: 500px;
        width: 100%;
        max-height: 80vh;
        overflow-y: auto;
      }

      .cookie-ja-preferences__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem 1.5rem 1rem;
        border-bottom: 1px solid var(--cookie-banner-border, #e0e0e0);
      }

      .cookie-ja-category {
        margin-bottom: 1.5rem;
      }

      .cookie-ja-category__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
      }

      .cookie-ja-toggle {
        position: relative;
        display: inline-block;
        width: 44px;
        height: 24px;
        flex-shrink: 0;
      }

      .cookie-ja-toggle input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .cookie-ja-toggle__slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: 0.3s;
        border-radius: 24px;
      }

      .cookie-ja-toggle__slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.3s;
        border-radius: 50%;
      }

      .cookie-ja-toggle input:checked + .cookie-ja-toggle__slider {
        background-color: var(--cookie-banner-primary, #3182ce);
      }

      .cookie-ja-toggle input:checked + .cookie-ja-toggle__slider:before {
        transform: translateX(20px);
      }

      @media (max-width: 768px) {
        .cookie-ja-banner {
          left: 0.5rem;
          right: 0.5rem;
        }
        
        .cookie-ja-banner__actions {
          flex-direction: column;
        }
        
        .cookie-ja-banner__button {
          width: 100%;
          text-align: center;
        }
      }
    `;
  }
}

// グローバル関数
function initCookieJA(config: CookieConsentConfig): CookieJAWidget {
  return new CookieJAWidget(config);
}

// Auto-init from script tag data attributes
document.addEventListener('DOMContentLoaded', () => {
  const script = document.querySelector(
    'script[data-site-id]'
  ) as HTMLScriptElement;
  if (script) {
    const siteId = script.dataset.siteId;
    const webhookUrl = script.dataset.webhookUrl;
    const language = (script.dataset.language as 'ja' | 'en') || 'ja';
    const theme =
      (script.dataset.theme as 'light' | 'dark' | 'auto') || 'light';
    const position =
      (script.dataset.position as 'bottom' | 'top' | 'center') || 'bottom';

    if (siteId) {
      const config: CookieConsentConfig = {
        siteId,
        language,
        theme,
        position,
        webhookUrl,
      };

      window.cookieJA = initCookieJA(config);
    }
  }
});

// TypeScript declarations
declare global {
  interface Window {
    cookieJA?: CookieJAWidget;
    initCookieJA?: typeof initCookieJA;
  }
}

// Export for module usage
export { CookieJAWidget, initCookieJA };

// Global assignment for UMD
if (typeof window !== 'undefined') {
  window.initCookieJA = initCookieJA;
}
