'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from './useLanguage';
import { translate } from '@/lib/i18n';
import { translateDynamicTexts } from '@/services/ai-service';

const DYNAMIC_TRANSLATION_STORAGE_KEY = 'tradam-dynamic-translations-v1';
const dynamicTranslationCache = new Map<string, string>();
let hasHydratedDynamicCache = false;

function getCacheKey(locale: string, text: string) {
  return `${locale}::${text}`;
}

function hydrateDynamicCache() {
  if (hasHydratedDynamicCache || typeof window === 'undefined') return;

  try {
    const raw = window.localStorage.getItem(DYNAMIC_TRANSLATION_STORAGE_KEY);
    if (!raw) {
      hasHydratedDynamicCache = true;
      return;
    }

    const parsed = JSON.parse(raw) as Record<string, string>;
    Object.entries(parsed).forEach(([key, value]) => {
      if (typeof value === 'string') {
        dynamicTranslationCache.set(key, value);
      }
    });
  } catch (error) {
    // Ignore malformed cache data.
  } finally {
    hasHydratedDynamicCache = true;
  }
}

function persistDynamicCache() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      DYNAMIC_TRANSLATION_STORAGE_KEY,
      JSON.stringify(Object.fromEntries(dynamicTranslationCache.entries()))
    );
  } catch (error) {
    // Ignore storage quota and privacy mode failures.
  }
}

/**
 * A hook to translate dynamic content (like product titles/descriptions)
 * that may not be in the static i18n dictionary.
 */
export function useTranslatedContent() {
  const { locale } = useLanguage();
  const [, setRefreshToken] = useState(0);
  const pendingTextsRef = useRef<Set<string>>(new Set());
  const isProcessingRef = useRef(false);

  useEffect(() => {
    hydrateDynamicCache();
  }, []);

  useEffect(() => {
    if (locale === 'en' || isProcessingRef.current || pendingTextsRef.current.size === 0) {
      return;
    }

    const texts = Array.from(pendingTextsRef.current);
    pendingTextsRef.current.clear();
    isProcessingRef.current = true;

    translateDynamicTexts(texts, locale === 'fr' ? 'French' : locale)
      .then((translations) => {
        texts.forEach((text, index) => {
          const translated = translations[index]?.trim();
          if (translated) {
            dynamicTranslationCache.set(getCacheKey(locale, text), translated);
          }
        });
        persistDynamicCache();
        setRefreshToken((value) => value + 1);
      })
      .catch(() => {
        // Leave the original text visible if dynamic translation fails.
      })
      .finally(() => {
        isProcessingRef.current = false;
      });
  });

  const tc = (text: string | undefined | null) => {
    if (!text) return '';

    const dictionaryTranslation = translate(locale, text);
    if (dictionaryTranslation !== text || locale === 'en') {
      return dictionaryTranslation;
    }

    const normalizedText = text.trim();
    if (!normalizedText) return '';

    hydrateDynamicCache();

    const cachedTranslation = dynamicTranslationCache.get(getCacheKey(locale, normalizedText));
    if (cachedTranslation) {
      return cachedTranslation;
    }

    pendingTextsRef.current.add(normalizedText);
    return text;
  };

  return { tc };
}
