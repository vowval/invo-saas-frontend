'use client';

import React, { useState } from 'react';
import { Card, Form, Input, InputNumber, Select, Button, Steps, Space, message } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';

type DryingProcessType = 'HYDRO_EXTRACTION' | 'TUMBLE_DRY' | 'NATURAL_DRY';
type DryingBatchStatus = 'PENDING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'ON_HOLD' | 'REJECTED';

interface DryingBatch {
  id: string;
  batchNumber: string;
  jobId: string;
  processType: DryingProcessType;
  status: DryingBatchStatus;
  inputQuantity: number;
  outputQuantity?: number;
  lossQuantity?: number;
  lossPercentage?: number;
  actualParameters?: Record<string, any>;
  remarks?: string;
  startedAt?: string;
  completedAt?: string;
}

const DryingExecutionPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedBatch, setSelectedBatch] = useState<DryingBatch | null>(null);

  // Step 1: Select Job
  const handleJobSelection = (jobId: string) => {
    form.setFieldValue('jobId', jobId);
    setCurrentStep(1);
  };

  // Step 2: Create Batch
  const handleCreateBatch = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/drying-execution/create-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...values,
          uom: values.uom || 'kg',
          operatorId: localStorage.getItem('userId'),
          operatorName: localStorage.getItem('userName') || 'Operator',
        }),
      });

      if (response.ok) {
        const batch = await response.json();
        setSelectedBatch(batch);
        message.success('Drying batch created successfully');
        setCurrentStep(2);
      } else {
        message.error('Failed to create batch');
      }
    } catch (error) {
      message.error('Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Start Batch
  const handleStartBatch = async () => {
    if (!selectedBatch) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/drying-execution/${selectedBatch.id}/start`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const batch = await response.json();
        setSelectedBatch(batch);
        message.success('Batch started');
        setCurrentStep(3);
      }
    } catch (error) {
      message.error('Failed to start batch');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Record Parameters
  const handleRecordParameters = async (values: any) => {
    if (!selectedBatch) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/drying-execution/${selectedBatch.id}/record-parameters`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            actualParameters: values.actualParameters || {},
          }),
        },
      );

      if (response.ok) {
        const batch = await response.json();
        setSelectedBatch(batch);
        message.success('Parameters recorded');
        setCurrentStep(4);
      }
    } catch (error) {
      message.error('Failed to record parameters');
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Complete Batch
  const handleCompleteBatch = async (values: any) => {
    if (!selectedBatch) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/drying-execution/${selectedBatch.id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          outputQuantity: values.outputQuantity,
          qualityNotes: values.qualityNotes,
          remarks: values.remarks,
        }),
      });

      if (response.ok) {
        const batch = await response.json();
        setSelectedBatch(batch);
        message.success('Batch completed successfully');
        setCurrentStep(5);
      }
    } catch (error) {
      message.error('Failed to complete batch');
    } finally {
      setLoading(false);
    }
  };

  // Pause Batch
  const handlePauseBatch = async () => {
    if (!selectedBatch) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/drying-execution/${selectedBatch.id}/pause`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ reason: 'Operator paused batch' }),
      });

      if (response.ok) {
        const batch = await response.json();
        setSelectedBatch(batch);
        message.success('Batch paused');
      }
    } catch (error) {
      message.error('Failed to pause batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Drying Production Execution" style={{ marginBottom: '24px' }}>
        <Steps
          current={currentStep}
          items={[
            { title: 'Select Job' },
            { title: 'Create Batch' },
            { title: 'Start Batch' },
            { title: 'Record Parameters' },
            { title: 'Complete' },
            { title: 'Finished' },
          ]}
        />
      </Card>

      {currentStep === 0 && (
        <Card title="Step 1: Select Job">
          <Form layout="vertical" onFinish={(values) => handleJobSelection(values.jobId)}>
            <Form.Item label="Job ID" name="jobId" rules={[{ required: true }]}>
              <Input placeholder="Enter Job ID" />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Continue
            </Button>
          </Form>
        </Card>
      )}

      {currentStep >= 1 && (
        <Card title="Step 2: Create Drying Batch" style={{ marginBottom: '24px' }}>
          <Form form={form} layout="vertical" onFinish={handleCreateBatch}>
            <Form.Item label="Process Type" name="processType" rules={[{ required: true }]}>
              <Select
                placeholder="Select drying process type"
                options={[
                  { label: 'Hydro Extraction', value: 'HYDRO_EXTRACTION' },
                  { label: 'Tumble Dry', value: 'TUMBLE_DRY' },
                  { label: 'Natural Dry', value: 'NATURAL_DRY' },
                ]}
              />
            </Form.Item>

            <Form.Item label="Input Quantity" name="inputQuantity" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} placeholder="Enter input quantity" />
            </Form.Item>

            <Form.Item label="Machine ID" name="machineId">
              <Input placeholder="Enter machine ID" />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading}>
              Create Batch
            </Button>
          </Form>
        </Card>
      )}

      {selectedBatch && currentStep >= 2 && (
        <Card title={`Batch: ${selectedBatch.batchNumber}`} style={{ marginBottom: '24px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <p>
              <strong>Status:</strong> {selectedBatch.status}
            </p>
            <p>
              <strong>Input:</strong> {selectedBatch.inputQuantity} kg
            </p>

            {currentStep === 2 && selectedBatch.status === 'PENDING' && (
              <Button type="primary" onClick={handleStartBatch} loading={loading}>
                Start Batch
              </Button>
            )}

            {selectedBatch.status === 'IN_PROGRESS' && (
              <Space>
                <Button onClick={handlePauseBatch} loading={loading}>
                  Pause
                </Button>
                <Button type="primary" onClick={() => setCurrentStep(4)}>
                  Complete
                </Button>
              </Space>
            )}
          </Space>
        </Card>
      )}

      {currentStep >= 3 && selectedBatch?.status === 'IN_PROGRESS' && (
        <Card title="Step 3: Record Parameters" style={{ marginBottom: '24px' }}>
          <Form layout="vertical" onFinish={handleRecordParameters}>
            {selectedBatch.processType === 'HYDRO_EXTRACTION' && (
              <>
                <Form.Item label="Cycle" name={['actualParameters', 'cycle']}>
                  <InputNumber />
                </Form.Item>
                <Form.Item label="Speed (RPM)" name={['actualParameters', 'speed']}>
                  <InputNumber />
                </Form.Item>
              </>
            )}
            {selectedBatch.processType === 'TUMBLE_DRY' && (
              <>
                <Form.Item label="Temperature (°C)" name={['actualParameters', 'temperature']}>
                  <InputNumber />
                </Form.Item>
                <Form.Item label="Duration (min)" name={['actualParameters', 'duration']}>
                  <InputNumber />
                </Form.Item>
              </>
            )}
            <Button type="primary" htmlType="submit" loading={loading}>
              Record Parameters
            </Button>
          </Form>
        </Card>
      )}

      {currentStep >= 4 && selectedBatch && (
        <Card title="Step 4: Complete Batch" style={{ marginBottom: '24px' }}>
          <Form layout="vertical" onFinish={handleCompleteBatch}>
            <Form.Item
              label="Output Quantity (kg)"
              name="outputQuantity"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: '100%' }} max={selectedBatch.inputQuantity * 1.2} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Complete Batch
            </Button>
          </Form>
        </Card>
      )}

      {currentStep === 5 && selectedBatch?.status === 'COMPLETED' && (
        <Card title="Completed">
          <p>Batch {selectedBatch.batchNumber} completed successfully</p>
          <Button
            type="primary"
            onClick={() => {
              setCurrentStep(0);
              setSelectedBatch(null);
              form.resetFields();
            }}
          >
            New Batch
          </Button>
        </Card>
      )}
    </div>
  );
};

export default DryingExecutionPage;
