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
    const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    // 🔒 Not logged in → login
    if (!token) {
      router.push('/login');
      return;
    }

    const decoded = decodeJwt(token);

    // 🚫 Only super admin can access this
    if (decoded?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin />
      </div>
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
