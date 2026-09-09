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

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies(); // ✅ MUST await
  const token = cookieStore.get('token')?.value;

  if (token) {
    const decoded = decodeJwt(token);

    if (decoded?.role === 'SUPER_ADMIN') {
      redirect('/super-admin/companies');
    }

    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-white/10 bg-slate-950/95 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <a href="/login" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-lg font-black shadow-lg shadow-indigo-900/40">
              D
            </span>
            <span>
              <span className="block text-base font-bold tracking-tight">DyeFlow</span>
              <span className="block text-xs text-slate-400">Dyeing factory invoicing</span>
            </span>
          </a>
          <span className="hidden text-xs text-slate-400 sm:block">
            Secure workspace for Indian job-work operations
          </span>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-white/10 bg-slate-950 text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} DyeFlow. All rights reserved.</span>
          <span>
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-cyan-300 hover:text-white">Terms &amp; Conditions</a>.
          </span>
        </div>
      </footer>
    </div>
  );
}
