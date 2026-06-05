import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { pool, initDB } from "@/lib/db"
import bcrypt from "bcrypt"

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

        try {
          // Check Admin first
          const [userRows] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [credentials.email]
          ) as any[];

          const user = userRows[0];

          if (user && user.password) {
            const isValid = await bcrypt.compare(credentials.password, user.password)
            if (isValid) {
              return {
                id: user.id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
              }
            }
          }

          // If not Admin, check Employees by email, phone, or employee_id
          const [empRows] = await pool.query(
            'SELECT * FROM employees WHERE email = ? OR phone = ? OR employee_id = ?',
            [credentials.email, credentials.email, credentials.email]
          ) as any[];
          
          const employee = empRows[0];
          
          if (employee && employee.password) {
             const isEmpValid = await bcrypt.compare(credentials.password, employee.password)
             if (isEmpValid) {
                return {
                  id: employee.id.toString(),
                  email: employee.email || employee.phone || employee.employee_id,
                  name: employee.name,
                  role: 'employee',
                  employee_id: employee.employee_id
                }
             }
          }

          throw new Error("Invalid credentials")
        } catch (error: any) {
          console.error("Database error in authorize:", error)
          if (error.message === "Invalid credentials") {
             throw error;
          }
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
  },
  secret: process.env.NEXTAUTH_SECRET,
}
