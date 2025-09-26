import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, getTranslation, getTranslationWithVars } from '../translations'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  // Get initial language from localStorage or default to 'en'
  const [language, setLanguage] = useState(() => {
    const savedLang = localStorage.getItem('language')
    return savedLang || 'en'
  })

  // Save language preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'es' : 'en')
  }

  const t = (path, vars) => {
    if (vars) {
      return getTranslationWithVars(language, path, vars)
    }
    return getTranslation(language, path)
  }

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    translations: translations[language]
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export default LanguageContext