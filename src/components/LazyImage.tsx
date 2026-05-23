import { useRef, useState, useEffect } from 'react'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholderClass?: string
  /** Gradient fallback classes if src fails or is absent */
  fallbackGradient?: string
  fallbackEmoji?: string
}

/**
 * LazyImage — carga la imagen solo cuando entra al viewport (IntersectionObserver).
 * Aplica un efecto blur-up: empieza borrosa y se enfoca suavemente al cargar.
 */
export default function LazyImage({
  src,
  alt,
  className = '',
  fallbackGradient = 'from-indigo-500 to-fuchsia-500',
  fallbackEmoji = '🎉',
}: LazyImageProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const el = imgRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' } // pre-carga 200px antes de entrar a pantalla
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (!src || hasError) {
    return (
      <div
        className={`w-full h-full bg-gradient-to-br ${fallbackGradient} flex items-center justify-center text-2xl ${className}`}
      >
        {fallbackEmoji}
      </div>
    )
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Placeholder de color mientras carga */}
      {!isLoaded && (
        <div className={`absolute inset-0 bg-gradient-to-br ${fallbackGradient} opacity-40 animate-pulse`} />
      )}
      <img
        ref={imgRef}
        src={isVisible ? src : undefined}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-all duration-500 ${
          isLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-105'
        }`}
      />
    </div>
  )
}
