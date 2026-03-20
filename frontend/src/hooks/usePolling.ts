import { useEffect } from 'react'

export function usePolling(callback: () => void, intervalMs = 8000, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined
    callback()
    const id = setInterval(callback, intervalMs)
    return () => clearInterval(id)
  }, [callback, intervalMs, enabled])
}
