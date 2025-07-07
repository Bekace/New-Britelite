import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is required")
}

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@yourdomain.com"
const APP_NAME = "Digital Signage Platform"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export const emailService = {
  sendVerificationEmail: async (email: string, token: string, firstName: string) => {
    try {
      const verificationUrl = `${APP_URL}/auth/verify-email?token=${token}`

      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [email],
        subject: `Welcome to ${APP_NAME} - Verify Your Email`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Welcome to ${APP_NAME}</h1>
            <p>Hi ${firstName},</p>
            <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email
            </a>
            <p>If the button doesn't work, copy and paste this link: ${verificationUrl}</p>
          </div>
        `,
      })

      if (error) {
        console.error("Email sending error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Email service error:", error)
      return { success: false, error: "Failed to send verification email" }
    }
  },

  sendPasswordResetEmail: async (email: string, token: string, firstName: string) => {
    try {
      const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`

      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [email],
        subject: `${APP_NAME} - Password Reset Request`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Password Reset Request</h1>
            <p>Hi ${firstName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetUrl}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
            <p>If the button doesn't work, copy and paste this link: ${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
          </div>
        `,
      })

      if (error) {
        console.error("Email sending error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Email service error:", error)
      return { success: false, error: "Failed to send password reset email" }
    }
  },
}
