'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Table,
  Modal,
  Select,
  Row,
  Col,
  Tag,
  Divider,
  Empty,
  Spin,
  message,
  Steps,
  Space,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckOutlined,
  PlayCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';

interface Process {
  id: string;
  name: string;
  process_code: string;
  category_id: string;
}

interface RouteStep {
  id: string;
  sequence: number;
  process: Process;
  status: string;
  isMandatory: boolean;
  requiresQcBefore: boolean;
  instructions?: string;
  expectedQuantity?: number;
  expectedCompletionDate?: Date;
  actualStartDate?: Date;
  actualCompletionDate?: Date;
  actualQuantity?: number;
}

interface ProcessRoute {
  id: string;
  routeName: string;
  status: string;
  templateName?: string;
  lockedAt?: Date;
  steps: RouteStep[];
  job: any;
}

interface StepFormData {
  processId: string;
  sequence: number;
  isMandatory?: boolean;
  requiresQcBefore?: boolean;
  instructions?: string;
  expectedQuantity?: number;
  expectedCompletionDate?: Date;
}

export default function ProcessRouteBuilderPage() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [route, setRoute] = useState<ProcessRoute | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateRoute, setShowCreateRoute] = useState(false);
  const [showAddStep, setShowAddStep] = useState(false);
  const [form] = Form.useForm();
  const [stepForm] = Form.useForm();

  const stepStatusColors: Record<string, string> = {
    PENDING: 'default',
    READY: 'blue',
    IN_PROGRESS: 'processing',
    COMPLETED: 'success',
    ON_HOLD: 'warning',
    SKIPPED: 'default',
    REPROCESS: 'error',
  };

  const routeStatusColors: Record<string, string> = {
    PENDING: 'default',
    READY: 'blue',
    IN_PROGRESS: 'processing',
    COMPLETED: 'success',
    ON_HOLD: 'warning',
    CANCELLED: 'error',
  };

  useEffect(() => {
    fetchProcesses();
  }, []);

  const fetchProcesses = async () => {
    try {
      const response = await fetch('/api/admin/process-master/processes');
      if (response.ok) {
        const data = await response.json();
        setProcesses(data);
      }
    } catch (error) {
      console.error('Error fetching processes:', error);
    }
  };

  const fetchRoute = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/process-route/job/${id}`);
      if (response.ok) {
        const data = await response.json();
        setRoute(data);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      message.error('Failed to load route');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoute = async () => {
    const values = form.getFieldsValue();
    if (!jobId) {
      message.error('Please select a job');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/process-route/job/${jobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeName: values.routeName,
          templateName: values.templateName,
          steps: [],
        }),
      });

      if (response.ok) {
        const newRoute = await response.json();
        setRoute(newRoute);
        setShowCreateRoute(false);
        form.resetFields();
        message.success('Route created');
      } else {
        message.error('Failed to create route');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Error creating route');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStep = async () => {
    if (!route) return;

    const values = stepForm.getFieldsValue();
    if (!values.processId || values.sequence === undefined) {
      message.error('Process and sequence are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/process-route/${route.id}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          sequence: parseInt(values.sequence),
        }),
      });

      if (response.ok) {
        await fetchRoute(route.job.id);
        setShowAddStep(false);
        stepForm.resetFields();
        message.success('Step added');
      } else {
        message.error('Failed to add step');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Error adding step');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!route) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/process-route/steps/${stepId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchRoute(route.job.id);
        message.success('Step removed');
      } else {
        message.error('Failed to remove step');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Error removing step');
    } finally {
      setLoading(false);
    }
  };

  const handleLockRoute = async () => {
    if (!route) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/process-route/${route.id}/lock`, {
        method: 'PUT',
      });

      if (response.ok) {
        const updated = await response.json();
        setRoute(updated);
        message.success('Route locked and ready for production');
      } else {
        message.error('Failed to lock route');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Error locking route');
    } finally {
      setLoading(false);
    }
  };

  const handleStartStep = async (stepId: string) => {
    if (!route) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/process-route/steps/${stepId}/start`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchRoute(route.job.id);
        message.success('Step started');
      } else {
        message.error('Failed to start step');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Error starting step');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteStep = async (stepId: string, quantity: number) => {
    if (!route) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/process-route/steps/${stepId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actualQuantity: quantity }),
      });

      if (response.ok) {
        await fetchRoute(route.job.id);
        message.success('Step completed');
      } else {
        message.error('Failed to complete step');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Error completing step');
    } finally {
      setLoading(false);
    }
  };

  const renderTimeline = () => {
    if (!route || route.steps.length === 0) {
      return <Empty description="No steps in route" />;
    }

    return (
      <div style={{ position: 'relative', padding: '20px' }}>
        {route.steps.map((step, index) => (
          <div key={step.id} style={{ marginBottom: '20px' }}>
            <Row gutter={16} align="middle">
              <Col span={1} style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                {step.sequence}
              </Col>
              <Col span={1} style={{ textAlign: 'center' }}>
                {index < route.steps.length - 1 && <ArrowRightOutlined style={{ fontSize: '16px', color: '#999' }} />}
              </Col>
              <Col span={14}>
                <Card
                  size="small"
                  style={{
                    borderLeft: `4px solid ${
                      step.status === 'COMPLETED'
                        ? '#52c41a'
                        : step.status === 'IN_PROGRESS'
                          ? '#1890ff'
                          : step.status === 'READY'
                            ? '#faad14'
                            : '#d9d9d9'
                    }`,
                  }}
                >
                  <Row gutter={16}>
                    <Col span={8}>
                      <div>
                        <strong>{step.process.name}</strong>
                        <div style={{ fontSize: '12px', color: '#999' }}>{step.process.process_code}</div>
                      </div>
                    </Col>
                    <Col span={6}>
                      <Tag color={stepStatusColors[step.status]}>{step.status}</Tag>
                    </Col>
                    <Col span={10} style={{ textAlign: 'right' }}>
                      <Space>
                        {step.status === 'READY' && (
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlayCircleOutlined />}
                            onClick={() => handleStartStep(step.id)}
                            loading={loading}
                          >
                            Start
                          </Button>
                        )}
                        {step.status === 'IN_PROGRESS' && (
                          <Modal
                            title="Complete Step"
                            open={false}
                            okText="Complete"
                            onOk={() => {
                              // Will implement full modal form
                            }}
                          />
                        )}
                        {step.status === 'IN_PROGRESS' && (
                          <Button
                            size="small"
                            onClick={() => {
                              Modal.confirm({
                                title: 'Complete Step',
                                content: 'Enter actual quantity',
                                okText: 'Complete',
                                onOk: () => {
                                  // Will show input
                                  handleCompleteStep(step.id, step.expectedQuantity || 0);
                                },
                              });
                            }}
                          >
                            Complete
                          </Button>
                        )}
                        {!route.lockedAt && (
                          <Popconfirm
                            title="Remove step"
                            onConfirm={() => handleDeleteStep(step.id)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button danger size="small" icon={<DeleteOutlined />} />
                          </Popconfirm>
                        )}
                      </Space>
                    </Col>
                  </Row>
                  {step.instructions && (
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                      <strong>Instructions:</strong> {step.instructions}
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card title="Process Route Builder">
        <Divider>Select Job</Divider>
        <Row gutter={16} style={{ marginBottom: '20px' }}>
          <Col span={12}>
            <Input
              placeholder="Enter Job ID"
              value={jobId || ''}
              onChange={(e) => setJobId(e.target.value)}
              onPressEnter={() => jobId && fetchRoute(jobId)}
            />
          </Col>
          <Col span={6}>
            <Button type="primary" onClick={() => jobId && fetchRoute(jobId)} loading={loading}>
              Load Route
            </Button>
          </Col>
        </Row>

        {route ? (
          <>
            <Divider>Route Details</Divider>
            <Row gutter={16} style={{ marginBottom: '20px' }}>
              <Col span={8}>
                <div>
                  <strong>Route Name:</strong> {route.routeName}
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <strong>Status:</strong> <Tag color={routeStatusColors[route.status]}>{route.status}</Tag>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <strong>Locked:</strong> {route.lockedAt ? 'Yes' : 'No'}
                </div>
              </Col>
            </Row>

            <Divider>Process Timeline</Divider>
            <Spin spinning={loading}>{renderTimeline()}</Spin>

            <Divider>Actions</Divider>
            <Space>
              {!route.lockedAt && (
                <>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setShowAddStep(true)}
                    disabled={route.status !== 'PENDING'}
                  >
                    Add Step
                  </Button>
                  <Button
                    type="default"
                    icon={<LockOutlined />}
                    onClick={handleLockRoute}
                    disabled={route.steps.length === 0}
                  >
                    Lock & Start Production
                  </Button>
                </>
              )}
              {route.lockedAt && <Tag color="blue">Route is locked</Tag>}
            </Space>
          </>
        ) : (
          <>
            {!showCreateRoute ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreateRoute(true)}>
                Create New Route
              </Button>
            ) : (
              <Form form={form} layout="vertical">
                <Form.Item name="routeName" label="Route Name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="templateName" label="Template Name (Optional)">
                  <Input />
                </Form.Item>
                <Space>
                  <Button type="primary" loading={loading} onClick={handleCreateRoute}>
                    Create Route
                  </Button>
                  <Button onClick={() => setShowCreateRoute(false)}>Cancel</Button>
                </Space>
              </Form>
            )}
          </>
        )}
      </Card>

      {/* Add Step Modal */}
      <Modal
        title="Add Process Step"
        open={showAddStep}
        onCancel={() => {
          setShowAddStep(false);
          stepForm.resetFields();
        }}
        onOk={handleAddStep}
        loading={loading}
      >
        <Form form={stepForm} layout="vertical">
          <Form.Item name="processId" label="Process" rules={[{ required: true }]}>
            <Select
              placeholder="Select a process"
              options={processes.map((p) => ({
                label: `${p.name} (${p.process_code})`,
                value: p.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="sequence" label="Sequence" rules={[{ required: true }]}>
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item name="isMandatory" label="Is Mandatory?" valuePropName="checked">
            <input type="checkbox" defaultChecked />
          </Form.Item>
          <Form.Item name="requiresQcBefore" label="Requires QC Before?" valuePropName="checked">
            <input type="checkbox" />
          </Form.Item>
          <Form.Item name="instructions" label="Instructions">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="expectedQuantity" label="Expected Quantity">
            <Input type="number" step="0.001" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
