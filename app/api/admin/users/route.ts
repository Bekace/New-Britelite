import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Use DISTINCT and proper JOIN to avoid duplicates
    const users = await sql`
      SELECT DISTINCT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.business_name,
        u.is_email_verified,
        u.is_active,
        u.created_at,
        p.name as plan_name,
        (
          SELECT MAX(created_at) 
          FROM user_sessions us 
          WHERE us.user_id = u.id
        ) as last_seen
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      ORDER BY u.created_at DESC
    `

    return NextResponse.json({
      success: true,
      users: users,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, first_name, last_name, role, business_name, plan_id } = body

    // Validate required fields
    if (!email || !first_name || !last_name) {
      return NextResponse.json(
        { success: false, error: "Email, first name, and last name are required" },
        { status: 400 },
      )
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ success: false, error: "User with this email already exists" }, { status: 400 })
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Create user
    const userId = uuidv4()
    const finalPlanId = plan_id === "no-plan" ? null : plan_id

    await sql`
      INSERT INTO users (
        id, email, password_hash, first_name, last_name, 
        role, business_name, plan_id, is_email_verified, is_active
      ) VALUES (
        ${userId}, ${email}, ${hashedPassword}, ${first_name}, ${last_name},
        ${role}, ${business_name || null}, ${finalPlanId}, false, true
      )
    `

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      tempPassword: tempPassword,
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 })
  }
}
