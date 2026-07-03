import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { pool, initDB } from "@/lib/db"
import bcrypt from "bcrypt"
import { headers } from "next/headers"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Username / Email", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password")
        }

        // Ensure database is initialized and seeded before checking credentials
        await initDB()

        // Get client IP address for brute-force protection
        let ipAddress = "127.0.0.1"
        try {
          const headersList = await headers()
          ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || "127.0.0.1"
        } catch (e) {
          console.warn("Could not retrieve request headers for IP tracking:", e)
        }

        // 1. Check if the IP or Email is currently locked out (exceeded 5 failed attempts in the last 15 minutes)
        try {
          const [attempts] = await pool.query(
            `SELECT COUNT(*) as failedCount 
             FROM login_attempts 
             WHERE (ip_address = ? OR email = ?) 
               AND attempt_time > NOW() - INTERVAL 15 MINUTE 
               AND success = 0`,
            [ipAddress, credentials.email]
          ) as any[]

          const failedCount = attempts[0]?.failedCount || 0
          if (failedCount >= 5) {
            throw new Error("Too many failed login attempts. Please try again in 15 minutes.")
          }
        } catch (error: any) {
          if (error.message.includes("Too many failed")) {
            throw error
          }
          console.error("Error checking login attempts:", error)
        }

        try {
          // Check Admin first
          const [userRows] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [credentials.email]
          ) as any[]

          const user = userRows[0]

          if (user && user.password) {
            const isValid = await bcrypt.compare(credentials.password, user.password)
            if (isValid) {
              // Record successful attempt
              await pool.query(
                `INSERT INTO login_attempts (ip_address, email, success) VALUES (?, ?, 1)`,
                [ipAddress, credentials.email]
              )
              return {
                id: user.id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
              }
            }
          }

          // If not Admin, check Employees by email ONLY
          const [empRows] = await pool.query(
            'SELECT * FROM employees WHERE email = ?',
            [credentials.email]
          ) as any[]
          
          const employee = empRows[0]
          
          if (employee && employee.password) {
             const isEmpValid = await bcrypt.compare(credentials.password, employee.password)
             if (isEmpValid) {
                // Record successful attempt
                await pool.query(
                  `INSERT INTO login_attempts (ip_address, email, success) VALUES (?, ?, 1)`,
                  [ipAddress, credentials.email]
                )
                return {
                  id: employee.id.toString(),
                  email: employee.email || employee.phone || employee.employee_id,
                  name: employee.name,
                  role: 'employee',
                  employee_id: employee.employee_id
                }
             }
          }

          // If execution reaches here, credentials are invalid
          await pool.query(
            `INSERT INTO login_attempts (ip_address, email, success) VALUES (?, ?, 0)`,
            [ipAddress, credentials.email]
          )
          throw new Error("Invalid credentials")
        } catch (error: any) {
          console.error("Database error in authorize:", error)
          if (error.message === "Invalid credentials" || error.message.includes("Too many failed")) {
             throw error
          }
          // Log database/unexpected failure as failed attempt too
          await pool.query(
            `INSERT INTO login_attempts (ip_address, email, success) VALUES (?, ?, 0)`,
            [ipAddress, credentials.email]
          ).catch(() => {})
          throw new Error("Invalid credentials")
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.employee_id = user.employee_id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          employee_id: token.employee_id as string | undefined,
        }
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
