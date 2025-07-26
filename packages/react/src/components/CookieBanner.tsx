import React, { useState } from 'react';
import { useCookieConsentContext } from '../CookieConsentProvider';
import {
  JAPANESE_TEXTS,
  ENGLISH_TEXTS,
  ConsentCategories,
} from '@cookie-ja/core';

export function CookieBanner() {
  const {
    showBanner,
    config,
    acceptAll,
    rejectAll,
    updateConsent,
    hideBanner,
    consent,
  } = useCookieConsentContext();

  const [showPreferences, setShowPreferences] = useState(false);
  const [tempCategories, setTempCategories] = useState<ConsentCategories>(
    consent?.categories || {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    }
  );

  const texts = config.language === 'en' ? ENGLISH_TEXTS : JAPANESE_TEXTS;

  if (!showBanner) {
    return null;
  }

  const handleSavePreferences = () => {
    updateConsent(tempCategories);
    setShowPreferences(false);
  };

  const toggleCategory = (category: keyof ConsentCategories) => {
    if (category === 'necessary') return; // 必要なクッキーは変更不可

    setTempCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <>
      {/* オーバーレイ */}
      {showPreferences && (
        <div
          className='cookie-banner-overlay'
          onClick={() => setShowPreferences(false)}
        />
      )}

      {/* メインバナー */}
      <div
        className={`cookie-banner cookie-banner--${config.position} cookie-banner--${config.theme}`}
      >
        <div className='cookie-banner__content'>
          <div className='cookie-banner__text'>
            <h3 className='cookie-banner__title'>{texts.title}</h3>
            <p className='cookie-banner__description'>{texts.description}</p>
          </div>

          <div className='cookie-banner__actions'>
            {config.rejectAllButton && (
              <button
                className='cookie-banner__button cookie-banner__button--secondary'
                onClick={rejectAll}
                type='button'
              >
                {texts.rejectAll}
              </button>
            )}

            {config.managePreferencesButton && (
              <button
                className='cookie-banner__button cookie-banner__button--tertiary'
                onClick={() => setShowPreferences(true)}
                type='button'
              >
                {texts.managePreferences}
              </button>
            )}

            {config.acceptAllButton && (
              <button
                className='cookie-banner__button cookie-banner__button--primary'
                onClick={acceptAll}
                type='button'
              >
                {texts.acceptAll}
              </button>
            )}
          </div>
        </div>

        <button
          className='cookie-banner__close'
          onClick={hideBanner}
          type='button'
          aria-label={texts.close}
        >
          ×
        </button>
      </div>

      {/* 設定モーダル */}
      {showPreferences && (
        <div className='cookie-preferences'>
          <div className='cookie-preferences__content'>
            <div className='cookie-preferences__header'>
              <h2 className='cookie-preferences__title'>
                {texts.managePreferences}
              </h2>
              <button
                className='cookie-preferences__close'
                onClick={() => setShowPreferences(false)}
                type='button'
                aria-label={texts.close}
              >
                ×
              </button>
            </div>

            <div className='cookie-preferences__body'>
              {Object.entries(texts.categories).map(
                ([category, categoryTexts]) => (
                  <div key={category} className='cookie-category'>
                    <div className='cookie-category__header'>
                      <div className='cookie-category__info'>
                        <h3 className='cookie-category__title'>
                          {categoryTexts.title}
                        </h3>
                        <p className='cookie-category__description'>
                          {categoryTexts.description}
                        </p>
                      </div>
                      <label className='cookie-toggle'>
                        <input
                          type='checkbox'
                          checked={
                            tempCategories[category as keyof ConsentCategories]
                          }
                          onChange={() =>
                            toggleCategory(category as keyof ConsentCategories)
                          }
                          disabled={category === 'necessary'}
                        />
                        <span className='cookie-toggle__slider'></span>
                      </label>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className='cookie-preferences__footer'>
              <button
                className='cookie-banner__button cookie-banner__button--secondary'
                onClick={() => setShowPreferences(false)}
                type='button'
              >
                {texts.close}
              </button>
              <button
                className='cookie-banner__button cookie-banner__button--primary'
                onClick={handleSavePreferences}
                type='button'
              >
                {texts.save}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .cookie-banner-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
        }

        .cookie-banner {
          position: fixed;
          left: 1rem;
          right: 1rem;
          background: var(--cookie-banner-bg, #fff);
          color: var(--cookie-banner-text, #333);
          border: 1px solid var(--cookie-banner-border, #e0e0e0);
          border-radius: var(--cookie-banner-radius, 8px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          font-family: var(
            --cookie-banner-font,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Roboto,
            sans-serif
          );
          font-size: 14px;
          line-height: 1.5;
        }

        .cookie-banner--bottom {
          bottom: 1rem;
        }

        .cookie-banner--top {
          top: 1rem;
        }

        .cookie-banner--center {
          top: 50%;
          transform: translateY(-50%);
        }

        .cookie-banner--dark {
          --cookie-banner-bg: #2d3748;
          --cookie-banner-text: #f7fafc;
          --cookie-banner-border: #4a5568;
        }

        .cookie-banner__content {
          padding: 1.5rem;
          padding-right: 3rem;
        }

        .cookie-banner__title {
          margin: 0 0 0.5rem 0;
          font-size: 1.1em;
          font-weight: 600;
        }

        .cookie-banner__description {
          margin: 0 0 1rem 0;
          color: var(--cookie-banner-text-muted, #666);
        }

        .cookie-banner--dark .cookie-banner__description {
          color: #a0aec0;
        }

        .cookie-banner__actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .cookie-banner__button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: var(--cookie-banner-button-radius, 4px);
          font-size: 0.9em;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cookie-banner__button--primary {
          background: var(--cookie-banner-primary, #3182ce);
          color: white;
        }

        .cookie-banner__button--primary:hover {
          background: var(--cookie-banner-primary-hover, #2c5aa0);
        }

        .cookie-banner__button--secondary {
          background: var(--cookie-banner-secondary, #e2e8f0);
          color: var(--cookie-banner-text, #333);
        }

        .cookie-banner__button--secondary:hover {
          background: var(--cookie-banner-secondary-hover, #cbd5e0);
        }

        .cookie-banner__button--tertiary {
          background: transparent;
          color: var(--cookie-banner-primary, #3182ce);
          text-decoration: underline;
        }

        .cookie-banner__button--tertiary:hover {
          color: var(--cookie-banner-primary-hover, #2c5aa0);
        }

        .cookie-banner__close {
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

        .cookie-banner__close:hover {
          color: var(--cookie-banner-text, #333);
        }

        .cookie-preferences {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1001;
          padding: 1rem;
        }

        .cookie-preferences__content {
          background: var(--cookie-banner-bg, #fff);
          border-radius: var(--cookie-banner-radius, 8px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          max-width: 500px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .cookie-preferences__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 1.5rem 1rem;
          border-bottom: 1px solid var(--cookie-banner-border, #e0e0e0);
        }

        .cookie-preferences__title {
          margin: 0;
          font-size: 1.2em;
          font-weight: 600;
        }

        .cookie-preferences__close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--cookie-banner-text-muted, #666);
          line-height: 1;
        }

        .cookie-preferences__body {
          padding: 1rem 1.5rem;
        }

        .cookie-category {
          margin-bottom: 1.5rem;
        }

        .cookie-category__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .cookie-category__info {
          flex: 1;
        }

        .cookie-category__title {
          margin: 0 0 0.25rem 0;
          font-size: 1em;
          font-weight: 600;
        }

        .cookie-category__description {
          margin: 0;
          font-size: 0.9em;
          color: var(--cookie-banner-text-muted, #666);
        }

        .cookie-toggle {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
        }

        .cookie-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .cookie-toggle__slider {
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

        .cookie-toggle__slider:before {
          position: absolute;
          content: '';
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        .cookie-toggle input:checked + .cookie-toggle__slider {
          background-color: var(--cookie-banner-primary, #3182ce);
        }

        .cookie-toggle input:checked + .cookie-toggle__slider:before {
          transform: translateX(20px);
        }

        .cookie-toggle input:disabled + .cookie-toggle__slider {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cookie-preferences__footer {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          padding: 1rem 1.5rem 1.5rem;
          border-top: 1px solid var(--cookie-banner-border, #e0e0e0);
        }

        @media (max-width: 768px) {
          .cookie-banner {
            left: 0.5rem;
            right: 0.5rem;
          }

          .cookie-banner__actions {
            flex-direction: column;
          }

          .cookie-banner__button {
            width: 100%;
            text-align: center;
          }

          .cookie-category__header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .cookie-preferences__footer {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
