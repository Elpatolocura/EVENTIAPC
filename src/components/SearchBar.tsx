import { useState, useEffect, useRef } from 'react'

interface SearchBarProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  categories?: string[]
  onCategorySelect?: (cat: string) => void
}

const MAX_HISTORY = 6
const STORAGE_KEY = 'eventia_search_history'

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar eventos...',
  categories = [],
  onCategorySelect,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [internalValue, setInternalValue] = useState(value)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Cargar historial desde localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      setHistory(Array.isArray(saved) ? saved : [])
    } catch {
      setHistory([])
    }
  }, [])

  // Sincronizar internalValue con prop value (cuando se limpia externamente)
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  // Debounce: esperar 350ms tras el último keystroke antes de filtrar
  const handleInput = (val: string) => {
    setInternalValue(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onChange(val)
    }, 350)
  }

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const saveToHistory = (term: string) => {
    if (!term.trim() || term.trim().length < 2) return
    const updated = [term.trim(), ...history.filter((h) => h !== term.trim())].slice(0, MAX_HISTORY)
    setHistory(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const handleSubmit = (term: string) => {
    saveToHistory(term)
    onChange(term)
    setInternalValue(term)
    setFocused(false)
    inputRef.current?.blur()
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem(STORAGE_KEY)
  }

  const clearSearch = () => {
    setInternalValue('')
    onChange('')
    inputRef.current?.focus()
  }

  const showDropdown = focused && (history.length > 0 || categories.length > 0) && !internalValue

  return (
    <div ref={containerRef} className="relative">
      {/* Input principal */}
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border bg-white transition-all duration-200 ${
        focused ? 'border-indigo-400 ring-2 ring-indigo-100 shadow-sm' : 'border-gray-200'
      }`}>
        <svg className={`w-4 h-4 shrink-0 transition-colors ${focused ? 'text-indigo-500' : 'text-gray-400'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={internalValue}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && internalValue.trim()) handleSubmit(internalValue)
            if (e.key === 'Escape') { setFocused(false); inputRef.current?.blur() }
          }}
          placeholder={placeholder}
          className="flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
        />
        {internalValue && (
          <button type="button" onClick={clearSearch}
            className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors cursor-pointer shrink-0">
            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown: historial + categorías */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
          {history.length > 0 && (
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Búsquedas recientes</span>
                <button type="button" onClick={clearHistory}
                  className="text-[11px] text-red-400 hover:text-red-600 cursor-pointer transition-colors">
                  Borrar
                </button>
              </div>
              <div className="space-y-0.5">
                {history.map((h) => (
                  <button key={h} type="button" onClick={() => handleSubmit(h)}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 text-left cursor-pointer group transition-colors">
                    <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-700 flex-1">{h}</span>
                    <svg className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {categories.length > 0 && (
            <div className={`p-3 ${history.length > 0 ? 'border-t border-gray-100' : ''}`}>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Categorías populares
              </span>
              <div className="flex flex-wrap gap-1.5">
                {categories.slice(0, 8).map((cat) => (
                  <button key={cat} type="button"
                    onClick={() => {
                      onCategorySelect?.(cat)
                      setFocused(false)
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer">
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
