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

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    const decoded = decodeJwt(token);

    if (decoded?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }

    // Load sidebar state
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    }

    // Listen for sidebar changes
    const handleStorageChange = () => {
      const newState = localStorage.getItem('sidebarCollapsed');
      if (newState !== null) {
        setSidebarCollapsed(JSON.parse(newState));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    setLoading(false);

    return () => window.removeEventListener('storage', handleStorageChange);
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

  const marginLeft = sidebarCollapsed ? 64 : 256;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navigation />
      <Layout style={{ marginLeft, transition: 'margin-left 0.3s ease' }}>
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
