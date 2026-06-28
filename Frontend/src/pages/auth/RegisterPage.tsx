import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { useToast } from '@/context/ToastContext'
import { Button, Input, Textarea, Tabs, Card } from '@/components/ui'
import { LanguageMultiSelect } from '@/components/ui/LanguageMultiSelect'
import { getErrorMessage } from '@/api/axios'
import { Upload, X } from 'lucide-react'

// Gender values: 1 = Male, 2 = Female (as per backend)
const GENDER_OPTIONS = [
  { value: 1, label: 'Male' },
  { value: 2, label: 'Female' },
]

const COUNTRIES = [
  'Egypt', 'USA', 'UK', 'Germany', 'France', 'Italy', 'Spain',
  'UAE', 'Saudi Arabia', 'Canada', 'Australia', 'Other',
]

interface TouristFormData {
  userName: string
  email: string
  password: string
  confirmPassword: string
  age: number
  country: string
  gender: number
  languages: string[]
}

interface GuideFormData {
  userName: string
  fullName: string
  email: string
  password: string
  age: number
  country: string
  gender: number
  languages: string[]
  priceOfDay: number
  bio: string
}

export function RegisterPage() {
  const [tab, setTab] = useState('tourist')
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()
  const navigate = useNavigate()

  // Tourist Form
  const [touristForm, setTouristForm] = useState<TouristFormData>({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: 25,
    country: 'Egypt',
    gender: 1,
    languages: ['English'],
  })
  const [touristProfileImage, setTouristProfileImage] = useState<File | null>(null)
  const touristImageRef = useRef<HTMLInputElement>(null)

  // Guide Form
  const [guideForm, setGuideForm] = useState<GuideFormData>({
    userName: '',
    fullName: '',
    email: '',
    password: '',
    age: 25,
    country: 'Egypt',
    gender: 1,
    languages: ['English'],
    priceOfDay: 500,
    bio: '',
  })
  const [guideProfileImage, setGuideProfileImage] = useState<File | null>(null)
  const [guideNationalId, setGuideNationalId] = useState<File | null>(null)
  const guideProfileRef = useRef<HTMLInputElement>(null)
  const guideNationalIdRef = useRef<HTMLInputElement>(null)

  const handleTouristSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!touristForm.userName || !touristForm.email || !touristForm.password) {
      showToast('Please fill all required fields', 'error')
      return
    }
    
    if (touristForm.password.length < 8) {
      showToast('Password must be at least 8 characters', 'error')
      return
    }

    if (touristForm.password !== touristForm.confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('UserName', touristForm.userName)
      formData.append('Email', touristForm.email)
      formData.append('Password', touristForm.password)
      formData.append('ConfirmPassword', touristForm.confirmPassword)
      formData.append('Age', touristForm.age.toString())
      formData.append('Gender', touristForm.gender.toString())
      formData.append('Country', touristForm.country)
      touristForm.languages.forEach((lang) => formData.append('Languages', lang))
      if (touristProfileImage) {
        formData.append('UrlProfile', touristProfileImage)
      }

      await authApi.registerTourist(formData)
      
      // Store email for OTP verification
      sessionStorage.setItem('pendingVerificationEmail', touristForm.email)
      
      showToast('Registration successful! Please check your email for OTP', 'success')
      navigate('/verify-otp', { state: { email: touristForm.email } })
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuideSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!guideForm.userName || !guideForm.fullName || !guideForm.email || !guideForm.password) {
      showToast('Please fill all required fields', 'error')
      return
    }
    
    if (guideForm.password.length < 8) {
      showToast('Password must be at least 8 characters', 'error')
      return
    }
    
    if (!guideNationalId) {
      showToast('National ID image is required', 'error')
      return
    }
    
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('UserName', guideForm.userName)
      formData.append('FullName', guideForm.fullName)
      formData.append('Email', guideForm.email)
      formData.append('Password', guideForm.password)
      formData.append('Age', guideForm.age.toString())
      formData.append('Gender', guideForm.gender.toString())
      formData.append('Country', guideForm.country)
      guideForm.languages.forEach((lang) => formData.append('Languages', lang))
      formData.append('PriceOfDay', guideForm.priceOfDay.toString())
      formData.append('Bio', guideForm.bio)
      formData.append('NationalIdImage', guideNationalId)
      if (guideProfileImage) {
        formData.append('ProfileImageFile', guideProfileImage)
      }

      await authApi.registerGuide(formData)
      
      // Store email for OTP verification
      sessionStorage.setItem('pendingVerificationEmail', guideForm.email)
      
      showToast('Registration successful! Please check your email for OTP', 'success')
      navigate('/verify-otp', { state: { email: guideForm.email } })
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const FileUpload = ({ 
    label, 
    file, 
    onFileChange, 
    onClear, 
    required 
  }: { 
    label: string
    file: File | null
    onFileChange: () => void
    onClear: () => void
    required?: boolean
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {file ? (
        <div className="flex items-center justify-between p-3 bg-slate-100 rounded-xl">
          <span className="text-sm text-slate-600 truncate">{file.name}</span>
          <button
            type="button"
            onClick={onClear}
            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-red-500" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onFileChange}
          className="w-full p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-all text-center"
        >
          <Upload className="h-6 w-6 mx-auto text-slate-400 mb-2" />
          <span className="text-sm text-slate-500">Click to upload</span>
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl" padding="lg">
        <h1 className="text-2xl font-bold text-center mb-2">Create Account</h1>
        <p className="text-center text-slate-500 mb-6">Join Ather and start your journey</p>

        <Tabs
          tabs={[
            { id: 'tourist', label: '🧳 Tourist' },
            { id: 'guide', label: '🧭 Tour Guide' },
          ]}
          activeTab={tab}
          onChange={setTab}
          className="mb-6"
        />

        {tab === 'tourist' ? (
          <form onSubmit={handleTouristSubmit} className="space-y-4">
            <Input
              label="Username *"
              value={touristForm.userName}
              onChange={(e) => setTouristForm({ ...touristForm, userName: e.target.value })}
              required
              placeholder="Choose a username"
            />
            
            <Input
              label="Email Address *"
              type="email"
              value={touristForm.email}
              onChange={(e) => setTouristForm({ ...touristForm, email: e.target.value })}
              required
              placeholder="name@example.com"
            />
            
            <Input
              label="Password *"
              type="password"
              value={touristForm.password}
              onChange={(e) => setTouristForm({ ...touristForm, password: e.target.value })}
              required
              placeholder="At least 8 characters"
              hint="Must be at least 8 characters"
            />

            <Input
              label="Confirm Password *"
              type="password"
              value={touristForm.confirmPassword}
              onChange={(e) => setTouristForm({ ...touristForm, confirmPassword: e.target.value })}
              required
              placeholder="Re-enter your password"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Age *"
                type="number"
                value={touristForm.age}
                onChange={(e) => setTouristForm({ ...touristForm, age: Number(e.target.value) })}
                required
                min={18}
                max={100}
              />
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Gender *</label>
                <select
                  value={touristForm.gender}
                  onChange={(e) => setTouristForm({ ...touristForm, gender: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  required
                >
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Country *</label>
                <select
                  value={touristForm.country}
                  onChange={(e) => setTouristForm({ ...touristForm, country: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  required
                >
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <LanguageMultiSelect
                  label="Languages you speak"
                  value={touristForm.languages}
                  onChange={(languages) => setTouristForm({ ...touristForm, languages })}
                />
              </div>
            </div>

            <FileUpload
              label="Profile Picture"
              file={touristProfileImage}
              onFileChange={() => touristImageRef.current?.click()}
              onClear={() => setTouristProfileImage(null)}
            />
            <input
              ref={touristImageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setTouristProfileImage(e.target.files?.[0] || null)}
            />
            
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Register as Tourist
            </Button>
          </form>
        ) : (
          <form onSubmit={handleGuideSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Username *"
                value={guideForm.userName}
                onChange={(e) => setGuideForm({ ...guideForm, userName: e.target.value })}
                required
                placeholder="Choose a username"
              />
              <Input
                label="Full Name *"
                value={guideForm.fullName}
                onChange={(e) => setGuideForm({ ...guideForm, fullName: e.target.value })}
                required
                placeholder="Your full legal name"
              />
            </div>
            
            <Input
              label="Email Address *"
              type="email"
              value={guideForm.email}
              onChange={(e) => setGuideForm({ ...guideForm, email: e.target.value })}
              required
              placeholder="name@example.com"
            />
            
            <Input
              label="Password *"
              type="password"
              value={guideForm.password}
              onChange={(e) => setGuideForm({ ...guideForm, password: e.target.value })}
              required
              placeholder="At least 8 characters"
              hint="Must be at least 8 characters"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Age *"
                type="number"
                value={guideForm.age}
                onChange={(e) => setGuideForm({ ...guideForm, age: Number(e.target.value) })}
                required
                min={18}
                max={100}
              />
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Gender *</label>
                <select
                  value={guideForm.gender}
                  onChange={(e) => setGuideForm({ ...guideForm, gender: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  required
                >
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Country *</label>
                <select
                  value={guideForm.country}
                  onChange={(e) => setGuideForm({ ...guideForm, country: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  required
                >
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <LanguageMultiSelect
                  label="Languages you speak"
                  value={guideForm.languages}
                  onChange={(languages) => setGuideForm({ ...guideForm, languages })}
                />
              </div>
            </div>
            
            <Input
              label="Price per Day (EGP) *"
              type="number"
              value={guideForm.priceOfDay}
              onChange={(e) => setGuideForm({ ...guideForm, priceOfDay: Number(e.target.value) })}
              required
              min={1}
              placeholder="e.g., 500"
            />
            
            <Textarea
              label="Bio / Experience *"
              value={guideForm.bio}
              onChange={(e) => setGuideForm({ ...guideForm, bio: e.target.value })}
              required
              rows={3}
              placeholder="Tell us about your guiding experience..."
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FileUpload
                label="Profile Picture"
                file={guideProfileImage}
                onFileChange={() => guideProfileRef.current?.click()}
                onClear={() => setGuideProfileImage(null)}
              />
              <FileUpload
                label="National ID Image *"
                file={guideNationalId}
                onFileChange={() => guideNationalIdRef.current?.click()}
                onClear={() => setGuideNationalId(null)}
                required
              />
            </div>
            <input
              ref={guideProfileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setGuideProfileImage(e.target.files?.[0] || null)}
            />
            <input
              ref={guideNationalIdRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setGuideNationalId(e.target.files?.[0] || null)}
            />
            
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Register as Guide
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </Card>
    </div>
  )
}