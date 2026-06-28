import { useEffect, useState } from 'react'
import { Camera } from 'lucide-react'
import { guidesApi } from '@/api/guides'
import { Avatar, Button, Card, Input, Textarea } from '@/components/ui'
import { LanguageMultiSelect } from '@/components/ui/LanguageMultiSelect'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { getErrorMessage } from '@/api/axios'
import type { GuideDetails } from '@/types'

export function GuideProfilePage() {
  const [profile, setProfile] = useState<GuideDetails | null>(null)
  const [form, setForm] = useState({
    bio: '',
    languages: [] as string[],
    priceOfDay: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { showToast } = useToast()
  const { updateUser } = useAuth()

  useEffect(() => {
    guidesApi
      .getMyProfile()
      .then((data) => {
        setProfile(data)
        setForm({
          bio: data.bio || '',
          languages:
            data.languages && data.languages.length > 0
              ? data.languages
              : data.language
                ? data.language.split(',').map((x) => x.trim()).filter(Boolean)
                : [],
          priceOfDay: data.priceOfDay || 0,
        })
      })
      .catch((err) => showToast(getErrorMessage(err), 'error'))
      .finally(() => setIsLoading(false))
  }, [showToast])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await guidesApi.updateProfile({
        bio: form.bio,
        languages: form.languages,
        priceOfDay: form.priceOfDay,
      })
      showToast('Profile updated successfully.', 'success')
      const updated = await guidesApi.getMyProfile()
      setProfile(updated)
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const imageUrl = await guidesApi.updateProfileImage(file)
      setProfile((prev) => (prev ? { ...prev, profileImageUrl: imageUrl } : prev))
      updateUser({ profileImageUrl: imageUrl })
      showToast('Profile picture updated.', 'success')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container-app max-w-lg py-8">
        <div className="text-center text-muted">Loading profile…</div>
      </div>
    )
  }

  return (
    <div className="container-app max-w-lg py-8">
      <h1 className="mb-6 text-2xl font-bold">Guide Profile &amp; Settings</h1>

      <Card padding="lg">
        <div className="mb-6 flex flex-col items-center">
          <div className="relative">
            <Avatar
              src={profile?.profileImageUrl}
              name={profile?.name || 'Guide'}
              size="xl"
              className="ring-4 ring-primary-100 dark:ring-night-700"
            />
            <label
              className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-primary-600 p-2 text-white transition-colors hover:bg-primary-700 shadow-md shadow-primary-900/30"
              aria-label="Change profile picture"
            >
              <Camera className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
            </label>
          </div>
          <h2 className="mt-3 text-lg font-bold">{profile?.name}</h2>
          <p className="text-sm text-muted">
            Rating: {profile?.rate ? profile.rate.toFixed(1) : 'New'} ★
          </p>
          <p className="text-sm text-muted">{profile?.completedToursCount ?? 0} completed tours</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <Textarea
            label="Bio / Experience"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell travelers about your guiding experience…"
            rows={4}
            required
          />

          <LanguageMultiSelect
            label="Languages you speak"
            hint="Travelers filter guides by their spoken languages."
            value={form.languages}
            onChange={(languages) => setForm({ ...form, languages })}
          />

          <Input
            label="Price per Day (EGP)"
            type="number"
            min={1}
            step={50}
            value={form.priceOfDay}
            onChange={(e) => setForm({ ...form, priceOfDay: Number(e.target.value) })}
            required
          />

          <Button type="submit" isLoading={isSaving} fullWidth>
            Save Changes
          </Button>
        </form>
      </Card>
    </div>
  )
}
