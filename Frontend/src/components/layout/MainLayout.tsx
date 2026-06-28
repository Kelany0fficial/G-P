import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { MobileNav } from './MobileNav'
import { unlockAudio } from '@/utils/sound'
import { AiGuideBot } from '@/components/ai/AiGuideBot'   

export function MainLayout() {
  // Unlock the Web Audio context on the very first user gesture.
  // Once unlocked, playNotificationChime() works from any async context (SignalR).
  useEffect(() => {
    const handle = () => unlockAudio()
    document.addEventListener('click',   handle, { once: true })
    document.addEventListener('keydown', handle, { once: true })
    document.addEventListener('touchend',handle, { once: true })
    return () => {
      document.removeEventListener('click',   handle)
      document.removeEventListener('keydown', handle)
      document.removeEventListener('touchend',handle)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
      <AiGuideBot />   
    </div>
  )
}
