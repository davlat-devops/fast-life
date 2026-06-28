import { createContext, useContext, useState } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'fastlife-theme'

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) ?? 'light')

  function toggleTheme() {
    setTheme(t => {
      const next = t === 'light' ? 'dark' : 'light'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside <ThemeProvider>')
  return ctx
}
