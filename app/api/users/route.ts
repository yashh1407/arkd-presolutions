import { NextResponse } from 'next/server';
import { pool, initDB } from '@/lib/db';

export async function GET() {
  try {
    // 1. Initialize the database automatically if it hasn't been set up yet.
    // This is safe because dbInitialized flag in lib/db.ts prevents redundant executions.
    await initDB();

    // 2. Execute raw SQL query using the connection pool
    const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');

    // 3. Return the result as JSON
    return NextResponse.json({
      success: true,
      data: rows
    });

  } catch (error: any) {
    console.error('[API /api/users] Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users.', details: error.message },
      { status: 500 }
    );
  }
}
