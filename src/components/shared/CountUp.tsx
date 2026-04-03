import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
}

export function CountUp({ end, duration = 800, prefix = '', suffix = '' }: CountUpProps) {
  const [count, setCount] = useState(0)
  const startTime = useRef<number | null>(null)
  const rafId = useRef<number>(0)

  useEffect(() => {
    startTime.current = null
    const animate = (ts: number) => {
      if (!startTime.current) startTime.current = ts
      const elapsed = ts - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))
      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate)
      }
    }
    rafId.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId.current)
  }, [end, duration])

  return <span>{prefix}{count.toLocaleString('ru-RU')}{suffix}</span>
}
