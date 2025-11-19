'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'

type Toast = {
  id: string
  title: string
  body: string
  link?: string
  visible: boolean
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (e: any) => {
      const payload = e?.detail || {}
      const title = payload?.notification?.title || payload?.data?.title || 'Bagami'
      const body = payload?.notification?.body || payload?.data?.body || ''
      const link = payload?.data?.link
      if (!body && !title) return
      const id = `${Date.now()}_${Math.random()}`
      setToasts((prev) => [...prev, { id, title, body, link, visible: false }])
      setTimeout(() => {
        setToasts((prev) => prev.map(t => t.id === id ? { ...t, visible: true } : t))
      }, 10)
      setTimeout(() => {
        setToasts((prev) => prev.map(t => t.id === id ? { ...t, visible: false } : t))
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 200)
      }, 5000)
    }
    window.addEventListener('bagami-notification', handler as any)
    return () => window.removeEventListener('bagami-notification', handler as any)
  }, [])

  const closeToast = (id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t))
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 200)
  }

  const handleClick = (t: Toast) => {
    if (t.link) {
      if (t.link.startsWith('http')) {
        window.open(t.link, '_blank')
      } else {
        window.location.href = t.link
      }
    }
  }

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-[1000] space-y-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => handleClick(t)}
            className={`max-w-sm w-[320px] cursor-pointer rounded-2xl border shadow-xl transition-all duration-200 ${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} bg-white/90 backdrop-blur-sm border-orange-200`}
          >
            <div className="relative p-4">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 -z-10" />
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {t.title}
                  </div>
                  <div className="text-sm text-gray-700 mt-0.5 line-clamp-3">
                    {t.body}
                  </div>
                  
                </div>
                <button
                  aria-label="Close"
                  onClick={(e) => { e.stopPropagation(); closeToast(t.id) }}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
