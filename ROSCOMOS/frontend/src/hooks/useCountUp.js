import { useEffect, useState } from 'react'

export function useCountUp(end, duration = 800) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let current = 0
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      current += step
      if (current >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [end, duration])
  return count
}
