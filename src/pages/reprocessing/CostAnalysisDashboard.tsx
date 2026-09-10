import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Spin,
  message,
  Divider,
  Space,
  Statistic,
  Empty,
  Tag,
  Modal,
  Select,
  DatePicker,
  Chart,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Segmented,
} from 'antd';
import {
  DollarOutlined,
  PercentageOutlined,
  ThunderboltOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import api from '../../api/config';
import dayjs from 'dayjs';

interface CostAnalysisData {
  jobNo: string;
  customerName: string;
  fabricType: string;
  originalInput: number;
  originalOutput: number;
  originalLoss: number;
  originalRate: number;
  originalCost: number;
  reprocessCycles: Array<{
    cycleNumber: number;
    input: number;
    output: number;
    loss: number;
    cost: number;
  }>;
  totalReprocessLoss: number;
  totalAdditionalCost: number;
  netProfitability: number;
  profitabilityPercentage: number;
}

interface CostAnalysisSummary {
  totalJobs: number;
  totalOriginalCost: number;
  totalAdditionalCost: number;
  totalReprocessLoss: number;
  averageProfitability: number;
  averageCyclesPerJob: number;
}

const CostAnalysisDashboard: React.FC = () => {
  const [data, setData] = useState<CostAnalysisData[]>([]);
  const [summary, setSummary] = useState<CostAnalysisSummary | null>(null);
  const [selectedJob, setSelectedJob] = useState<CostAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const [filterJobNo, setFilterJobNo] = useState('');
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);

  useEffect(() => {
    loadCostAnalysis();
  }, [filterJobNo, dateRange]);

  const loadCostAnalysis = async () => {
    try {
      setLoading(true);
      const params: any = {};

      if (filterJobNo) {
        params.jobNo = filterJobNo;
      }

      if (dateRange) {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }

      const response = await api.get('/api/reprocessing/cost-analysis', {
        params,
      });

      if (response.data) {
        setData(response.data.jobs || []);
        setSummary(response.data.summary || null);
      }
    } catch (error) {
      console.error('Failed to load cost analysis:', error);
      message.error('Failed to load cost analysis data');
    } finally {
      setLoading(false);
    }
  };

  const getCostAnalysisColor = (profitability: number) => {
    if (profitability >= 90) return '#52c41a'; // Green
    if (profitability >= 70) return '#faad14'; // Yellow
    return '#ff4d4f'; // Red
  };

  if (!selectedJob) {
    return (
      <Spin spinning={loading}>
        <Card title="Reprocessing Cost Analysis Dashboard">
          {/* Summary Stats */}
          {summary && (
            <>
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} md={6}>
                  <Card>
                    <Statistic
                      title="Jobs Analyzed"
                      value={summary.totalJobs}
                      prefix={<FilterOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={6}>
                  <Card>
                    <Statistic
                      title="Total Original Cost"
                      value={summary.totalOriginalCost}
                      prefix="₹"
                      precision={2}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={6}>
                  <Card>
                    <Statistic
                      title="Total Additional Cost"
                      value={summary.totalAdditionalCost}
                      prefix="₹"
                      precision={2}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={6}>
                  <Card>
                    <Statistic
                      title="Avg Profitability"
                      value={summary.averageProfitability}
                      suffix="%"
                      precision={1}
                      valueStyle={{
                        color: getCostAnalysisColor(
                          summary.averageProfitability,
                        ),
                      }}
                    />
                  </Card>
                </Col>
              </Row>

              <Divider />
            </>
          )}

          {/* Filters */}
          <Card style={{ marginBottom: '16px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <label>Job Number</label>
                <input
                  type="text"
                  placeholder="Filter by job number"
                  value={filterJobNo}
                  onChange={(e) => setFilterJobNo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                  }}
                />
              </Col>
              <Col xs={24} md={12}>
                <label>Date Range</label>
                {/* Date range picker component would go here */}
              </Col>
              <Col xs={24} md={4} style={{ textAlign: 'right' }}>
                <Button type="primary" onClick={() => loadCostAnalysis()}>
                  Search
                </Button>
              </Col>
            </Row>
          </Card>

          {/* View Mode Toggle */}
          <div style={{ marginBottom: '16px' }}>
            <Segmented
              options={[
                { label: 'Summary View', value: 'summary' },
                { label: 'Detailed View', value: 'detailed' },
              ]}
              value={viewMode}
              onChange={(val) => setViewMode(val as 'summary' | 'detailed')}
            />
          </div>

          {/* Data Table */}
          {data.length === 0 ? (
            <Empty description="No cost analysis data available" />
          ) : (
            <Table
              dataSource={data}
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
                  title: 'Original Cost',
                  dataIndex: 'originalCost',
                  key: 'originalCost',
                  render: (cost: number) => `₹${cost.toFixed(2)}`,
                  width: 130,
                },
                {
                  title: 'Additional Cost',
                  dataIndex: 'totalAdditionalCost',
                  key: 'totalAdditionalCost',
                  render: (cost: number) => (
                    <span style={{ color: '#ff4d4f' }}>₹{cost.toFixed(2)}</span>
                  ),
                  width: 130,
                },
                {
                  title: 'Profitability',
                  dataIndex: 'profitabilityPercentage',
                  key: 'profitabilityPercentage',
                  render: (pct: number) => (
                    <Tag
                      color={getCostAnalysisColor(pct)}
                      style={{
                        color: '#fff',
                      }}
                    >
                      {pct.toFixed(1)}%
                    </Tag>
                  ),
                  width: 100,
                },
                {
                  title: 'Cycles',
                  dataIndex: 'reprocessCycles',
                  key: 'cycles',
                  render: (cycles: any[]) => cycles.length,
                  width: 70,
                },
                {
                  title: 'Action',
                  key: 'action',
                  render: (_, record) => (
                    <Button
                      type="link"
                      onClick={() => setSelectedJob(record)}
                    >
                      Details
                    </Button>
                  ),
                },
              ]}
              rowKey="jobNo"
              pagination={{ pageSize: 15 }}
              scroll={{ x: 1200 }}
            />
          )}
        </Card>
      </Spin>
    );
  }

  // Detailed View
  return (
    <Spin spinning={loading}>
      <Card title={`Cost Analysis - ${selectedJob.jobNo}`}>
        {/* Header */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} md={6}>
            <div>
              <div style={{ color: '#666', marginBottom: '4px' }}>
                Customer
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {selectedJob.customerName}
              </div>
            </div>
          </Col>
          <Col xs={24} md={6}>
            <div>
              <div style={{ color: '#666', marginBottom: '4px' }}>
                Fabric
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {selectedJob.fabricType}
              </div>
            </div>
          </Col>
          <Col xs={24} md={6}>
            <div>
              <div style={{ color: '#666', marginBottom: '4px' }}>
                Profitability
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: getCostAnalysisColor(
                    selectedJob.profitabilityPercentage,
                  ),
                }}
              >
                {selectedJob.profitabilityPercentage.toFixed(1)}%
              </div>
            </div>
          </Col>
          <Col xs={24} md={6}>
            <div>
              <div style={{ color: '#666', marginBottom: '4px' }}>
                Reprocess Cycles
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {selectedJob.reprocessCycles.length}
              </div>
            </div>
          </Col>
        </Row>

        <Divider />

        {/* Original Execution */}
        <Card type="inner" title="Original Execution" style={{ marginBottom: '16px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <Statistic
                title="Input"
                value={selectedJob.originalInput}
                suffix="kg"
              />
            </Col>
            <Col xs={24} md={6}>
              <Statistic
                title="Output"
                value={selectedJob.originalOutput}
                suffix="kg"
              />
            </Col>
            <Col xs={24} md={6}>
              <Statistic
                title="Loss"
                value={selectedJob.originalLoss}
                suffix="kg"
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
            <Col xs={24} md={6}>
              <Statistic
                title="Cost"
                value={selectedJob.originalCost}
                prefix="₹"
                precision={2}
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            <Col xs={24} md={6}>
              <Statistic
                title="Rate/kg"
                value={selectedJob.originalRate}
                prefix="₹"
                precision={2}
              />
            </Col>
            <Col xs={24} md={6}>
              <Statistic
                title="Loss %"
                value={(
                  (selectedJob.originalLoss / selectedJob.originalInput) *
                  100
                ).toFixed(2)}
                suffix="%"
              />
            </Col>
          </Row>
        </Card>

        {/* Reprocess Cycles */}
        {selectedJob.reprocessCycles.length > 0 && (
          <Card
            type="inner"
            title={`Reprocessing Cycles (${selectedJob.reprocessCycles.length})`}
            style={{ marginBottom: '16px' }}
          >
            <Table
              dataSource={selectedJob.reprocessCycles}
              columns={[
                {
                  title: 'Cycle',
                  dataIndex: 'cycleNumber',
                  key: 'cycleNumber',
                  render: (num: number) => `Cycle #${num}`,
                  width: 100,
                },
                {
                  title: 'Input',
                  dataIndex: 'input',
                  key: 'input',
                  render: (val: number) => `${val} kg`,
                  width: 100,
                },
                {
                  title: 'Output',
                  dataIndex: 'output',
                  key: 'output',
                  render: (val: number) => `${val} kg`,
                  width: 100,
                },
                {
                  title: 'Loss',
                  dataIndex: 'loss',
                  key: 'loss',
                  render: (val: number) => (
                    <span style={{ color: '#ff4d4f' }}>{val} kg</span>
                  ),
                  width: 100,
                },
                {
                  title: 'Cost',
                  dataIndex: 'cost',
                  key: 'cost',
                  render: (val: number) => (
                    <span style={{ color: '#ff4d4f' }}>₹{val.toFixed(2)}</span>
                  ),
                  width: 130,
                },
              ]}
              rowKey="cycleNumber"
              pagination={false}
              size="small"
            />

            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
              <Col xs={24} md={6}>
                <Statistic
                  title="Total Reprocess Loss"
                  value={selectedJob.totalReprocessLoss}
                  suffix="kg"
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
              <Col xs={24} md={6}>
                <Statistic
                  title="Total Additional Cost"
                  value={selectedJob.totalAdditionalCost}
                  prefix="₹"
                  precision={2}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
            </Row>
          </Card>
        )}

        {/* Summary */}
        <Card type="inner" title="Cost Impact Analysis">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{ color: '#666', marginBottom: '8px' }}>
                  Original Cost
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                  ₹{selectedJob.originalCost.toFixed(2)}
                </div>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ padding: '16px', backgroundColor: '#ffe7e7', borderRadius: '4px' }}>
                <div style={{ color: '#666', marginBottom: '8px' }}>
                  Additional Cost
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f', marginBottom: '8px' }}>
                  ₹{selectedJob.totalAdditionalCost.toFixed(2)}
                </div>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{
                padding: '16px',
                backgroundColor: getCostAnalysisColor(selectedJob.profitabilityPercentage) === '#52c41a' ? '#f6ffed' : '#fff7e6',
                borderRadius: '4px',
              }}>
                <div style={{ color: '#666', marginBottom: '8px' }}>
                  Profitability Score
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: getCostAnalysisColor(selectedJob.profitabilityPercentage),
                  marginBottom: '8px',
                }}>
                  {selectedJob.profitabilityPercentage.toFixed(1)}%
                </div>
              </div>
            </Col>
          </Row>

          <Divider />

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <div style={{ padding: '12px', backgroundColor: '#f0f2f5', borderRadius: '4px' }}>
                <p style={{ margin: 0, marginBottom: '8px' }}>
                  <strong>Profitability Score Calculation:</strong>
                </p>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  Score = (Original Cost - Total Additional Cost) / Original Cost × 100
                </p>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  = (₹{selectedJob.originalCost.toFixed(2)} - ₹{selectedJob.totalAdditionalCost.toFixed(2)}) / ₹{selectedJob.originalCost.toFixed(2)} × 100
                </p>
                <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                  = {selectedJob.profitabilityPercentage.toFixed(1)}%
                </p>
              </div>
            </Col>
          </Row>
        </Card>

        <Divider />

        <Space>
          <Button onClick={() => setSelectedJob(null)}>Back to Analysis</Button>
          <Button type="primary" onClick={() => window.print()}>
            Print Report
          </Button>
        </Space>
      </Card>
    </Spin>
  );
};

export default CostAnalysisDashboard;
