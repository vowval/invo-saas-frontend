'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout, Spin } from 'antd';
import Navigation from '@/components/Navigation';

type JwtPayload = {
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
};

function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Payload = token.split('.')[1];
    const payload = atob(base64Payload);
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    const decoded = decodeJwt(token);

    // 🚫 Super admin must not see factory-admin dashboard
    if (decoded?.role === 'SUPER_ADMIN') {
      router.push('/super-admin/companies');
      return;
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Layout.Sider width={256} style={{ minHeight: '100vh', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Spin />
          </div>
        </Layout.Sider>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navigation />
      <Layout style={{ marginLeft: 256 }}>
        <Layout.Content
          style={{
            padding: '24px',
            background: '#f5f5f5',
            minHeight: '100vh',
          }}
        >
          {children}
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
