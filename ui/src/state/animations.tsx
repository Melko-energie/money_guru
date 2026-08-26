import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const Ctx = createContext<{ animations: boolean; basculer: () => void } | null>(null)

export function FournisseurAnimations({ children }: { children: ReactNode }) {
  const [animations, set] = useState(
    () =>
      typeof window === 'undefined' || !window.matchMedia
        ? true
        : !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const f = () => set(!mq.matches)
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])

  const v = useMemo(() => ({ animations, basculer: () => set((x) => !x) }), [animations])
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>
}

export function useAnimations() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAnimations hors FournisseurAnimations')
  return c
}
