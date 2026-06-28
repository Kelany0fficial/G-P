import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { useToast } from '@/context/ToastContext'
import { Button, Input, Card } from '@/components/ui'
import { getErrorMessage } from '@/api/axios'
import { Logo } from '@/components/brand/Logo'

export function ForgetPasswordPage() {
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      showToast('Please enter your email address', 'error')
      return
    }
    
    setIsLoading(true)
    try {
      await authApi.forgetPassword({ email })
      showToast('Reset code has been sent to your email', 'success')
      setStep('reset')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (otp.length !== 6) {
      showToast('Please enter the full 6-digit verification code', 'error')
      return
    }
    
    if (newPassword !== confirmPassword) {
      showToast('New password and confirmation do not match', 'error')
      return
    }
    
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error')
      return
    }
    
    setIsLoading(true)
    try {
      await authApi.resetPassword({ email, otp, newPassword })
      showToast('Password changed successfully! You can now log in', 'success')
      navigate('/login')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md" padding="lg">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4 ">
                      <Logo />
                    </div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-sm text-slate-500 mt-2">
            {step === 'email' 
              ? 'Enter your email and we\'ll send you a verification code'
              : 'Enter the verification code and your new password'}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
            />
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Send Reset Code
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <Input
              label="Verification Code (OTP)"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
              className="text-center text-xl tracking-[0.3em] font-mono"
              placeholder="000000"
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              hint="Must be at least 8 characters"
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Change Password
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-slate-500 mt-6">
          <Link to="/login" className="text-primary-600 font-semibold hover:underline">
            Back to Login
          </Link>
        </p>
      </Card>
    </div>
  )
}