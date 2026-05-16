import { createContext, useContext, useState, type ReactNode } from 'react'

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
  const [color, setColor] = useState('indigo')
  const [theme, setTheme] = useState('light')

  return (
    <ThemeContext.Provider value={{ color, theme, setColor, setTheme }}>
      <div className={`theme-${colorClasses[color] || 'indigo'} ${theme === 'dark' ? 'dark' : ''}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
