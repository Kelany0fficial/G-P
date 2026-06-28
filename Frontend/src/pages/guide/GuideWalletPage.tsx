import { useCallback, useEffect, useState } from 'react'
import { Wallet, TrendingUp, CreditCard, Clock, AlertCircle, Plus } from 'lucide-react'
import { guidesApi } from '@/api/guides'
import { paymentsApi } from '@/api/payments'
import { Button, Card, Input, useToast } from '@/components/ui'
import { getErrorMessage } from '@/api/axios'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { GuideWallet } from '@/types'

export function GuideWalletPage() {
  const [wallet, setWallet] = useState<GuideWallet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaying, setIsPaying] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card')
  const { showToast } = useToast()

  const loadWallet = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await guidesApi.getWallet()
      setWallet(data)
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally { setIsLoading(false) }
  }, [showToast])

  useEffect(() => { loadWallet() }, [loadWallet])

  const handlePayment = async () => {
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount.', 'error')
      return
    }

    setIsPaying(true)
    try {
      const result = await paymentsApi.payDues({
        amount,
        payMethod: paymentMethod === 'card' ? 'Credit Card' : 'Bank Transfer',
      })
      showToast(result.message || 'Payment successful.', 'success')
      setPaymentAmount('')
      await loadWallet()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally { setIsPaying(false) }
  }

  if (isLoading) {
    return (
      <div className="container-app max-w-lg py-8">
        <div className="text-center text-muted">Loading wallet data…</div>
      </div>
    )
  }

  const outstandingBalance = wallet?.outstandingBalance || 0
  const walletBalance = wallet?.walletBalance || 0
  const completedTours = wallet?.completedTours || 0
  const cancellationStrikes = wallet?.cancellationStrikes || 0
  const isSuspended = wallet?.isSuspended || false
  const hasDebt = outstandingBalance > 0
  const enteredAmount = parseFloat(paymentAmount) || 0
  const overpayCredit = hasDebt ? Math.max(0, enteredAmount - outstandingBalance) : enteredAmount
  const mode: 'settle' | 'topup' = hasDebt ? 'settle' : 'topup'

  return (
    <div className="container-app max-w-lg py-8">
      <h1 className="mb-6 text-2xl font-bold">Wallet &amp; Payments</h1>

      {isSuspended && (
        <Card className="mb-6 border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-300">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">Account suspended</span>
          </div>
          <p className="mt-1 text-sm text-red-600 dark:text-red-300">
            Your account is suspended due to unpaid dues. Settle your outstanding balance to be reactivated automatically.
          </p>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4">
        <Card className={cn('bg-gradient-to-br from-primary-700 to-primary-900 text-white', !hasDebt && 'opacity-75')}>
          <Wallet className="mb-2 h-6 w-6 opacity-80" />
          <p className="text-xs opacity-80">Outstanding Balance</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(outstandingBalance)}</p>
          {hasDebt && <p className="mt-1 text-xs opacity-70">Due to platform</p>}
        </Card>

        <Card>
          <TrendingUp className="mb-2 h-6 w-6 text-emerald-500" />
          <p className="text-xs text-muted">Wallet Balance</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(walletBalance)}</p>
          <p className="mt-1 text-xs text-muted">Available for withdrawal</p>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold">{completedTours}</p>
          <p className="text-xs text-muted">Completed Tours</p>
        </Card>
        <Card className={cancellationStrikes >= 3 ? 'bg-amber-50 text-center dark:bg-amber-500/10' : 'text-center'}>
          <p className={cn('text-2xl font-bold', cancellationStrikes >= 3 && 'text-amber-600 dark:text-amber-300')}>
            {cancellationStrikes}/3
          </p>
          <p className="text-xs text-muted">Cancellation Strikes</p>
        </Card>
      </div>

      <Card padding="lg" className="mb-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          {mode === 'settle' ? (
            <>
              <CreditCard className="h-5 w-5 text-primary-600 dark:text-primary-300" />
              Settle dues or top up wallet
            </>
          ) : (
            <>
              <Plus className="h-5 w-5 text-primary-600 dark:text-primary-300" />
              Top up wallet
            </>
          )}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Payment method</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={cn(
                  'flex-1 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors',
                  paymentMethod === 'card'
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-night-800 dark:text-primary-300'
                    : 'border-slate-200 text-slate-500 dark:border-night-700 dark:text-slate-400'
                )}
              >
                Credit Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('bank')}
                className={cn(
                  'flex-1 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors',
                  paymentMethod === 'bank'
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-night-800 dark:text-primary-300'
                    : 'border-slate-200 text-slate-500 dark:border-night-700 dark:text-slate-400'
                )}
              >
                Bank Transfer
              </button>
            </div>
          </div>

          <Input
            label="Amount (EGP)"
            type="number"
            min={1}
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder={hasDebt ? `Suggested: ${formatCurrency(outstandingBalance)}` : 'Enter any positive amount'}
            hint={
              hasDebt
                ? overpayCredit > 0
                  ? `Pays your ${formatCurrency(outstandingBalance)} debt and credits ${formatCurrency(overpayCredit)} to your wallet.`
                  : 'Goes 100% toward your outstanding debt.'
                : `Credits the full amount to your wallet balance.`
            }
          />

          <Button
            onClick={handlePayment}
            isLoading={isPaying}
            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
            fullWidth
          >
            {paymentAmount
              ? mode === 'settle'
                ? `Pay ${formatCurrency(parseFloat(paymentAmount))}`
                : `Top up ${formatCurrency(parseFloat(paymentAmount))}`
              : mode === 'settle'
                ? 'Pay now'
                : 'Top up'}
          </Button>
        </div>
      </Card>

      <Card padding="lg" className="bg-slate-50 dark:bg-night-800">
        <h3 className="mb-2 flex items-center gap-2 font-semibold">
          <Clock className="h-4 w-4" />
          Payment information
        </h3>
        <ul className="list-inside list-disc space-y-1 text-xs text-muted">
          <li>5% commission is deducted from each completed tour.</li>
          <li>Outstanding balance must be paid within 30 days.</li>
          <li>After 30 days, your account may be suspended.</li>
          <li>Once suspended, you cannot accept new bookings.</li>
          <li>Your account is reactivated automatically after full payment.</li>
          <li>You can pay more than your dues — the surplus is credited to your wallet balance.</li>
        </ul>
      </Card>
    </div>
  )
}
