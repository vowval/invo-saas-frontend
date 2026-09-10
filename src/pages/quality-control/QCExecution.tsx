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
  Steps,
  Divider,
  Space,
  Timeline,
  Badge,
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PauseCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import api from '../../api/config';

interface QCCheckResult {
  id: string;
  checkName: string;
  checkCode: string;
  targetValue?: string;
  actualValue?: string;
  result: 'PASS' | 'FAIL' | 'HOLD';
  remarks?: string;
}

interface QCExecution {
  id: string;
  jobNo: string;
  customerName: string;
  fabricType: string;
  colour: string;
  qcStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  overallResult?: 'PASS' | 'FAIL' | 'HOLD';
  inspectorName?: string;
  startedAt?: string;
  completedAt?: string;
  results: QCCheckResult[];
}

interface QCCheckTemplate {
  id: string;
  checkName: string;
  checkCode: string;
  checkType: 'TEXT' | 'NUMERIC' | 'BOOLEAN' | 'RANGE';
  targetValue?: any;
  tolerance?: number;
  isMandatory: boolean;
  isActive: boolean;
}

const QCExecution: React.FC = () => {
  const [form] = Form.useForm();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<QCExecution | null>(null);
  const [checkTemplates, setCheckTemplates] = useState<QCCheckTemplate[]>([]);
  const [checkResults, setCheckResults] = useState<QCCheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [currentCheckIndex, setCurrentCheckIndex] = useState(0);

  useEffect(() => {
    loadJobsForQC();
    loadCheckTemplates();
  }, []);

  const loadJobsForQC = async () => {
    try {
      setLoading(true);
      // Jobs ready for QC
      const response = await api.get('/api/dashboard/alerts/waiting-qc');
      if (response.data.jobs) {
        const enrichedJobs = await Promise.all(
          response.data.jobs.map(async (job: any) => {
            const detail = await api.get(`/api/dyeing-jobs/${job.jobNumber}`);
            return detail.data;
          }),
        );
        setJobs(enrichedJobs);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
      message.error('Failed to load jobs for QC');
    } finally {
      setLoading(false);
    }
  };

  const loadCheckTemplates = async () => {
    try {
      const response = await api.get('/api/quality-control/templates');
      if (response.data) {
        const active = response.data.filter((t: QCCheckTemplate) => t.isActive);
        setCheckTemplates(active);
      }
    } catch (error) {
      console.error('Failed to load check templates:', error);
      message.error('Failed to load QC check templates');
    }
  };

  const startQC = async (job: any) => {
    try {
      setLoading(true);
      const response = await api.post('/api/quality-control/execute', {
        jobId: job.id,
      });
      setSelectedJob(response.data);
      setCheckResults([]);
      setStep(1);
      setCurrentCheckIndex(0);
      message.success('QC started for job ' + job.jobNo);
    } catch (error) {
      console.error('Failed to start QC:', error);
      message.error('Failed to start QC');
    } finally {
      setLoading(false);
    }
  };

  const recordCheckResult = async (result: QCCheckResult) => {
    try {
      setLoading(true);
      if (selectedJob) {
        await api.post(
          `/api/quality-control/${selectedJob.id}/record-check`,
          result,
        );
        const updated = [...checkResults];
        const idx = updated.findIndex(
          (r) => r.checkName === result.checkName,
        );
        if (idx >= 0) {
          updated[idx] = result;
        } else {
          updated.push(result);
        }
        setCheckResults(updated);
        
        if (currentCheckIndex < checkTemplates.length - 1) {
          setCurrentCheckIndex(currentCheckIndex + 1);
          message.success('Check recorded');
        } else {
          setStep(2);
          message.success('All checks recorded');
        }
      }
    } catch (error) {
      console.error('Failed to record check:', error);
      message.error('Failed to record check result');
    } finally {
      setLoading(false);
    }
  };

  const completeQC = async (overallResult: 'PASS' | 'FAIL' | 'HOLD') => {
    try {
      setLoading(true);
      if (selectedJob) {
        const response = await api.patch(
          `/api/quality-control/${selectedJob.id}/complete`,
          {
            overallResult,
            notes: form.getFieldValue('notes'),
          },
        );
        setSelectedJob(response.data);
        setStep(3);
        message.success(`QC completed: ${overallResult}`);
      }
    } catch (error) {
      console.error('Failed to complete QC:', error);
      message.error('Failed to complete QC');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (result: string) => {
    switch (result) {
      case 'PASS':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'FAIL':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'HOLD':
        return <PauseCircleOutlined style={{ color: '#faad14' }} />;
      default:
        return null;
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'PASS':
        return 'success';
      case 'FAIL':
        return 'error';
      case 'HOLD':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (!selectedJob) {
    return (
      <Card title="Quality Control - Job Selection" loading={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Table
              dataSource={jobs}
              columns={[
                {
                  title: 'Job Number',
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
                  title: 'Colour',
                  dataIndex: 'colour',
                  key: 'colour',
                },
                {
                  title: 'Quantity',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  render: (q: number) => `${q} kg`,
                },
                {
                  title: 'Action',
                  key: 'action',
                  render: (_, record) => (
                    <Button
                      type="primary"
                      onClick={() => startQC(record)}
                      loading={loading}
                    >
                      Start QC
                    </Button>
                  ),
                },
              ]}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Col>
        </Row>
      </Card>
    );
  }

  const currentTemplate = checkTemplates[currentCheckIndex];

  return (
    <Spin spinning={loading}>
      <Card title={`QC Execution - ${selectedJob.jobNo}`}>
        {/* Job Header */}
        <Row gutter={[16, 16]} className="mb-24">
          <Col xs={24} md={6}>
            <div className="qc-info">
              <div className="label">Job Number</div>
              <div className="value" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {selectedJob.jobNo}
              </div>
            </div>
          </Col>
          <Col xs={24} md={6}>
            <div className="qc-info">
              <div className="label">Customer</div>
              <div className="value">{selectedJob.customerName}</div>
            </div>
          </Col>
          <Col xs={24} md={6}>
            <div className="qc-info">
              <div className="label">Fabric</div>
              <div className="value">{selectedJob.fabricType}</div>
            </div>
          </Col>
          <Col xs={24} md={6}>
            <div className="qc-info">
              <div className="label">Colour</div>
              <div className="value">{selectedJob.colour}</div>
            </div>
          </Col>
        </Row>

        <Divider />

        {/* Steps Progress */}
        <Steps
          current={step}
          status={selectedJob.qcStatus === 'COMPLETED' ? 'finish' : 'process'}
          style={{ marginBottom: '32px' }}
        >
          <Steps.Step title="Job Selection" />
          <Steps.Step title="Record Checks" />
          <Steps.Step title="Review Results" />
          <Steps.Step title="Complete QC" />
        </Steps>

        {step === 1 && currentTemplate && (
          <Card title={`Check ${currentCheckIndex + 1} of ${checkTemplates.length}`}>
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Form layout="vertical">
                  <Form.Item
                    label={`${currentTemplate.checkName} (${currentTemplate.checkCode})`}
                    required
                  >
                    <div style={{ marginBottom: '16px', color: '#666' }}>
                      {currentTemplate.checkType === 'NUMERIC' && (
                        <div>
                          <p>Type: Numeric</p>
                          {currentTemplate.targetValue && (
                            <p>Target: {currentTemplate.targetValue}</p>
                          )}
                          {currentTemplate.tolerance && (
                            <p>Tolerance: ±{currentTemplate.tolerance}</p>
                          )}
                        </div>
                      )}
                      {currentTemplate.checkType === 'TEXT' && (
                        <p>Type: Text</p>
                      )}
                      {currentTemplate.checkType === 'BOOLEAN' && (
                        <p>Type: Pass/Fail</p>
                      )}
                    </div>
                  </Form.Item>

                  <Form.Item label="Actual Value" required>
                    <Input
                      id="actual-value"
                      placeholder="Enter actual value"
                      type={currentTemplate.checkType === 'NUMERIC' ? 'number' : 'text'}
                    />
                  </Form.Item>

                  <Form.Item label="Result">
                    <Select
                      id="result-select"
                      placeholder="Select result"
                      options={[
                        { label: '✓ PASS', value: 'PASS' },
                        { label: '✗ FAIL', value: 'FAIL' },
                        { label: '⊘ HOLD', value: 'HOLD' },
                      ]}
                    />
                  </Form.Item>

                  <Form.Item label="Remarks">
                    <Input.TextArea
                      id="check-remarks"
                      placeholder="Optional remarks"
                      rows={3}
                    />
                  </Form.Item>

                  <Space>
                    <Button
                      type="primary"
                      onClick={() => {
                        const actualValue = (document.getElementById('actual-value') as HTMLInputElement)?.value;
                        const result = (document.getElementById('result-select') as HTMLSelectElement)?.value || 'PASS';
                        const remarks = (document.getElementById('check-remarks') as HTMLTextAreaElement)?.value;
                        
                        recordCheckResult({
                          id: currentTemplate.id,
                          checkName: currentTemplate.checkName,
                          checkCode: currentTemplate.checkCode,
                          targetValue: currentTemplate.targetValue,
                          actualValue,
                          result: result as 'PASS' | 'FAIL' | 'HOLD',
                          remarks,
                        });
                      }}
                    >
                      Save & {currentCheckIndex < checkTemplates.length - 1 ? 'Next' : 'Finish'}
                    </Button>
                    <Button onClick={() => setStep(2)}>
                      Skip to Review
                    </Button>
                  </Space>
                </Form>
              </Col>
            </Row>
          </Card>
        )}

        {step === 2 && (
          <Card title="Review All Check Results">
            <Table
              dataSource={checkResults}
              columns={[
                {
                  title: 'Check',
                  dataIndex: 'checkCode',
                  key: 'checkCode',
                  render: (code: string, record) => (
                    <div>
                      <strong>{record.checkName}</strong>
                      <br />
                      <small style={{ color: '#999' }}>{code}</small>
                    </div>
                  ),
                },
                {
                  title: 'Target',
                  dataIndex: 'targetValue',
                  key: 'targetValue',
                  width: 100,
                },
                {
                  title: 'Actual',
                  dataIndex: 'actualValue',
                  key: 'actualValue',
                  width: 100,
                },
                {
                  title: 'Result',
                  dataIndex: 'result',
                  key: 'result',
                  render: (result: string) => (
                    <Tag color={getResultColor(result)} icon={getStatusIcon(result)}>
                      {result}
                    </Tag>
                  ),
                },
                {
                  title: 'Remarks',
                  dataIndex: 'remarks',
                  key: 'remarks',
                  width: 200,
                },
              ]}
              rowKey="checkCode"
              pagination={false}
            />

            <Divider />

            <Form form={form} layout="vertical">
              <Form.Item
                name="notes"
                label="Overall Remarks"
              >
                <Input.TextArea rows={3} placeholder="Any overall remarks about the inspection..." />
              </Form.Item>
            </Form>

            <Space>
              <Button onClick={() => setStep(1)}>Back to Checks</Button>
              <Button
                type="primary"
                onClick={() => setStep(3)}
              >
                Proceed to Complete
              </Button>
            </Space>
          </Card>
        )}

        {step === 3 && (
          <Card title="Complete QC Execution">
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <div style={{ marginBottom: '24px' }}>
                  <h3>Summary of Results:</h3>
                  <Timeline
                    items={checkResults.map((result) => ({
                      dot:
                        result.result === 'PASS' ? (
                          <CheckCircleOutlined
                            style={{ fontSize: '16px', color: '#52c41a' }}
                          />
                        ) : result.result === 'FAIL' ? (
                          <ExclamationCircleOutlined
                            style={{ fontSize: '16px', color: '#ff4d4f' }}
                          />
                        ) : (
                          <PauseCircleOutlined
                            style={{ fontSize: '16px', color: '#faad14' }}
                          />
                        ),
                      children: (
                        <div>
                          <strong>{result.checkName}</strong> ({result.checkCode}){' '}
                          <Tag color={getResultColor(result.result)}>
                            {result.result}
                          </Tag>
                          {result.actualValue && (
                            <div style={{ color: '#666', marginTop: '4px' }}>
                              Actual: {result.actualValue}
                            </div>
                          )}
                        </div>
                      ),
                    }))}
                  />
                </div>

                <Divider />

                <div style={{ marginBottom: '24px' }}>
                  <h3>Choose Final Result:</h3>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      size="large"
                      style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                      onClick={() => completeQC('PASS')}
                      block
                    >
                      ✓ PASS - Quality Approved
                    </Button>
                    <Button
                      danger
                      size="large"
                      onClick={() => completeQC('FAIL')}
                      block
                    >
                      ✗ FAIL - Send for Reprocessing
                    </Button>
                    <Button
                      style={{ backgroundColor: '#faad14', borderColor: '#faad14' }}
                      size="large"
                      onClick={() => completeQC('HOLD')}
                      block
                    >
                      ⊘ HOLD - Pending Decision
                    </Button>
                  </Space>
                </div>
              </Col>
            </Row>
          </Card>
        )}

        {selectedJob.qcStatus === 'COMPLETED' && step === 3 && (
          <Card type="inner" style={{ marginTop: '16px', backgroundColor: '#f6f8fb' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Badge
                    count={
                      selectedJob.overallResult === 'PASS' ? (
                        <CheckCircleOutlined
                          style={{ fontSize: '32px', color: '#52c41a' }}
                        />
                      ) : selectedJob.overallResult === 'FAIL' ? (
                        <ExclamationCircleOutlined
                          style={{ fontSize: '32px', color: '#ff4d4f' }}
                        />
                      ) : (
                        <PauseCircleOutlined
                          style={{ fontSize: '32px', color: '#faad14' }}
                        />
                      )
                    }
                  />
                  <h2 style={{ marginTop: '16px' }}>
                    QC Result: {selectedJob.overallResult}
                  </h2>
                  <p style={{ color: '#666' }}>
                    Completed by: {selectedJob.inspectorName}
                  </p>
                  <p style={{ color: '#666' }}>
                    Date: {new Date(selectedJob.completedAt).toLocaleString()}
                  </p>
                </div>
              </Col>
            </Row>

            <Divider />

            <Space>
              <Button onClick={() => window.print()}>Print Report</Button>
              <Button
                type="primary"
                onClick={() => {
                  setSelectedJob(null);
                  setStep(0);
                  loadJobsForQC();
                }}
              >
                Back to Job List
              </Button>
            </Space>
          </Card>
        )}

        <Divider />

        <Button
          onClick={() => {
            setSelectedJob(null);
            setStep(0);
          }}
          style={{ marginTop: '16px' }}
        >
          Cancel QC
        </Button>
      </Card>
    </Spin>
  );
};

export default QCExecution;
