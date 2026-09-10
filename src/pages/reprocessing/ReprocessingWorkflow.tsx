import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Form,
  Input,
  Select,
  Table,
  Tag,
  Spin,
  message,
  Modal,
  Divider,
  Space,
  Statistic,
  Timeline,
  Badge,
  Tooltip,
  Empty,
  Steps,
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  DeleteOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import api from '../../api/config';

interface ReprocessRequest {
  id: string;
  jobNo: string;
  customerName: string;
  fabricType: string;
  failureReason: string;
  proposedAction?: string;
  status: 'PENDING' | 'AUTHORIZED' | 'REJECTED';
  createdAt: string;
  authorizedBy?: string;
  authorizedAt?: string;
  rejectionReason?: string;
  originalInput: number;
  originalOutput: number;
  originalLoss: number;
}

interface ReprocessCycle {
  id: string;
  jobNo: string;
  cycleNumber: number;
  startProcess: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  reprocessInput: number;
  reprocessOutput?: number;
  reprocessLoss?: number;
  estimatedAdditionalCost?: number;
  actualAdditionalCost?: number;
  startedAt?: string;
  completedAt?: string;
}

const ReprocessingWorkflow: React.FC = () => {
  const [form] = Form.useForm();
  const [requests, setRequests] = useState<ReprocessRequest[]>([]);
  const [cycles, setCycles] = useState<ReprocessCycle[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ReprocessRequest | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<ReprocessCycle | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'cycles' | 'analysis'>(
    'requests',
  );
  const [authorizationModal, setAuthorizationModal] = useState(false);

  useEffect(() => {
    loadReprocessRequests();
    loadReprocessCycles();
  }, []);

  const loadReprocessRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/reprocessing/requests');
      if (response.data) {
        setRequests(response.data);
      }
    } catch (error) {
      console.error('Failed to load reprocess requests:', error);
      message.error('Failed to load reprocessing requests');
    } finally {
      setLoading(false);
    }
  };

  const loadReprocessCycles = async () => {
    try {
      const response = await api.get('/api/reprocessing/cycles');
      if (response.data) {
        setCycles(response.data);
      }
    } catch (error) {
      console.error('Failed to load reprocess cycles:', error);
      message.error('Failed to load reprocessing cycles');
    }
  };

  const authorizeRequest = async (
    requestId: string,
    targetProcess: string,
    estimatedCost: number,
    remarks: string,
  ) => {
    try {
      setLoading(true);
      const response = await api.patch(
        `/api/reprocessing/request/${requestId}/authorize`,
        {
          targetProcess,
          estimatedAdditionalCost: estimatedCost,
          remarks,
        },
      );
      message.success('Reprocess request authorized');
      setSelectedRequest(null);
      setAuthorizationModal(false);
      loadReprocessRequests();
      loadReprocessCycles();
    } catch (error) {
      console.error('Failed to authorize request:', error);
      message.error('Failed to authorize reprocessing request');
    } finally {
      setLoading(false);
    }
  };

  const rejectRequest = async (requestId: string, reason: string) => {
    try {
      setLoading(true);
      await api.patch(`/api/reprocessing/request/${requestId}/reject`, {
        rejectionReason: reason,
      });
      message.success('Reprocess request rejected');
      setSelectedRequest(null);
      loadReprocessRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
      message.error('Failed to reject reprocessing request');
    } finally {
      setLoading(false);
    }
  };

  const startCycle = async (cycleId: string) => {
    try {
      setLoading(true);
      const response = await api.patch(
        `/api/reprocessing/cycle/${cycleId}/start`,
        {},
      );
      message.success('Reprocess cycle started');
      loadReprocessCycles();
    } catch (error) {
      console.error('Failed to start cycle:', error);
      message.error('Failed to start reprocessing cycle');
    } finally {
      setLoading(false);
    }
  };

  const completeCycle = async (
    cycleId: string,
    output: number,
    loss: number,
    actualCost: number,
  ) => {
    try {
      setLoading(true);
      await api.patch(`/api/reprocessing/cycle/${cycleId}/complete`, {
        reprocessOutput: output,
        reprocessLoss: loss,
        actualAdditionalCost: actualCost,
      });
      message.success('Reprocess cycle completed');
      setSelectedCycle(null);
      loadReprocessCycles();
    } catch (error) {
      console.error('Failed to complete cycle:', error);
      message.error('Failed to complete reprocessing cycle');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'processing';
      case 'AUTHORIZED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'IN_PROGRESS':
        return 'processing';
      case 'COMPLETED':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPendingRequestCount = () => requests.filter(r => r.status === 'PENDING').length;
  const getInProgressCycleCount = () => cycles.filter(c => c.status === 'IN_PROGRESS').length;

  return (
    <Spin spinning={loading}>
      <Card title="Reprocessing Workflow Management">
        {/* Summary Stats */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} md={6}>
            <Card>
              <Statistic
                title="Pending Requests"
                value={getPendingRequestCount()}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card>
              <Statistic
                title="In Progress Cycles"
                value={getInProgressCycleCount()}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card>
              <Statistic
                title="Authorized Requests"
                value={requests.filter(r => r.status === 'AUTHORIZED').length}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card>
              <Statistic
                title="Total Cycles"
                value={cycles.length}
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* Tab Navigation */}
        <div style={{ marginBottom: '24px' }}>
          <Space>
            <Button
              type={activeTab === 'requests' ? 'primary' : 'default'}
              onClick={() => setActiveTab('requests')}
            >
              Reprocess Requests ({getPendingRequestCount()})
            </Button>
            <Button
              type={activeTab === 'cycles' ? 'primary' : 'default'}
              onClick={() => setActiveTab('cycles')}
            >
              Active Cycles ({getInProgressCycleCount()})
            </Button>
            <Button
              type={activeTab === 'analysis' ? 'primary' : 'default'}
              onClick={() => setActiveTab('analysis')}
            >
              Cost Analysis
            </Button>
          </Space>
        </div>

        {/* Reprocess Requests Tab */}
        {activeTab === 'requests' && (
          <Card title="Reprocessing Requests" loading={loading}>
            {!selectedRequest ? (
              <Table
                dataSource={requests}
                columns={[
                  {
                    title: 'Job',
                    dataIndex: 'jobNo',
                    key: 'jobNo',
                    render: (text: string) => <strong>{text}</strong>,
                  },
                  {
                    title: 'Customer',
                    dataIndex: 'customerName',
                    key: 'customerName',
                  },
                  {
                    title: 'Fabric',
                    dataIndex: 'fabricType',
                    key: 'fabricType',
                  },
                  {
                    title: 'Failure Reason',
                    dataIndex: 'failureReason',
                    key: 'failureReason',
                    render: (text: string) => (
                      <Tooltip title={text}>
                        <span>{text.substring(0, 40)}...</span>
                      </Tooltip>
                    ),
                  },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status: string) => (
                      <Tag color={getStatusColor(status)}>{status}</Tag>
                    ),
                  },
                  {
                    title: 'Created',
                    dataIndex: 'createdAt',
                    key: 'createdAt',
                    render: (date: string) =>
                      new Date(date).toLocaleDateString(),
                  },
                  {
                    title: 'Action',
                    key: 'action',
                    render: (_, record) => (
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => setSelectedRequest(record)}
                        disabled={record.status !== 'PENDING'}
                      >
                        Review
                      </Button>
                    ),
                  },
                ]}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <Card type="inner" title={`Reviewing: ${selectedRequest.jobNo}`}>
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                  <Col xs={24} md={6}>
                    <Statistic
                      title="Original Input"
                      value={selectedRequest.originalInput}
                      suffix="kg"
                    />
                  </Col>
                  <Col xs={24} md={6}>
                    <Statistic
                      title="Original Output"
                      value={selectedRequest.originalOutput}
                      suffix="kg"
                    />
                  </Col>
                  <Col xs={24} md={6}>
                    <Statistic
                      title="Original Loss"
                      value={selectedRequest.originalLoss}
                      suffix="kg"
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Col>
                  <Col xs={24} md={6}>
                    <Statistic
                      title="Loss %"
                      value={(
                        (selectedRequest.originalLoss / selectedRequest.originalInput) *
                        100
                      ).toFixed(2)}
                      suffix="%"
                    />
                  </Col>
                </Row>

                <Card type="inner" style={{ marginBottom: '16px' }}>
                  <p>
                    <strong>Failure Reason:</strong>
                  </p>
                  <p style={{ marginTop: '8px', color: '#666' }}>
                    {selectedRequest.failureReason}
                  </p>
                </Card>

                {selectedRequest.proposedAction && (
                  <Card type="inner" style={{ marginBottom: '16px' }}>
                    <p>
                      <strong>Proposed Action:</strong>
                    </p>
                    <p style={{ marginTop: '8px', color: '#666' }}>
                      {selectedRequest.proposedAction}
                    </p>
                  </Card>
                )}

                <Divider />

                {selectedRequest.status === 'PENDING' && (
                  <>
                    <h3>Authorize Reprocessing</h3>
                    <Form
                      form={form}
                      layout="vertical"
                      style={{ marginTop: '16px' }}
                    >
                      <Form.Item
                        name="targetProcess"
                        label="Target Process to Restart From"
                        rules={[
                          {
                            required: true,
                            message: 'Please select target process',
                          },
                        ]}
                      >
                        <Select
                          placeholder="Select process"
                          options={[
                            { label: 'Desizing', value: 'DESIZING' },
                            { label: 'Scouring', value: 'SCOURING' },
                            { label: 'Bleaching', value: 'BLEACHING' },
                            { label: 'Reactive Dyeing', value: 'REACTIVE_DYEING' },
                            { label: 'Disperse Dyeing', value: 'DISPERSE_DYEING' },
                            { label: 'Washing', value: 'WASHING' },
                            { label: 'Drying', value: 'DRYING' },
                            { label: 'Finishing', value: 'FINISHING' },
                          ]}
                        />
                      </Form.Item>

                      <Form.Item
                        name="estimatedCost"
                        label="Estimated Additional Cost"
                        rules={[
                          {
                            required: true,
                            message: 'Please enter estimated cost',
                          },
                        ]}
                      >
                        <Input
                          type="number"
                          placeholder="Cost in ₹"
                          prefix="₹"
                        />
                      </Form.Item>

                      <Form.Item
                        name="remarks"
                        label="Supervisor Remarks"
                      >
                        <Input.TextArea
                          placeholder="Any remarks or special instructions..."
                          rows={4}
                        />
                      </Form.Item>
                    </Form>

                    <Space style={{ marginTop: '16px' }}>
                      <Button
                        type="primary"
                        onClick={() => {
                          form.validateFields().then((values) => {
                            authorizeRequest(
                              selectedRequest.id,
                              values.targetProcess,
                              values.estimatedCost,
                              values.remarks || '',
                            );
                          });
                        }}
                      >
                        Authorize Reprocessing
                      </Button>
                      <Button
                        danger
                        onClick={() =>
                          Modal.confirm({
                            title: 'Reject Reprocessing',
                            content: (
                              <Form layout="vertical">
                                <Form.Item
                                  name="rejectionReason"
                                  label="Reason for Rejection"
                                >
                                  <Input.TextArea rows={3} />
                                </Form.Item>
                              </Form>
                            ),
                            onOk: () => {
                              const reason = (
                                document.querySelector(
                                  '[name="rejectionReason"]',
                                ) as HTMLTextAreaElement
                              )?.value;
                              rejectRequest(selectedRequest.id, reason);
                            },
                          })
                        }
                      >
                        Reject Request
                      </Button>
                      <Button onClick={() => setSelectedRequest(null)}>
                        Back
                      </Button>
                    </Space>
                  </>
                )}

                {selectedRequest.status === 'AUTHORIZED' && (
                  <Card type="inner">
                    <CheckCircleOutlined
                      style={{
                        fontSize: '24px',
                        color: '#52c41a',
                        marginRight: '8px',
                      }}
                    />
                    <span>Authorized on {new Date(selectedRequest.authorizedAt!).toLocaleString()}</span>
                    <p style={{ marginTop: '8px', color: '#666' }}>
                      by {selectedRequest.authorizedBy}
                    </p>
                  </Card>
                )}

                {selectedRequest.status === 'REJECTED' && (
                  <Card type="inner" style={{ borderLeft: '4px solid #ff4d4f' }}>
                    <ExclamationCircleOutlined
                      style={{
                        fontSize: '24px',
                        color: '#ff4d4f',
                        marginRight: '8px',
                      }}
                    />
                    <span>Rejected</span>
                    <p style={{ marginTop: '8px', color: '#666' }}>
                      Reason: {selectedRequest.rejectionReason}
                    </p>
                  </Card>
                )}
              </Card>
            )}
          </Card>
        )}

        {/* Active Cycles Tab */}
        {activeTab === 'cycles' && (
          <Card title="Active Reprocessing Cycles" loading={loading}>
            {cycles.length === 0 ? (
              <Empty description="No reprocessing cycles" />
            ) : !selectedCycle ? (
              <Table
                dataSource={cycles}
                columns={[
                  {
                    title: 'Job',
                    dataIndex: 'jobNo',
                    key: 'jobNo',
                  },
                  {
                    title: 'Cycle',
                    dataIndex: 'cycleNumber',
                    key: 'cycleNumber',
                    render: (num: number) => `Cycle #${num}`,
                  },
                  {
                    title: 'Process',
                    dataIndex: 'startProcess',
                    key: 'startProcess',
                  },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status: string) => (
                      <Tag color={getStatusColor(status)}>{status}</Tag>
                    ),
                  },
                  {
                    title: 'Input (kg)',
                    dataIndex: 'reprocessInput',
                    key: 'reprocessInput',
                  },
                  {
                    title: 'Started',
                    dataIndex: 'startedAt',
                    key: 'startedAt',
                    render: (date: string) =>
                      date ? new Date(date).toLocaleDateString() : '-',
                  },
                  {
                    title: 'Action',
                    key: 'action',
                    render: (_, record) => (
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => setSelectedCycle(record)}
                      >
                        View
                      </Button>
                    ),
                  },
                ]}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <Card type="inner" title={`Cycle #${selectedCycle.cycleNumber} - ${selectedCycle.jobNo}`}>
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                  <Col xs={24} md={6}>
                    <Statistic
                      title="Input"
                      value={selectedCycle.reprocessInput}
                      suffix="kg"
                    />
                  </Col>
                  <Col xs={24} md={6}>
                    <Statistic
                      title="Output"
                      value={selectedCycle.reprocessOutput || 0}
                      suffix="kg"
                    />
                  </Col>
                  <Col xs={24} md={6}>
                    <Statistic
                      title="Loss"
                      value={selectedCycle.reprocessLoss || 0}
                      suffix="kg"
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Col>
                  <Col xs={24} md={6}>
                    <Statistic
                      title="Status"
                      value={selectedCycle.status}
                      valueStyle={{
                        color:
                          selectedCycle.status === 'COMPLETED'
                            ? '#52c41a'
                            : '#faad14',
                      }}
                    />
                  </Col>
                </Row>

                {selectedCycle.status === 'PENDING' && (
                  <Space style={{ marginTop: '16px' }}>
                    <Button
                      type="primary"
                      onClick={() => startCycle(selectedCycle.id)}
                    >
                      Start Cycle
                    </Button>
                    <Button onClick={() => setSelectedCycle(null)}>Back</Button>
                  </Space>
                )}

                {selectedCycle.status === 'IN_PROGRESS' && (
                  <>
                    <Form layout="vertical" style={{ marginTop: '16px' }}>
                      <Form.Item
                        label="Output Quantity (kg)"
                        required
                      >
                        <Input
                          id="cycle-output"
                          type="number"
                          placeholder="Output in kg"
                        />
                      </Form.Item>

                      <Form.Item label="Actual Additional Cost (₹)">
                        <Input
                          id="cycle-cost"
                          type="number"
                          placeholder="Cost in ₹"
                          prefix="₹"
                        />
                      </Form.Item>
                    </Form>

                    <Space style={{ marginTop: '16px' }}>
                      <Button
                        type="primary"
                        onClick={() => {
                          const output = parseFloat(
                            (document.getElementById('cycle-output') as HTMLInputElement)
                              ?.value || '0',
                          );
                          const cost = parseFloat(
                            (document.getElementById('cycle-cost') as HTMLInputElement)
                              ?.value || '0',
                          );
                          const loss = selectedCycle.reprocessInput - output;
                          completeCycle(
                            selectedCycle.id,
                            output,
                            loss,
                            cost,
                          );
                        }}
                      >
                        Complete Cycle
                      </Button>
                      <Button onClick={() => setSelectedCycle(null)}>Back</Button>
                    </Space>
                  </>
                )}

                {selectedCycle.status === 'COMPLETED' && (
                  <Card type="inner" style={{ marginTop: '16px' }}>
                    <Timeline
                      items={[
                        {
                          dot: (
                            <CheckCircleOutlined
                              style={{
                                fontSize: '16px',
                                color: '#52c41a',
                              }}
                            />
                          ),
                          children: (
                            <div>
                              <strong>Cycle Started</strong>
                              <p style={{ color: '#666' }}>
                                {new Date(selectedCycle.startedAt!).toLocaleString()}
                              </p>
                            </div>
                          ),
                        },
                        {
                          dot: (
                            <CheckCircleOutlined
                              style={{
                                fontSize: '16px',
                                color: '#52c41a',
                              }}
                            />
                          ),
                          children: (
                            <div>
                              <strong>Cycle Completed</strong>
                              <p style={{ color: '#666' }}>
                                {new Date(selectedCycle.completedAt!).toLocaleString()}
                              </p>
                              <p style={{ color: '#666' }}>
                                Output: {selectedCycle.reprocessOutput} kg
                              </p>
                              <p style={{ color: '#666' }}>
                                Cost: ₹{selectedCycle.actualAdditionalCost}
                              </p>
                            </div>
                          ),
                        },
                      ]}
                    />
                  </Card>
                )}
              </Card>
            )}
          </Card>
        )}

        {/* Cost Analysis Tab */}
        {activeTab === 'analysis' && (
          <Card title="Reprocessing Cost Analysis">
            <Empty description="Cost analysis dashboard - detailed metrics by job and cycle" />
          </Card>
        )}
      </Card>
    </Spin>
  );
};

export default ReprocessingWorkflow;
