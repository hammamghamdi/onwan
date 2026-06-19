"use client";

import { useEffect, useState } from "react";

export type Language = "ar" | "en";

const storageKey = "onwan_language";

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>("ar");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryLanguage = params.get("lang");

    if (queryLanguage === "en" || queryLanguage === "ar") {
      localStorage.setItem(storageKey, queryLanguage);
      window.setTimeout(() => setLanguageState(queryLanguage), 0);
      return;
    }

    const savedLanguage = localStorage.getItem(storageKey);

    if (savedLanguage === "en" || savedLanguage === "ar") {
      window.setTimeout(() => setLanguageState(savedLanguage), 0);
    }
  }, []);

  const setLanguage = (nextLanguage: Language) => {
    localStorage.setItem(storageKey, nextLanguage);
    setLanguageState(nextLanguage);
  };

  return { language, setLanguage };
}
