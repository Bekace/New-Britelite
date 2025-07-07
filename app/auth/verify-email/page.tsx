"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Monitor, CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error")
        setMessage("Invalid verification link")
        return
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const result = await response.json()

        if (result.success) {
          setStatus("success")
          setMessage(result.message || "Email verified successfully!")
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/auth/login")
          }, 3000)
        } else {
          setStatus("error")
          setMessage(result.error || "Email verification failed")
        }
      } catch (error) {
        setStatus("error")
        setMessage("Network error. Please try again.")
      }
    }

    verifyEmail()
  }, [token, router])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <Monitor className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Digital Signage</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Email Verification</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              {status === "loading" && (
                <>
                  <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Verifying your email...</h3>
                  <p className="mt-2 text-sm text-gray-600">Please wait while we verify your email address.</p>
                </>
              )}

              {status === "success" && (
                <>
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Email Verified Successfully!</h3>
                  <p className="mt-2 text-sm text-gray-600">{message}</p>
                  <p className="mt-4 text-sm text-gray-500">You'll be redirected to the login page shortly.</p>
                  <div className="mt-6">
                    <Link href="/auth/login">
                      <Button className="bg-blue-600 hover:bg-blue-700">Continue to Login</Button>
                    </Link>
                  </div>
                </>
              )}

              {status === "error" && (
                <>
                  <XCircle className="mx-auto h-12 w-12 text-red-500" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Verification Failed</h3>
                  <p className="mt-2 text-sm text-gray-600">{message}</p>
                  <div className="mt-6 space-y-3">
                    <Link href="/auth/login">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">Go to Login</Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button variant="outline" className="w-full bg-transparent">
                        Create New Account
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
