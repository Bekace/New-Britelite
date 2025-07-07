"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Monitor, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    // Validate token on page load
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false)
        setError("Invalid reset link")
        return
      }

      try {
        const response = await fetch("/api/auth/validate-reset-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })

        const result = await response.json()
        setTokenValid(result.valid)

        if (!result.valid) {
          setError(result.error || "Invalid or expired reset link")
        }
      } catch (error) {
        setTokenValid(false)
        setError("Failed to validate reset link")
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/auth/login")
        }, 3000)
      } else {
        setError(result.error || "Password reset failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  // Loading state while validating token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Validating reset link...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Password Reset Successfully!</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Your password has been updated. You'll be redirected to the login page shortly.
                </p>
                <div className="mt-6">
                  <Link href="/auth/login">
                    <Button className="bg-blue-600 hover:bg-blue-700">Continue to Login</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Invalid token state
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <Monitor className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Digital Signage</span>
            </div>
          </div>
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Invalid Reset Link</h3>
                <p className="mt-2 text-sm text-gray-600">{error}</p>
                <div className="mt-6 space-y-3">
                  <Link href="/auth/forgot-password">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">Request New Reset Link</Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button variant="outline" className="w-full bg-transparent">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Main reset password form
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <Monitor className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Digital Signage</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Reset your password</h2>
        <p className="mt-2 text-center text-sm text-gray-600">Enter your new password below</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Create new password</CardTitle>
            <CardDescription>Your new password must be at least 8 characters long</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? "Resetting password..." : "Reset password"}
              </Button>

              <div className="text-center">
                <Link href="/auth/login" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
