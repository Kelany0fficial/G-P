import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { touristsApi } from '@/api/tourists'
import { guidesApi } from '@/api/guides'
import { Avatar, Button, Card, Input, ListSkeleton, useToast } from '@/components/ui'
import { LanguageMultiSelect } from '@/components/ui/LanguageMultiSelect'
import { getErrorMessage } from '@/api/axios'
import type { TouristProfile, GuideDetails } from '@/types'
import { Link } from 'react-router-dom'
import { Camera, Compass, Sparkles, Wallet } from 'lucide-react'

export function ProfilePage() {
  const { user, hasRole, updateUser } = useAuth()
  const [profile, setProfile] = useState<TouristProfile | GuideDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { showToast } = useToast()

  const [touristForm, setTouristForm] = useState({
    userName: '',
    country: '',
    languages: [] as string[],
    age: 0,
  })

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true)
      try {
        if (hasRole('Tourist')) {
          const data = await touristsApi.getMyProfile()
          setProfile(data)
          setTouristForm({
            userName: data.userName || '',
            country: data.country || '',
            languages:
              (data as TouristProfile).languages && (data as TouristProfile).languages!.length > 0
                ? (data as TouristProfile).languages!
                : data.language
                  ? data.language.split(',').map((x) => x.trim()).filter(Boolean)
                  : [],
            age: data.age || 0,
          })
        } else if (hasRole('Guide')) {
          const data = await guidesApi.getMyProfile()
          setProfile(data)
        }
      } catch (err) {
        showToast(getErrorMessage(err), 'error')
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
  }, [hasRole, showToast])

  const handleTouristSave = async () => {
    setIsSaving(true)
    try {
      await touristsApi.updateProfile({
        userName: touristForm.userName,
        country: touristForm.country,
        languages: touristForm.languages,
        age: touristForm.age,
      })
      showToast('Profile updated successfully.', 'success')
      const updated = await touristsApi.getMyProfile()
      setProfile(updated)
      updateUser({ userName: touristForm.userName })
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
      const newImageUrl = hasRole('Tourist')
        ? await touristsApi.updateProfileImage(file)
        : await guidesApi.updateProfileImage(file)
      setProfile((prev) => (prev ? { ...prev, profileImageUrl: newImageUrl } : prev))
      updateUser({ profileImageUrl: newImageUrl })
      showToast('Profile picture updated.', 'success')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container-app py-8">
        <ListSkeleton />
      </div>
    )
  }

  const roleLabel =
    user?.role === 'Tourist' ? 'Tourist' : user?.role === 'Guide' ? 'Tour Guide' : 'Admin'

  return (
    <div className="container-app py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">My Profile</h1>
        <div className="mt-2 h-[2px] w-12 rounded-full bg-gradient-to-r from-gold-400 to-transparent" />
      </div>

      <Card padding="lg">
        <div className="mb-6 flex flex-col items-center">
          <div className="relative">
            <Avatar
              src={profile?.profileImageUrl}
              name={user?.userName || 'User'}
              size="xl"
              className="ring-4 ring-gold-100 dark:ring-night-700"
            />
            <label
              className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-gold-500 p-2 text-white shadow-md shadow-gold-900/30 transition-colors hover:bg-gold-600"
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
          <h2 className="mt-4 text-lg font-bold text-[var(--text-primary)]">{user?.userName}</h2>
          <p className="text-sm text-muted">{user?.email}</p>
          <span className="mt-2 inline-flex rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-800 dark:bg-night-800 dark:text-primary-300">
            {roleLabel}
          </span>
        </div>

        {hasRole('Guide') && (
          <Link to="/guide/profile" className="mb-4 block">
            <Button variant="outline" fullWidth>
              Guide Settings &amp; Pricing
            </Button>
          </Link>
        )}

        {hasRole('Tourist') && (
          <div className="space-y-4">
            <Input
              label="Username"
              value={touristForm.userName}
              onChange={(e) => setTouristForm({ ...touristForm, userName: e.target.value })}
            />
            <Input
              label="Country"
              value={touristForm.country}
              onChange={(e) => setTouristForm({ ...touristForm, country: e.target.value })}
            />
            <LanguageMultiSelect
              label="Languages you speak"
              hint="Pick all that apply — guides see these to match with you."
              value={touristForm.languages}
              onChange={(languages) => setTouristForm({ ...touristForm, languages })}
            />
            <Input
              label="Age"
              type="number"
              min={12}
              max={120}
              value={touristForm.age}
              onChange={(e) => setTouristForm({ ...touristForm, age: Number(e.target.value) })}
            />
            <Button onClick={handleTouristSave} isLoading={isSaving} fullWidth>
              Save Changes
            </Button>
          </div>
        )}
      </Card>

      {/* Role-aware quick links */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {hasRole('Tourist') && (
          <>
            <Link to="/bookings">
              <Button variant="outline" fullWidth>
                <Compass className="h-4 w-4" />
                My Bookings
              </Button>
            </Link>
            <Link to="/plans">
              <Button variant="outline" fullWidth>
                <Sparkles className="h-4 w-4" />
                My Plans
              </Button>
            </Link>
          </>
        )}
        {/* Guides do NOT have a Stories tab in their profile */}
        {hasRole('Guide') && (
          <>
            <Link to="/guide/bookings">
              <Button variant="outline" fullWidth>
                <Compass className="h-4 w-4" />
                Manage Bookings
              </Button>
            </Link>
            <Link to="/guide/wallet">
              <Button variant="outline" fullWidth>
                <Wallet className="h-4 w-4" />
                Wallet
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
