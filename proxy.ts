import { NextRequest, NextResponse } from 'next/server';
export function proxy(request: NextRequest) {
 const existing = request.cookies.get('city-visitor')?.value;
 if (existing && /^[a-f0-9]{64}$/.test(existing)) return NextResponse.next();
 const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
 const headers = new Headers(request.headers);
 const cookies = request.cookies.getAll().filter(c => c.name !== 'city-visitor').map(c => `${c.name}=${c.value}`);
 headers.set('cookie', [...cookies, `city-visitor=${token}`].join('; '));
 const response = NextResponse.next({ request: { headers } });
 response.cookies.set('city-visitor', token, { httpOnly: true, secure: request.nextUrl.protocol === 'https:', sameSite: 'lax', path: '/', maxAge: 60*60*24*365 });
 return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.svg|.*\\.(?:webp|png|jpg|svg)$).*)'] };
