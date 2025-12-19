import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { UserRole } from '@prisma/client';

const secretKey = process.env.SESSION_SECRET || 'your-secret-key-at-least-32-chars-long';
const key = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName?: string;
  avatarUrl?: string;
  expiresAt: Date;
}

export async function encrypt(payload: Omit<SessionPayload, 'expiresAt'>) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return new SignJWT({ ...payload, expiresAt })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function decrypt(token: string | undefined = undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function createSession(userId: string, email: string, role: UserRole, fullName?: string, avatarUrl?: string) {
  const session = await encrypt({ userId, email, role, fullName, avatarUrl });

  (await cookies()).set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    sameSite: 'lax',
    path: '/',
  });
}

export async function verificationSession() {
  const cookie = (await cookies()).get('session')?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    return null;
  }

  return { isAuth: true, userId: session.userId, user: session };
}

export async function deleteSession() {
  (await cookies()).delete('session');
}

export async function updateSession(data: Partial<SessionPayload>) {
  const session = await verificationSession();
  if (!session) return null;
  
  const newPayload = { ...session.user, ...data };
  // Clean up exp/iat if present in data spread (though Omit should handle it if typed strictly) but safe to just re-encrypt relevant fields
  
  await createSession(
    newPayload.userId, 
    newPayload.email, 
    newPayload.role, 
    newPayload.fullName, 
    newPayload.avatarUrl
  );
}
