import { cookies } from 'next/headers';
import { createHash } from 'node:crypto';
export async function getVisitor() {
 const token = (await cookies()).get('city-visitor')?.value;
 if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
 return { userId: createHash('sha256').update(token).digest('hex'), displayName: 'Şehir gezgini', email: 'visitor@local', fullName: 'Şehir gezgini' };
}
