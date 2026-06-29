import { createContext, useContext, useState } from 'react'

const AdminThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} })

export function AdminThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('admin-theme') ?? 'dark'
  )

  function toggleTheme() {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      localStorage.setItem('admin-theme', next)
      return next
    })
  }

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </AdminThemeContext.Provider>
  )
}

export function useAdminTheme() {
  return useContext(AdminThemeContext)
}
