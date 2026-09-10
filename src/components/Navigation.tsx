'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Layout,
  Menu,
  Dropdown,
  Avatar,
  Spin,
  message,
} from 'antd';
import {
  DashboardOutlined,
  SettingOutlined,
  LogoutOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
  CopyOutlined,
  FormatPainterOutlined,
  AppstoreOutlined,
  PicCenterOutlined,
  SoundOutlined,
  DatabaseOutlined,
  SafetyOutlined,
  UserOutlined,
  DropboxOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | null;

interface DecodedToken {
  role?: UserRole;
  userId?: string;
  companyId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Navigation Component
 * Full-height scrollable sidebar with logo always visible
 */
export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('User');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openMenuKeys, setOpenMenuKeys] = useState<string[]>([]);

  useEffect(() => {
    // Decode JWT from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Payload = token.split('.')[1];
        const payload = atob(base64Payload);
        const decoded: DecodedToken = JSON.parse(payload);
        setRole(decoded.role as UserRole || 'STAFF');
        setUserName(localStorage.getItem('userName') || 'User');
      } catch (error) {
        console.error('Failed to decode token:', error);
        setRole('STAFF');
      }
    }
    
    // Load sidebar state from localStorage
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState !== null) {
      setSidebarCollapsed(JSON.parse(savedSidebarState));
    }
    
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    message.success('Logged out successfully');
    router.push('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link href="/factory-admin/settings">Settings</Link>,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  // ==========================================
  // SUPER ADMIN MENU
  // ==========================================
  const superAdminMenu = [
    {
      key: 'super-admin',
      icon: <SafetyOutlined />,
      label: 'Platform Admin',
      children: [
        {
          key: 'companies',
          icon: <DropboxOutlined />,
          label: <Link href="/super-admin/companies">Companies</Link>,
        },
        {
          key: 'plans',
          icon: <FormatPainterOutlined />,
          label: <Link href="/super-admin/plans">Subscription Plans</Link>,
        },
        {
          key: 'process-master',
          icon: <CopyOutlined />,
          label: <Link href="/super-admin/process-master">Process Master</Link>,
        },
      ],
    },
  ];

  // ==========================================
  // FACTORY ADMIN MENU
  // ==========================================
  const factoryAdminMenu = [
    {
      key: 'main',
      label: 'Main',
      children: [
        {
          key: 'dashboard',
          icon: <DashboardOutlined />,
          label: <Link href="/dashboard">Dashboard</Link>,
        },
      ],
    },
    {
      key: 'receiving',
      label: 'Receiving',
      children: [
        {
          key: 'fabric-receiving',
          icon: <ShoppingCartOutlined />,
          label: <Link href="/fabric-receiving">Fabric Receiving</Link>,
        },
        {
          key: 'fabric-inspection',
          icon: <SafetyOutlined />,
          label: <Link href="/fabric-inspection">Fabric Inspection</Link>,
        },
      ],
    },
    {
      key: 'operations',
      label: 'Operations',
      children: [
        {
          key: 'process-route-builder',
          icon: <CopyOutlined />,
          label: <Link href="/process-route-builder">Process Route</Link>,
        },
        {
          key: 'dyeing-jobs',
          icon: <ShoppingCartOutlined />,
          label: <Link href="/dyeing-jobs">Dyeing Jobs</Link>,
        },
        {
          key: 'washing-execution',
          icon: <AppstoreOutlined />,
          label: <Link href="/washing-execution">Washing Execution</Link>,
        },
        {
          key: 'dyeing-execution',
          icon: <FormatPainterOutlined />,
          label: <Link href="/dyeing-execution">Dyeing Execution</Link>,
        },
        {
          key: 'drying-execution',
          icon: <AppstoreOutlined />,
          label: <Link href="/drying-execution">Drying Execution</Link>,
        },
        {
          key: 'finishing-execution',
          icon: <AppstoreOutlined />,
          label: <Link href="/finishing-execution">Finishing Execution</Link>,
        },
        {
          key: 'quality-control',
          icon: <SafetyOutlined />,
          label: <Link href="/quality-control">Quality Control</Link>,
        },
      ],
    },
    {
      key: 'process-config',
      label: 'Process Configuration',
      children: [
        {
          key: 'process-master',
          icon: <CopyOutlined />,
          label: <Link href="/factory-admin/process-master">Process Master</Link>,
        },
        {
          key: 'machines',
          icon: <SoundOutlined />,
          label: <Link href="/machines">Machines</Link>,
        },
        {
          key: 'recipes',
          icon: <DatabaseOutlined />,
          label: <Link href="/recipes">Recipes</Link>,
        },
        {
          key: 'chemicals',
          icon: <PlusCircleOutlined />,
          label: <Link href="/chemicals">Chemicals</Link>,
        },
      ],
    },
    {
      key: 'management',
      label: 'Management',
      children: [
        {
          key: 'customers',
          icon: <TeamOutlined />,
          label: <Link href="/customers">Customers</Link>,
        },
        {
          key: 'invoices',
          icon: <FileTextOutlined />,
          label: <Link href="/invoices">Invoices</Link>,
        },
        {
          key: 'costing',
          icon: <ShoppingCartOutlined />,
          label: <Link href="/costing">Costing</Link>,
        },
        {
          key: 'lab-dips',
          icon: <AppstoreOutlined />,
          label: <Link href="/lab-dips">Lab Dips</Link>,
        },
      ],
    },
    {
      key: 'settings',
      label: 'Settings',
      children: [
        {
          key: 'user-management',
          icon: <TeamOutlined />,
          label: <Link href="/factory-admin/settings/users">User Management</Link>,
        },
        {
          key: 'factory-settings',
          icon: <SettingOutlined />,
          label: <Link href="/settings">Factory Settings</Link>,
        },
      ],
    },
  ];

  // ==========================================
  // STAFF MENU
  // ==========================================
  const staffMenu = [
    {
      key: 'main',
      label: 'Main',
      children: [
        {
          key: 'dashboard',
          icon: <DashboardOutlined />,
          label: <Link href="/dashboard">Dashboard</Link>,
        },
      ],
    },
    {
      key: 'work',
      label: 'Work',
      children: [
        {
          key: 'dyeing-jobs',
          icon: <ShoppingCartOutlined />,
          label: <Link href="/dyeing-jobs">Assigned Jobs</Link>,
        },
        {
          key: 'quality-control',
          icon: <SafetyOutlined />,
          label: <Link href="/quality-control">Quality Control</Link>,
        },
      ],
    },
  ];

  // Determine which menu to show based on role
  let menuItems = [];
  if (role === 'SUPER_ADMIN') {
    menuItems = superAdminMenu;
  } else if (role === 'ADMIN') {
    menuItems = factoryAdminMenu;
  } else {
    menuItems = staffMenu;
  }

  // Find selected key based on current pathname
  const getSelectedKey = () => {
    if (pathname?.includes('fabric-receiving')) return 'fabric-receiving';
    if (pathname?.includes('fabric-inspection')) return 'fabric-inspection';
    if (pathname?.includes('process-route-builder')) return 'process-route-builder';
    if (pathname?.includes('process-master')) return 'process-master';
    if (pathname?.includes('user-management') || pathname?.includes('users')) return 'user-management';
    if (pathname?.includes('dyeing-jobs')) return 'dyeing-jobs';
    if (pathname?.includes('quality-control')) return 'quality-control';
    if (pathname?.includes('customers')) return 'customers';
    if (pathname?.includes('invoices')) return 'invoices';
    if (pathname?.includes('dashboard')) return 'dashboard';
    if (pathname?.includes('machines')) return 'machines';
    if (pathname?.includes('recipes')) return 'recipes';
    if (pathname?.includes('chemicals')) return 'chemicals';
    if (pathname?.includes('costing')) return 'costing';
    if (pathname?.includes('lab-dips')) return 'lab-dips';
    if (pathname?.includes('companies')) return 'companies';
    if (pathname?.includes('plans')) return 'plans';
    if (pathname?.includes('settings')) return 'factory-settings';
    return 'dashboard';
  };

  // Handle menu open/close - only allow one parent menu open at a time
  const handleOpenMenuChange = (keys: string[]) => {
    // Only keep the last opened key
    const latestOpenKey = keys.find((key) => openMenuKeys.indexOf(key) === -1);
    if (latestOpenKey) {
      setOpenMenuKeys([latestOpenKey]);
    } else {
      setOpenMenuKeys(keys);
    }
  };

  if (loading) {
    return (
      <Layout.Sider 
        width={sidebarCollapsed ? 64 : 256} 
        style={{ 
          minHeight: '100vh', 
          background: '#fff',
          transition: 'width 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spin />
        </div>
      </Layout.Sider>
    );
  }

  return (
    <Layout.Sider
      width={sidebarCollapsed ? 64 : 256}
      style={{
        minHeight: '100vh',
        background: '#001529',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        transition: 'width 0.3s ease',
      }}
    >
      {/* Logo/Branding + Toggle - Always Visible */}
      <div
        style={{
          padding: sidebarCollapsed ? '8px' : '16px',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          textAlign: 'center',
          borderBottom: '1px solid #434343',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        {!sidebarCollapsed && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DatabaseOutlined style={{ fontSize: '20px' }} />
              <span>Textile Pro</span>
            </div>
          </>
        )}
        <button
          onClick={() => {
            const newState = !sidebarCollapsed;
            setSidebarCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>

      {/* Scrollable Menu */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          openKeys={sidebarCollapsed ? [] : openMenuKeys}
          onOpenChange={handleOpenMenuChange}
          items={menuItems}
          inlineCollapsed={sidebarCollapsed}
          style={{
            borderRight: 0,
            marginTop: sidebarCollapsed ? '0' : '16px',
            flex: 1,
          }}
        />
      </div>

      {/* User Profile at Bottom - Always Visible */}
      <div
        style={{
          padding: sidebarCollapsed ? '8px' : '16px',
          borderTop: '1px solid #434343',
          backgroundColor: '#001529',
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Dropdown menu={{ items: userMenuItems }} placement="topRight">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: sidebarCollapsed ? '0' : '8px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              backgroundColor: '#1890ff14',
              color: 'white',
              width: '100%',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            }}
          >
            <Avatar
              size={32}
              icon={<UserOutlined />}
              style={{ backgroundColor: '#1890ff', flexShrink: 0 }}
            />
            {!sidebarCollapsed && (
              <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                  {role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'ADMIN' ? 'Factory Admin' : 'Staff'}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {userName}
                </div>
              </div>
            )}
          </div>
        </Dropdown>
      </div>
    </Layout.Sider>
  );
}
