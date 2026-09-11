'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  message,
  Popconfirm,
  Alert,
  Spin,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  LockOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { apiFetch } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  createdAt: string;
}

interface Company {
  id: string;
  name: string;
  maxUsers: number;
}

export default function UserManagementPage() {
  const [form] = Form.useForm();
  const [users, setUsers] = useState<User[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load users and company info
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch the caller's own company profile. The backend scopes this to
      // req.user.companyId server-side, so a factory admin can never fetch
      // another tenant's company data (multi-tenant isolation).
      const companyData = await apiFetch('/company/profile');
      setCompany(companyData);

      // Fetch users for the caller's own company. The backend resolves the
      // company from the authenticated user's token rather than trusting a
      // client-supplied ID.
      const usersData = await apiFetch('/api/users');
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load data:', error);
      message.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setIsEditMode(false);
    setEditingUserId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setIsEditMode(true);
    setEditingUserId(user.id);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setIsModalVisible(true);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });

      message.success('User deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Failed to delete user:', error);
      message.error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (!company?.id) {
        message.error('Company information not loaded yet');
        return;
      }

      if (isEditMode && editingUserId) {
        // Update user
        await apiFetch(`/api/users/${editingUserId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: values.name,
            role: values.role,
          }),
        });

        message.success('User updated successfully');
      } else {
        // Create user
        await apiFetch('/api/users', {
          method: 'POST',
          body: JSON.stringify({
            name: values.name,
            email: values.email,
            password: values.password,
            role: values.role,
            companyId: company.id,
          }),
        });

        message.success('User created successfully');
      }

      setIsModalVisible(false);
      form.resetFields();
      await loadData();
    } catch (error) {
      console.error('Failed to save user:', error);
      message.error(error instanceof Error ? error.message : 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  const canAddMoreUsers = users.length < (company?.maxUsers || 1);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: User) => (
        <Space>
          <UserOutlined />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: 'ADMIN' | 'STAFF') => {
        const color = role === 'ADMIN' ? 'blue' : 'green';
        const label = role === 'ADMIN' ? 'Factory Admin' : 'Staff';
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
            disabled={record.role === 'ADMIN'}
            title={record.role === 'ADMIN' ? 'Cannot edit admin' : 'Edit user'}
          />
          <Popconfirm
            title="Delete User"
            description="Are you sure you want to delete this user?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              disabled={record.role === 'ADMIN'}
              title={record.role === 'ADMIN' ? 'Cannot delete admin' : 'Delete user'}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px' }}>
      <Card
        title="User Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddUser}
            disabled={!canAddMoreUsers}
          >
            Add User
          </Button>
        }
        style={{ marginBottom: '24px' }}
      >
        {/* Plan Info */}
        <div style={{ marginBottom: '24px' }}>
          <Alert
            type={canAddMoreUsers ? 'info' : 'warning'}
            message={
              <>
                <strong>Plan:</strong> {company?.name} |{' '}
                <strong>Users:</strong> {users.length} of {company?.maxUsers}
              </>
            }
            description={
              !canAddMoreUsers ? (
                <>
                  You've reached the user limit for your plan. Upgrade to add more users.
                </>
              ) : (
                <>
                  You can add {(company?.maxUsers || 1) - users.length} more{' '}
                  {(company?.maxUsers || 1) - users.length === 1 ? 'user' : 'users'}.
                </>
              )
            }
            showIcon
            style={{ marginBottom: '16px' }}
          />
        </div>

        {/* Users Table */}
        {users.length === 0 ? (
          <Empty description="No users found" />
        ) : (
          <Table
            columns={columns}
            dataSource={users.map((user) => ({ ...user, key: user.id }))}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* Add/Edit User Modal */}
      <Modal
        title={isEditMode ? 'Edit User' : 'Add User'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter user name' }]}
          >
            <Input placeholder="Full name" prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Invalid email format' },
            ]}
          >
            <Input placeholder="user@factory.com" prefix={<MailOutlined />} />
          </Form.Item>

          {!isEditMode && (
            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: 'Please enter password' },
                { min: 8, message: 'Password must be at least 8 characters' },
              ]}
            >
              <Input.Password placeholder="At least 8 characters" prefix={<LockOutlined />} />
            </Form.Item>
          )}

          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: 'Please select role' }]}
            initialValue="STAFF"
          >
            <Select
              options={[
                { label: 'Admin', value: 'ADMIN' },
                { label: 'Staff', value: 'STAFF' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
