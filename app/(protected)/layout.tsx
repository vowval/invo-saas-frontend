import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

type JwtPayload = {
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
};

function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Payload = token.split('.')[1];
    const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  // 🔒 Not logged in → login
  if (!token) {
    redirect('/login');
  }

  const decoded = decodeJwt(token);

  // 🚫 Super admin must not see normal dashboard
  if (decoded?.role === 'SUPER_ADMIN') {
    redirect('/super-admin/companies');
  }

  return <>{children}</>;
}
