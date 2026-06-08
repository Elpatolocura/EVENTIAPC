import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type ThemeContextType = {
  color: string
  theme: string
  setColor: (c: string) => void
  setTheme: (t: string) => void
}

const ThemeContext = createContext<ThemeContextType>({
  color: 'indigo',
  theme: 'light',
  setColor: () => {},
  setTheme: () => {},
})

const colorClasses: Record<string, string> = {
  indigo: 'indigo', blue: 'blue', green: 'green', red: 'red',
  pink: 'pink', purple: 'purple', orange: 'orange', teal: 'teal',
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [color, setColor] = useState(() => localStorage.getItem('themeColor') || 'indigo')
  const [theme, setTheme] = useState(() => localStorage.getItem('themeMode') || 'light')

  useEffect(() => { localStorage.setItem('themeColor', color) }, [color])
  useEffect(() => { localStorage.setItem('themeMode', theme) }, [theme])

  return (
    <ThemeContext.Provider value={{ color, theme, setColor, setTheme }}>
      <div className={`theme-${colorClasses[color] || 'indigo'} ${theme === 'dark' ? 'dark' : ''}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
