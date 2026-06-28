import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { useToast } from '@/context/ToastContext'
import { Button, Input, Card } from '@/components/ui'
import { getErrorMessage } from '@/api/axios'

export function VerifyOtpPage() {
  const location = useLocation()
  const [email, setEmail] = useState<string>('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const { showToast } = useToast()
  const navigate = useNavigate()

  // Get email from location state or sessionStorage
  useEffect(() => {
    const stateEmail = (location.state as { email?: string })?.email
    const savedEmail = sessionStorage.getItem('pendingVerificationEmail')
    
    if (stateEmail) {
      setEmail(stateEmail)
    } else if (savedEmail) {
      setEmail(savedEmail)
    } else {
      showToast('Email is required for verification', 'error')
      navigate('/register')
    }
  }, [location, navigate, showToast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      showToast('Please enter the full 6-digit verification code', 'error')
      return
    }
    
    setIsLoading(true)
    try {
      await authApi.verifyEmail({ email, otp })
      
      // Clear stored email
      sessionStorage.removeItem('pendingVerificationEmail')
      
      showToast('Email verified successfully! You can now log in', 'success')
      navigate('/login')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (timeLeft > 0) return
    
    setIsResending(true)
    try {
      await authApi.resendActivationOtp(email)
      showToast('A new verification code has been sent to your email', 'success')
      setTimeLeft(60)
      
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md" padding="lg">
        <div className="text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-white font-black text-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            A
          </div>
          <h1 className="text-2xl font-bold">Verify Your Account</h1>
          <p className="text-sm text-slate-500 mt-2">
            Enter the 6-digit code sent to
          </p>
          <p className="text-sm font-medium text-primary-600 mt-1">
            {email || 'your email address'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center">
            <Input
              label="Verification Code (OTP)"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
              className="text-center text-2xl tracking-[0.5em] font-mono"
              placeholder="000000"
            />
          </div>
          
          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Verify Account
          </Button>
        </form>
        
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={timeLeft > 0 || isResending}
            className="text-sm text-primary-600 hover:underline disabled:text-slate-400 disabled:no-underline"
          >
            {isResending ? 'Sending...' : timeLeft > 0 ? `Resend code in ${timeLeft}s` : 'Resend Code'}
          </button>
        </div>
        
        <p className="text-center text-sm text-slate-500 mt-6">
          <Link to="/login" className="text-primary-600 font-semibold hover:underline">
            Back to Login
          </Link>
        </p>
      </Card>
    </div>
  )
}