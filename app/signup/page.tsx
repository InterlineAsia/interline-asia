'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    industry: '',
    credentials: '',
    password: '',
    confirmPassword: '',
    terms: false,
    marketing: false
  })

  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])
    setSuccess('')
    setIsSubmitting(true)

    // Basic validation
    const newErrors: string[] = []
    
    if (!formData.firstName.trim()) newErrors.push('First name is required')
    if (!formData.lastName.trim()) newErrors.push('Last name is required')
    if (!formData.email.trim()) newErrors.push('Email is required')
    if (!formData.company.trim()) newErrors.push('Company name is required')
    if (!formData.position.trim()) newErrors.push('Position is required')
    if (!formData.industry) newErrors.push('Industry type is required')
    if (!formData.password) newErrors.push('Password is required')
    if (formData.password !== formData.confirmPassword) newErrors.push('Passwords do not match')
    if (!formData.terms) newErrors.push('You must agree to the Terms & Conditions')

    if (newErrors.length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    try {
      // Here you would integrate with your actual signup API
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setSuccess('Account created successfully! You will receive an email confirmation shortly. Our team will review your application within 24-48 hours.')
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        industry: '',
        credentials: '',
        password: '',
        confirmPassword: '',
        terms: false,
        marketing: false
      })

      // Redirect after delay
      setTimeout(() => {
        window.location.href = '/login.html?signup=success'
      }, 3000)

    } catch (error) {
      setErrors(['An unexpected error occurred. Please try again.'])
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/images/signup-bg.jpg"
          alt="Cruise ship and ocean view"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ocean-900/90 to-ocean-800/90"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 font-display">
            Join Interline Asia
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Create your account to access exclusive cruise experiences at unbeatable interline rates.
            <strong className="block mt-2">For verified travel industry professionals only.</strong>
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-12">
          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-800">
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-green-800">
                <h4 className="font-semibold mb-2">Account Created Successfully!</h4>
                <p>{success}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-colors"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Industry Information */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Industry Verification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company/Agency Name *
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                    Position/Title *
                  </label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-colors"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                    Industry Type *
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-colors"
                    required
                  >
                    <option value="">Select your industry</option>
                    <option value="travel-agent">Travel Agent</option>
                    <option value="airline">Airline Employee</option>
                    <option value="cruise">Cruise Line Employee</option>
                    <option value="hotel">Hotel/Hospitality</option>
                    <option value="tour-operator">Tour Operator</option>
                    <option value="travel-consultant">Travel Consultant</option>
                    <option value="other">Other Travel Industry</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="credentials" className="block text-sm font-medium text-gray-700 mb-2">
                    Industry Credentials/License Number
                  </label>
                  <input
                    type="text"
                    id="credentials"
                    name="credentials"
                    value={formData.credentials}
                    onChange={handleInputChange}
                    placeholder="e.g., IATA number, license number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-colors"
                  />
                  <p className="text-sm text-gray-500 mt-1">This helps us verify your industry status faster</p>
                </div>
              </div>
            </div>

            {/* Account Security */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Account Security
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-colors"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Minimum 8 characters with letters and numbers</p>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-ocean-600 focus:ring-ocean-500 border-gray-300 rounded"
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  I agree to the{' '}
                  <Link href="/terms-and-conditions.html" className="text-ocean-600 hover:text-ocean-700 underline">
                    Terms & Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy-policy.html" className="text-ocean-600 hover:text-ocean-700 underline">
                    Privacy Policy
                  </Link>{' '}
                  *
                </label>
              </div>
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="marketing"
                  name="marketing"
                  checked={formData.marketing}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-ocean-600 focus:ring-ocean-500 border-gray-300 rounded"
                />
                <label htmlFor="marketing" className="text-sm text-gray-700">
                  I would like to receive exclusive cruise deals and industry updates via email
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary text-lg px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-6">
              Already have an account?{' '}
              <Link href="/login.html" className="text-ocean-600 hover:text-ocean-700 font-semibold">
                Sign in here
              </Link>
            </p>

            <div className="bg-ocean-50 border border-ocean-200 rounded-lg p-6 flex items-start space-x-4">
              <div className="text-2xl">🔒</div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 mb-2">Verification Required</h4>
                <p className="text-gray-600 text-sm">
                  All accounts require industry verification before accessing exclusive deals.
                  Our team will review your application within 24-48 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}