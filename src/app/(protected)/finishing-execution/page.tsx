'use client';

import React, { useState } from 'react';
import { Card, Form, Input, InputNumber, Select, Button, Steps, Space, message } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { apiFetch } from '@/lib/api';

type FinishingProcessType =
  | 'SOFTENER'
  | 'SILICON_SOFTENER'
  | 'STENTER'
  | 'COMPACTING'
  | 'SANFORIZING'
  | 'CALENDARING'
  | 'BRUSHING'
  | 'ANTI_PILLING';

type FinishingBatchStatus = 'PENDING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'ON_HOLD' | 'REJECTED';

interface FinishingBatch {
  id: string;
  batchNumber: string;
  jobId: string;
  processType: FinishingProcessType;
  status: FinishingBatchStatus;
  inputQuantity: number;
  outputQuantity?: number;
  lossQuantity?: number;
  lossPercentage?: number;
  finalWidth?: number;
  finalShrinkage?: number;
  actualParameters?: Record<string, any>;
  remarks?: string;
  startedAt?: string;
  completedAt?: string;
}

const FinishingExecutionPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedBatch, setSelectedBatch] = useState<FinishingBatch | null>(null);

  // Step 1: Select Job
  const handleJobSelection = (jobId: string) => {
    form.setFieldValue('jobId', jobId);
    setCurrentStep(1);
  };

  // Step 2: Create Batch
  const handleCreateBatch = async (values: any) => {
    setLoading(true);
    try {
      const batch = await apiFetch('/api/finishing-execution/create-batch', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          uom: values.uom || 'kg',
          operatorId: localStorage.getItem('userId'),
          operatorName: localStorage.getItem('userName') || 'Operator',
        }),
      });

      setSelectedBatch(batch);
      message.success('Finishing batch created successfully');
      setCurrentStep(2);
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
      const batch = await apiFetch(`/api/finishing-execution/${selectedBatch.id}/start`, {
        method: 'PATCH',
      });

      setSelectedBatch(batch);
      message.success('Batch started');
      setCurrentStep(3);
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
      const batch = await apiFetch(
        `/api/finishing-execution/${selectedBatch.id}/record-parameters`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            actualParameters: values.actualParameters || {},
            finalWidth: values.finalWidth,
            finalShrinkage: values.finalShrinkage,
          }),
        },
      );

      setSelectedBatch(batch);
      message.success('Parameters recorded');
      setCurrentStep(4);
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
      const batch = await apiFetch(`/api/finishing-execution/${selectedBatch.id}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({
          outputQuantity: values.outputQuantity,
          qualityNotes: values.qualityNotes,
          remarks: values.remarks,
        }),
      });

      setSelectedBatch(batch);
      message.success('Batch completed successfully');
      setCurrentStep(5);
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
      const batch = await apiFetch(`/api/finishing-execution/${selectedBatch.id}/pause`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: 'Operator paused batch' }),
      });

      setSelectedBatch(batch);
      message.success('Batch paused');
    } catch (error) {
      message.error('Failed to pause batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Finishing Production Execution" style={{ marginBottom: '24px' }}>
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
        <Card title="Step 2: Create Finishing Batch" style={{ marginBottom: '24px' }}>
          <Form form={form} layout="vertical" onFinish={handleCreateBatch}>
            <Form.Item label="Process Type" name="processType" rules={[{ required: true }]}>
              <Select
                placeholder="Select finishing process type"
                options={[
                  { label: 'Softener', value: 'SOFTENER' },
                  { label: 'Silicon Softener', value: 'SILICON_SOFTENER' },
                  { label: 'Stenter', value: 'STENTER' },
                  { label: 'Compacting', value: 'COMPACTING' },
                  { label: 'Sanforizing', value: 'SANFORIZING' },
                  { label: 'Calendaring', value: 'CALENDARING' },
                  { label: 'Brushing', value: 'BRUSHING' },
                  { label: 'Anti-Pilling', value: 'ANTI_PILLING' },
                ]}
              />
            </Form.Item>

            <Form.Item label="Input Quantity" name="inputQuantity" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} placeholder="Enter input quantity" />
            </Form.Item>

            <Form.Item label="Machine ID" name="machineId">
              <Input placeholder="Enter machine ID" />
            </Form.Item>

            <Form.Item label="Recipe Name" name="recipeName">
              <Input placeholder="Enter recipe name (e.g., dosage for softener)" />
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
              <strong>Process:</strong> {selectedBatch.processType}
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
            {selectedBatch.processType === 'SOFTENER' && (
              <>
                <Form.Item label="Dosage (ml/kg)" name={['actualParameters', 'dosage']}>
                  <InputNumber />
                </Form.Item>
                <Form.Item label="Temperature (°C)" name={['actualParameters', 'temperature']}>
                  <InputNumber />
                </Form.Item>
                <Form.Item label="Time (minutes)" name={['actualParameters', 'time']}>
                  <InputNumber />
                </Form.Item>
              </>
            )}

            {selectedBatch.processType === 'SILICON_SOFTENER' && (
              <>
                <Form.Item label="Silicone Type" name={['actualParameters', 'siliconeType']}>
                  <Input />
                </Form.Item>
                <Form.Item label="Dosage (ml/kg)" name={['actualParameters', 'dosage']}>
                  <InputNumber />
                </Form.Item>
                <Form.Item label="Temperature (°C)" name={['actualParameters', 'temperature']}>
                  <InputNumber />
                </Form.Item>
                <Form.Item label="pH" name={['actualParameters', 'pH']}>
                  <InputNumber step={0.1} />
                </Form.Item>
              </>
            )}

            {selectedBatch.processType === 'STENTER' && (
              <>
                <Form.Item label="Width (cm)" name="finalWidth">
                  <InputNumber />
                </Form.Item>
                <Form.Item label="Temperature (°C)" name={['actualParameters', 'temperature']}>
                  <InputNumber />
                </Form.Item>
                <Form.Item label="Speed" name={['actualParameters', 'speed']}>
                  <InputNumber />
                </Form.Item>
              </>
            )}

            {selectedBatch.processType === 'COMPACTING' && (
              <>
                <Form.Item label="Width (cm)" name="finalWidth">
                  <InputNumber />
                </Form.Item>
                <Form.Item label="Shrinkage (%)" name="finalShrinkage">
                  <InputNumber step={0.1} />
                </Form.Item>
              </>
            )}

            {selectedBatch.processType === 'SANFORIZING' && (
              <>
                <Form.Item label="Shrinkage (%)" name="finalShrinkage">
                  <InputNumber step={0.1} />
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
            <Form.Item label="Quality Notes" name="qualityNotes">
              <Input.TextArea rows={3} />
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
          <p>
            Loss: {selectedBatch.lossQuantity} kg ({selectedBatch.lossPercentage}%)
          </p>
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

export default FinishingExecutionPage;
