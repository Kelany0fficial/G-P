import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Button, Input, Card } from '@/components/ui'
import { getErrorMessage } from '@/api/axios'
import { Logo } from '@/components/brand/Logo'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      showToast('Please enter both email and password', 'error')
      return
    }
    
    setIsLoading(true)
    try {
      const loggedInUser = await login({ email, password })
      showToast('Login successful!', 'success')
      // Role-aware landing
      const fallback =
        loggedInUser.role === 'Admin' ? '/admin'
        : loggedInUser.role === 'Guide' ? '/guide/profile'
        : '/'
      navigate(from && from !== '/login' ? from : fallback, { replace: true })
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md" padding="lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4 ">
            <Logo />
          </div>
          
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-slate-500 dark:text-slate-300 mt-1 text-sm">Sign in to your Ather account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="name@example.com"
          />
          
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-[38px] text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="text-right">
            <Link to="/forget-password" className="text-sm text-primary-600 hover:text-primary-700 hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            <Lock className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-300 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 font-semibold hover:underline">
            Create Account
          </Link>
        </p>
      </Card>
    </div>
  )
}