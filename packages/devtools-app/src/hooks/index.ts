import { useEffect, useState } from 'react'

const checkIsDark = () => {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch (err) {
    return false
  }
}

export function useIsDark() {
  const [isDark, setIsDark] = useState(checkIsDark())

  useEffect(() => {
    const mqList = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (event: MediaQueryListEvent) => {
      setIsDark(event.matches)
    }
    mqList.addEventListener('change', listener)
    return () => {
      mqList.removeEventListener('change', listener)
    }
  }, [])
  return isDark
}
