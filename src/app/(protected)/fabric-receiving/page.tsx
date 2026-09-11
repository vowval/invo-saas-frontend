'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Table, Modal, message, Spin, Card, Row, Col, InputNumber, Select, DatePicker, Upload, Table as AntTable } from 'antd';
import { PlusOutlined, DeleteOutlined, FileOutlined } from '@ant-design/icons';
import { apiFetch } from '@/lib/api';
import dayjs from 'dayjs';

interface Roll {
  rollNumber: string;
  weight: number;
}

interface Lot {
  lotNumber: string;
  rolls: Roll[];
}

interface ReceivingFormData {
  customerName: string;
  customerDcNumber: string;
  customerReference?: string;
  receiptDate: string;
  vehicleNumber?: string;
  transporter?: string;
  fabricType: string;
  fabricConstruction?: string;
  composition?: string;
  colour?: string;
  grossWeight: number;
  tareWeight?: number;
  netWeight: number;
  uom: string;
  receivedBy: string;
  remarks?: string;
  lots: Lot[];
}

export default function FabricReceivingPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [lots, setLots] = useState<Lot[]>([]);
  const [currentLot, setCurrentLot] = useState<Lot | null>(null);
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [rollForm] = Form.useForm();

  // Add a new roll to current lot
  const handleAddRoll = () => {
    setModalVisible(true);
  };

  // Save roll to current lot
  const handleSaveRoll = async () => {
    try {
      const values = await rollForm.validateFields();
      const newRoll: Roll = {
        rollNumber: values.rollNumber,
        weight: values.weight,
      };

      setRolls([...rolls, newRoll]);
      rollForm.resetFields();
      setModalVisible(false);
      message.success('Roll added successfully');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Add lot with its rolls
  const handleAddLot = () => {
    if (rolls.length === 0) {
      message.error('Please add at least one roll to the lot');
      return;
    }

    const newLot: Lot = {
      lotNumber: `LOT-${Date.now()}`,
      rolls,
    };

    setLots([...lots, newLot]);
    setRolls([]);
    setCurrentLot(null);
    message.success('Lot added successfully');
  };

  // Remove lot
  const handleRemoveLot = (index: number) => {
    setLots(lots.filter((_, i) => i !== index));
    message.success('Lot removed');
  };

  // Submit fabric receipt
  const handleSubmit = async (values: any) => {
    if (lots.length === 0) {
      message.error('Please add at least one lot');
      return;
    }

    setLoading(true);
    try {
      const payload: ReceivingFormData = {
        ...values,
        receiptDate: values.receiptDate.format('YYYY-MM-DD'),
        lots: lots.map((lot) => ({
          lotNumber: lot.lotNumber,
          rolls: lot.rolls,
        })),
      };

      const response = await apiFetch('/fabric-receiving/receipt', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      message.success(`Fabric Receipt created successfully. Job No: ${response.job.jobNo}`);
      form.resetFields();
      setLots([]);
      setRolls([]);
    } catch (error) {
      message.error('Failed to create fabric receipt');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const rollColumns = [
    {
      title: 'Roll Number',
      dataIndex: 'rollNumber',
      key: 'rollNumber',
    },
    {
      title: 'Weight (kg)',
      dataIndex: 'weight',
      key: 'weight',
      render: (text: number) => text.toFixed(3),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Roll, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => setRolls(rolls.filter((_, i) => i !== index))}
        />
      ),
    },
  ];

  const lotColumns = [
    {
      title: 'Lot Number',
      dataIndex: 'lotNumber',
      key: 'lotNumber',
    },
    {
      title: 'Number of Rolls',
      dataIndex: ['rolls', 'length'],
      key: 'rollCount',
    },
    {
      title: 'Total Weight (kg)',
      key: 'totalWeight',
      render: (_: any, record: Lot) => record.rolls.reduce((sum, r) => sum + r.weight, 0).toFixed(3),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Lot, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveLot(index)}
        />
      ),
    },
  ];

  const totalNetWeight = lots.reduce((sum, lot) => sum + lot.rolls.reduce((s, r) => s + r.weight, 0), 0);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <h1>Fabric Receiving</h1>
      <p className="text-slate-500 mb-6">Create a new fabric receipt and job</p>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginBottom: '30px' }}
      >
        {/* Customer Information Section */}
        <Card title="Customer Information" style={{ marginBottom: '20px' }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="customerName"
                label="Customer Name"
                rules={[{ required: true, message: 'Customer name is required' }]}
              >
                <Input placeholder="e.g., Shree Textiles Ltd" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="customerDcNumber"
                label="Delivery Challan (DC) Number"
                rules={[{ required: true, message: 'DC number is required' }]}
              >
                <Input placeholder="e.g., DC-2026-001" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="customerReference"
                label="Customer Reference"
              >
                <Input placeholder="e.g., Order REF-001" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="receiptDate"
                label="Receipt Date"
                rules={[{ required: true, message: 'Receipt date is required' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Transport Information Section */}
        <Card title="Transport Information" style={{ marginBottom: '20px' }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="vehicleNumber"
                label="Vehicle Number"
              >
                <Input placeholder="e.g., TN-01-AB-1234" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="transporter"
                label="Transporter Name"
              >
                <Input placeholder="e.g., Swift Logistics" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Fabric Details Section */}
        <Card title="Fabric Details" style={{ marginBottom: '20px' }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="fabricType"
                label="Fabric Type"
                rules={[{ required: true, message: 'Fabric type is required' }]}
              >
                <Input placeholder="e.g., Cotton, Polyester, etc." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="fabricConstruction"
                label="Fabric Construction"
              >
                <Input placeholder="e.g., Plain Weave, Jersey, etc." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="composition"
                label="Composition"
              >
                <Input placeholder="e.g., 100% Cotton, 65% Poly 35% Cotton" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="colour"
                label="Colour / Grey"
              >
                <Input placeholder="e.g., White, Grey, Dyed Black" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Weight Information Section */}
        <Card title="Weight Information" style={{ marginBottom: '20px' }}>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="grossWeight"
                label="Gross Weight"
                rules={[{ required: true, message: 'Gross weight is required' }]}
              >
                <InputNumber min={0} step={0.001} precision={3} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="tareWeight"
                label="Tare Weight (if applicable)"
              >
                <InputNumber min={0} step={0.001} precision={3} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="netWeight"
                label="Net Weight"
                rules={[{ required: true, message: 'Net weight is required' }]}
              >
                <InputNumber min={0} step={0.001} precision={3} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="uom"
                label="Unit of Measurement"
                initialValue="kg"
              >
                <Select>
                  <Select.Option value="kg">Kilogram (kg)</Select.Option>
                  <Select.Option value="gm">Gram (gm)</Select.Option>
                  <Select.Option value="lbs">Pound (lbs)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Lots and Rolls Section */}
        <Card 
          title="Fabric Lots and Rolls" 
          style={{ marginBottom: '20px' }}
          extra={
            lots.length > 0 && Math.abs(totalNetWeight - (form.getFieldValue('netWeight') || 0)) > 0.1 ? (
              <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                ⚠️ Weight Mismatch: Rolls ({totalNetWeight.toFixed(3)} kg) ≠ Net Weight ({(form.getFieldValue('netWeight') || 0).toFixed(3)} kg)
              </span>
            ) : null
          }
        >
          <div style={{ marginBottom: '20px' }}>
            <h4>Current Rolls (for new lot)</h4>
            <Table
              dataSource={rolls}
              columns={rollColumns}
              pagination={false}
              rowKey={(_, index) => index?.toString() ?? ""}
              style={{ marginBottom: '10px' }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddRoll}
              style={{ marginRight: '10px' }}
            >
              Add Roll
            </Button>
            <Button
              onClick={handleAddLot}
              disabled={rolls.length === 0}
            >
              Create Lot with {rolls.length} Roll{rolls.length !== 1 ? 's' : ''}
            </Button>
          </div>

          <div>
            <h4>Added Lots</h4>
            <Table
              dataSource={lots}
              columns={lotColumns}
              pagination={false}
              rowKey={(_, index) => index?.toString() ?? ""}
            />
          </div>
        </Card>

        {/* Receiving Information Section */}
        <Card title="Receiving Information" style={{ marginBottom: '20px' }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="receivedBy"
                label="Received By"
                rules={[{ required: true, message: 'Receiver name is required' }]}
              >
                <Input placeholder="Name of person who received" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="remarks"
                label="Remarks / Notes"
              >
                <Input.TextArea rows={4} placeholder="Any additional notes about the fabric or delivery" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Summary Section */}
        <Card style={{ backgroundColor: Math.abs(totalNetWeight - (form.getFieldValue('netWeight') || 0)) > 0.1 ? '#fff7e6' : '#f0f2f5', marginBottom: '20px', border: Math.abs(totalNetWeight - (form.getFieldValue('netWeight') || 0)) > 0.1 ? '2px solid #ff7a45' : 'none' }}>
          <Row gutter={16}>
            <Col xs={24} sm={6}>
              <div><strong>Number of Lots:</strong> {lots.length}</div>
            </Col>
            <Col xs={24} sm={6}>
              <div><strong>Total Rolls:</strong> {lots.reduce((sum, l) => sum + l.rolls.length, 0)}</div>
            </Col>
            <Col xs={24} sm={6}>
              <div><strong>Total Roll Weight:</strong> <span style={{ fontWeight: 'bold', color: Math.abs(totalNetWeight - (form.getFieldValue('netWeight') || 0)) > 0.1 ? '#ff4d4f' : '#000' }}>{totalNetWeight.toFixed(3)} kg</span></div>
            </Col>
            <Col xs={24} sm={6}>
              <div><strong>Net Weight (Form):</strong> <span style={{ fontWeight: 'bold', color: Math.abs(totalNetWeight - (form.getFieldValue('netWeight') || 0)) > 0.1 ? '#ff4d4f' : '#000' }}>{(form.getFieldValue('netWeight') || 0).toFixed(3)} kg</span></div>
            </Col>
          </Row>
          {lots.length > 0 && Math.abs(totalNetWeight - (form.getFieldValue('netWeight') || 0)) > 0.1 && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff1f0', border: '1px solid #ffccc7', borderRadius: '4px', color: '#ff4d4f' }}>
              <strong>⚠️ Weight Mismatch!</strong> The sum of all roll weights ({totalNetWeight.toFixed(3)} kg) must match the Net Weight ({(form.getFieldValue('netWeight') || 0).toFixed(3)} kg). 
              Difference: {Math.abs(totalNetWeight - (form.getFieldValue('netWeight') || 0)).toFixed(3)} kg
            </div>
          )}
        </Card>

        {/* Submit Button */}
        <div style={{ textAlign: 'right' }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            size="large" 
            loading={loading} 
            disabled={lots.length === 0 || Math.abs(totalNetWeight - (form.getFieldValue('netWeight') || 0)) > 0.1}
            title={Math.abs(totalNetWeight - (form.getFieldValue('netWeight') || 0)) > 0.1 ? 'Roll weights must match Net Weight' : ''}
          >
            {loading ? 'Creating Receipt...' : 'Create Fabric Receipt & Job'}
          </Button>
        </div>
      </Form>

      {/* Roll Modal */}
      <Modal
        title="Add Roll to Lot"
        open={modalVisible}
        onOk={handleSaveRoll}
        onCancel={() => {
          setModalVisible(false);
          rollForm.resetFields();
        }}
      >
        <Form form={rollForm} layout="vertical">
          <Form.Item
            name="rollNumber"
            label="Roll Number"
            rules={[{ required: true, message: 'Roll number is required' }]}
          >
            <Input placeholder="e.g., ROLL-001" />
          </Form.Item>
          <Form.Item
            name="weight"
            label="Weight (kg)"
            rules={[{ required: true, message: 'Weight is required' }]}
          >
            <InputNumber min={0} step={0.001} precision={3} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
