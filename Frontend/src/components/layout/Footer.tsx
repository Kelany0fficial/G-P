import { Link } from 'react-router-dom'
import { Globe, Mail, Share2 } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'

export function Footer() {
  return (
    <footer className="mt-auto bg-slate-950 dark:bg-night-900 text-slate-300">
      <div className="container-app py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-8">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              <Logo />
              {/* <span className="text-xl font-bold text-white">Ather</span> */}
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-400">
              The smart Egyptian tourism platform — connect with verified tour guides,
              plan your trip with AI, and book with confidence.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/explore" className="text-slate-400 transition-colors hover:text-white">
                  Explore Places
                </Link>
              </li>
              <li>
                <Link to="/guides" className="text-slate-400 transition-colors hover:text-white">
                  Tour Guides
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-slate-400 transition-colors hover:text-white">
                  Become a Guide
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Connect
            </h4>
            <div className="flex gap-2.5">
              {[Globe, Share2, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="rounded-lg bg-slate-800/80 dark:bg-night-800 p-2.5 text-slate-300 ring-1 ring-slate-700 dark:ring-night-700 transition-all hover:bg-primary-600 hover:text-white hover:ring-primary-500"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-800 dark:border-night-800 pt-6 text-xs text-slate-500 dark:text-slate-400 sm:flex-row">
          <span>© {new Date().getFullYear()} Ather — All rights reserved.</span>
          <span>Built for explorers of the Nile and beyond.</span>
        </div>
      </div>
    </footer>
  )
}
