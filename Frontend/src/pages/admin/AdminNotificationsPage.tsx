import { useState } from 'react'
import { Send, Bell, Users, UserCheck, Globe } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { Button, Card, Input, Textarea, Badge } from '@/components/ui'
import { getErrorMessage } from '@/api/axios'
import { useToast } from '@/context/ToastContext'

type NotificationTarget = 0 | 1 | 2 // 0: All, 1: Tourists, 2: Guides

const TARGET_OPTIONS: { value: NotificationTarget; label: string; icon: typeof Globe; color: string }[] = [
  { value: 0, label: 'All Users', icon: Globe, color: 'bg-purple-500' },
  { value: 1, label: 'Tourists Only', icon: Users, color: 'bg-cyan-500' },
  { value: 2, label: 'Guides Only', icon: UserCheck, color: 'bg-emerald-500' },
]

export function AdminNotificationsPage() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [target, setTarget] = useState<NotificationTarget>(0)
  const [isSending, setIsSending] = useState(false)
  const { showToast } = useToast()

  const handleSend = async () => {
    if (!title.trim()) {
      showToast('Please enter a notification title', 'error')
      return
    }
    if (!message.trim()) {
      showToast('Please enter a notification message', 'error')
      return
    }

    setIsSending(true)
    try {
      await adminApi.sendBroadcastNotification({
        title: title.trim(),
        message: message.trim(),
        target,
      })
      
      showToast('Notification sent successfully!', 'success')
      setTitle('')
      setMessage('')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Bell className="h-7 w-7 text-primary-700" />
        Send Broadcast Notification
      </h1>

      <Card className="p-6">
        <p className="text-slate-500 mb-6 text-sm">
          Send instant notifications to all users or specific user groups. 
          Notifications will be delivered in real-time to online users.
        </p>

        {/* Target Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">Send to:</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TARGET_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setTarget(option.value)}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  target === option.value
                    ? `${option.color} text-white border-transparent`
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <option.icon className="h-4 w-4" />
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Special Announcement, New Feature, Promo Code..."
            className="w-full"
          />
        </div>

        {/* Message Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">
            Message <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your notification message here..."
            rows={5}
            className="w-full"
          />
          <p className="text-xs text-slate-400 mt-1">
            {message.length} characters
          </p>
        </div>

        {/* Preview Card */}
        <div className="mb-6 p-4 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-400 mb-2">Preview:</p>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="h-4 w-4 text-primary-600" />
              <span className="font-semibold text-sm">{title || 'Notification Title'}</span>
              <Badge variant="primary" className="text-xs">
                {TARGET_OPTIONS.find(o => o.value === target)?.label || 'All Users'}
              </Badge>
            </div>
            <p className="text-sm text-slate-600">
              {message || 'Your notification message will appear here...'}
            </p>
            <p className="text-xs text-slate-400 mt-2">Just now</p>
          </div>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={isSending || !title.trim() || !message.trim()}
          className="w-full"
          size="lg"
        >
          {isSending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Notification
            </>
          )}
        </Button>
      </Card>

      {/* Info Card */}
      <Card className="mt-6 p-6 bg-slate-50">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary-600" />
          About Broadcast Notifications
        </h3>
        <ul className="text-sm text-slate-500 space-y-1 list-disc list-inside">
          <li>Notifications are sent in real-time via SignalR</li>
          <li>Users receive notifications instantly if they are online</li>
          <li>Offline users will see notifications when they log in</li>
          <li>All notifications are saved and can be viewed in the user's notification center</li>
          <li>Users can mark notifications as read</li>
        </ul>
      </Card>
    </div>
  )
}