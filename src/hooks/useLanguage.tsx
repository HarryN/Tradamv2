'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGES, Locale, translate } from '@/lib/i18n';

const STORAGE_KEY = 'tradam-language';

interface LanguageContextType {
  locale: Locale;
  language: Locale;
  setLanguage: (lang: Locale) => void;
  languages: typeof LANGUAGES;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    try {
      const cookieMatch = document.cookie
        .split('; ')
        .find((item) => item.startsWith(`${STORAGE_KEY}=`))
        ?.split('=')[1] as Locale | undefined;
      const stored = cookieMatch || (localStorage.getItem(STORAGE_KEY) as Locale | null);

      if (stored && LANGUAGES.some((item) => item.code === stored)) {
        setLocale(stored);
      } else {
        const browserLang = navigator.language?.slice(0, 2).toLowerCase();
        if (browserLang === 'fr') {
          setLocale('fr');
        }
      }
    } catch (error) {
      // silent fallback
    }
  }, []);

  const setLanguage = (lang: Locale) => {
    setLocale(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.cookie = `${STORAGE_KEY}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (error) {
      // ignore storage errors
    }
  };

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = 'ltr';
    document.documentElement.dataset.locale = locale;

    try {
      localStorage.setItem(STORAGE_KEY, locale);
      document.cookie = `${STORAGE_KEY}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (error) {
      // ignore storage errors
    }
  }, [locale]);

  const t = useMemo(() => {
    return (key: string) => translate(locale, key);
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    language: locale,
    setLanguage,
    languages: LANGUAGES,
    t
  }), [locale, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
