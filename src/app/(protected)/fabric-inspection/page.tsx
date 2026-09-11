'use client';

import React, { useState } from 'react';
import { Card, Form, Input, Button, Table, Modal, Select, Row, Col, Tag, Divider, Empty, Spin, message } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, PauseOutlined } from '@ant-design/icons';
import { apiFetch } from '@/lib/api';

interface FabricReceipt {
  id: string;
  customerDcNumber: string;
  fabricType: string;
  netWeight: number;
  lots: any[];
}

interface InspectionCheckpoint {
  id: string;
  checkType: string;
  status: string;
  specification: string;
  actualValue?: string;
  notes?: string;
  isOptional?: boolean;
}

interface FabricInspection {
  id: string;
  inspectorName: string;
  inspectionDateTime: Date;
  result?: 'PASS' | 'HOLD' | 'REJECT';
  gsm?: number;
  width?: number;
  remarks?: string;
  checkpoints: InspectionCheckpoint[];
  fabricTypeVerified?: boolean;
  compositionVerified?: boolean;
  rollCountVerified?: boolean;
  actualRollCount?: number;
  visibleDefects?: string;
  contamination?: string;
  moistureCondition?: string;
  lotConsistency?: string;
}

export default function FabricInspectionPage() {
  const [receipts, setReceipts] = useState<FabricReceipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [inspections, setInspections] = useState<FabricInspection[]>([]);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);
  const [form] = Form.useForm();
  const [checkpointForm] = Form.useForm();
  const [currentCheckpoints, setCurrentCheckpoints] = useState<Omit<InspectionCheckpoint, 'id'>[]>([]);
  const [submittingResult, setSubmittingResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkpointTypes = [
    { label: 'Roll Count', value: 'ROLL_COUNT' },
    { label: 'Weight', value: 'WEIGHT' },
    { label: 'GSM', value: 'GSM' },
    { label: 'Width', value: 'WIDTH' },
    { label: 'Fabric Type', value: 'FABRIC_TYPE' },
    { label: 'Composition', value: 'COMPOSITION' },
    { label: 'Shade/Colour', value: 'SHADE_COLOUR' },
    { label: 'Visible Defects', value: 'VISIBLE_DEFECTS' },
    { label: 'Contamination', value: 'CONTAMINATION' },
    { label: 'Moisture/Condition', value: 'MOISTURE_CONDITION' },
    { label: 'Lot Consistency', value: 'LOT_CONSISTENCY' },
    { label: 'Customer Specification', value: 'CUSTOMER_SPEC' },
  ];

  const statusOptions = [
    { label: 'Pass', value: 'PASS', color: 'green' },
    { label: 'Fail', value: 'FAIL', color: 'red' },
    { label: 'N/A', value: 'NA', color: 'grey' },
  ];

  const checkpointColumns = [
    {
      title: 'Check Type',
      dataIndex: 'checkType',
      key: 'checkType',
      render: (type: string) => checkpointTypes.find((t) => t.value === type)?.label,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusOption = statusOptions.find((s) => s.value === status);
        return <Tag color={statusOption?.color}>{statusOption?.label}</Tag>;
      },
    },
    {
      title: 'Specification',
      dataIndex: 'specification',
      key: 'specification',
    },
    {
      title: 'Actual Value',
      dataIndex: 'actualValue',
      key: 'actualValue',
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
    },
  ];

  const inspectionColumns = [
    {
      title: 'Inspector',
      dataIndex: 'inspectorName',
      key: 'inspectorName',
    },
    {
      title: 'Inspection Date',
      dataIndex: 'inspectionDateTime',
      key: 'inspectionDateTime',
      render: (date: Date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Result',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => {
        if (!result) return <Tag>Pending</Tag>;
        const color = result === 'PASS' ? 'green' : result === 'HOLD' ? 'orange' : 'red';
        return <Tag color={color}>{result}</Tag>;
      },
    },
    {
      title: 'Checkpoints',
      dataIndex: 'checkpoints',
      key: 'checkpoints',
      render: (checkpoints: InspectionCheckpoint[]) => `${checkpoints?.length || 0} items`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: FabricInspection) => (
        <Button type="link" size="small" onClick={() => viewInspectionDetails(record)}>
          View Details
        </Button>
      ),
    },
  ];

  const handleAddCheckpoint = () => {
    const values = checkpointForm.getFieldsValue();
    if (values.checkType && values.status && values.specification) {
      const checkpoint = {
        checkType: values.checkType,
        status: values.status,
        specification: values.specification,
        actualValue: values.actualValue,
        notes: values.notes,
        isOptional: values.isOptional || false,
      };
      setCurrentCheckpoints([...currentCheckpoints, checkpoint]);
      checkpointForm.resetFields();
      setShowCheckpointModal(false);
      message.success('Checkpoint added');
    } else {
      message.error('Please fill required fields');
    }
  };

  const handleRemoveCheckpoint = (index: number) => {
    setCurrentCheckpoints(currentCheckpoints.filter((_, i) => i !== index));
  };

  const handleCreateInspection = async () => {
    if (!selectedReceipt) {
      message.error('Please select a receipt');
      return;
    }

    const values = form.getFieldsValue();
    if (!values.inspectorName) {
      message.error('Inspector name is required');
      return;
    }

    setLoading(true);
    try {
      const inspection = await apiFetch(`/api/fabric-receiving/inspection/${selectedReceipt}`, {
        method: 'POST',
        body: JSON.stringify({
          inspectorName: values.inspectorName,
          inspectionDateTime: new Date().toISOString(),
          remarks: values.remarks,
          gsm: values.gsm ? parseFloat(values.gsm) : undefined,
          width: values.width ? parseFloat(values.width) : undefined,
          fabricTypeVerified: values.fabricTypeVerified,
          compositionVerified: values.compositionVerified,
          rollCountVerified: values.rollCountVerified,
          actualRollCount: values.actualRollCount ? parseInt(values.actualRollCount) : undefined,
          visibleDefects: values.visibleDefects,
          contamination: values.contamination,
          moistureCondition: values.moistureCondition,
          lotConsistency: values.lotConsistency,
          checkpoints: currentCheckpoints,
        }),
      });

      setInspections([inspection, ...inspections]);
      setShowInspectionModal(false);
      form.resetFields();
      setCurrentCheckpoints([]);
      message.success('Inspection created successfully');
    } catch (error) {
      console.error('Error:', error);
      message.error('Error creating inspection');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResult = async (inspectionId: string, result: string) => {
    setSubmittingResult(result);
    try {
      const updated = await apiFetch(`/api/fabric-receiving/inspection/${inspectionId}/submit-result`, {
        method: 'PUT',
        body: JSON.stringify({ result }),
      });

      setInspections(inspections.map((i) => (i.id === inspectionId ? updated : i)));
      message.success(`Inspection result: ${result}`);
    } catch (error) {
      console.error('Error:', error);
      message.error('Error submitting result');
    } finally {
      setSubmittingResult(null);
    }
  };

  const viewInspectionDetails = (inspection: FabricInspection) => {
    Modal.info({
      title: `Inspection - ${inspection.inspectorName}`,
      width: 800,
      content: (
        <div>
          <Divider>Summary</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <strong>Inspector:</strong> {inspection.inspectorName}
            </Col>
            <Col span={12}>
              <strong>Date:</strong> {new Date(inspection.inspectionDateTime).toLocaleString()}
            </Col>
            <Col span={12}>
              <strong>Result:</strong> {inspection.result ? <Tag color={inspection.result === 'PASS' ? 'green' : inspection.result === 'HOLD' ? 'orange' : 'red'}>{inspection.result}</Tag> : 'Pending'}
            </Col>
            {inspection.remarks && (
              <Col span={12}>
                <strong>Remarks:</strong> {inspection.remarks}
              </Col>
            )}
          </Row>

          {(inspection.gsm || inspection.width) && (
            <>
              <Divider>Measurements</Divider>
              <Row gutter={16}>
                {inspection.gsm && <Col span={12}><strong>GSM:</strong> {inspection.gsm}</Col>}
                {inspection.width && <Col span={12}><strong>Width:</strong> {inspection.width} cm</Col>}
              </Row>
            </>
          )}

          <Divider>Checkpoints ({inspection.checkpoints?.length || 0})</Divider>
          {inspection.checkpoints && inspection.checkpoints.length > 0 ? (
            <Table dataSource={inspection.checkpoints} columns={checkpointColumns} pagination={false} rowKey="id" />
          ) : (
            <Empty />
          )}

          {!inspection.result && (
            <>
              <Divider>Submit Result</Divider>
              <Row gutter={16}>
                <Col span={8}>
                  <Button type="primary" icon={<CheckOutlined />} block onClick={() => handleSubmitResult(inspection.id, 'PASS')} loading={submittingResult === 'PASS'}>
                    Pass
                  </Button>
                </Col>
                <Col span={8}>
                  <Button icon={<PauseOutlined />} block onClick={() => handleSubmitResult(inspection.id, 'HOLD')} loading={submittingResult === 'HOLD'}>
                    Hold
                  </Button>
                </Col>
                <Col span={8}>
                  <Button danger icon={<CloseOutlined />} block onClick={() => handleSubmitResult(inspection.id, 'REJECT')} loading={submittingResult === 'REJECT'}>
                    Reject
                  </Button>
                </Col>
              </Row>
            </>
          )}
        </div>
      ),
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card title="Fabric Inspection" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setShowInspectionModal(true)}>New Inspection</Button>}>
        <Divider>Select Receipt</Divider>
        <Row gutter={16} style={{ marginBottom: '20px' }}>
          <Col span={12}>
            <Select placeholder="Choose receipt to inspect" onChange={setSelectedReceipt} />
          </Col>
        </Row>

        {inspections.length === 0 ? (
          <Empty description="No inspections found" />
        ) : (
          <Table dataSource={inspections} columns={inspectionColumns} pagination={false} rowKey="id" />
        )}
      </Card>

      {/* Create Inspection Modal */}
      <Modal
        title="Create Inspection"
        open={showInspectionModal}
        onCancel={() => {
          setShowInspectionModal(false);
          form.resetFields();
          setCurrentCheckpoints([]);
        }}
        footer={[
          <Button key="cancel" onClick={() => setShowInspectionModal(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" loading={loading} onClick={handleCreateInspection}>
            Submit
          </Button>,
        ]}
        width={900}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="inspectorName" label="Inspector Name" rules={[{ required: true, message: 'Required' }]}>
            <Input />
          </Form.Item>

          <Divider>Measurements</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="gsm" label="GSM">
                <Input type="number" step="0.01" placeholder="Grams per sq meter" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="width" label="Width (cm)">
                <Input type="number" step="0.01" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Verifications</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fabricTypeVerified" label="Fabric Type Match">
                <Select options={[{ label: 'Yes', value: true }, { label: 'No', value: false }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="compositionVerified" label="Composition Match">
                <Select options={[{ label: 'Yes', value: true }, { label: 'No', value: false }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="rollCountVerified" label="Roll Count Match">
                <Select options={[{ label: 'Yes', value: true }, { label: 'No', value: false }]} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Observations</Divider>
          <Form.Item name="visibleDefects" label="Visible Defects">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="contamination" label="Contamination">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Divider>Checkpoints</Divider>
          {currentCheckpoints.length === 0 ? (
            <Empty description="No checkpoints" />
          ) : (
            <Table
              dataSource={currentCheckpoints}
              columns={[
                ...checkpointColumns,
                {
                  title: 'Action',
                  key: 'action',
                  width: 80,
                  render: (_, __, index) => (
                    <Button danger size="small" onClick={() => handleRemoveCheckpoint(index)}>
                      Remove
                    </Button>
                  ),
                },
              ]}
              pagination={false}
              rowKey={(_, index) => index?.toString() ?? ''}
              size="small"
            />
          )}
          <Button type="dashed" icon={<PlusOutlined />} block onClick={() => setShowCheckpointModal(true)} style={{ marginTop: '10px' }}>
            Add Checkpoint
          </Button>
        </Form>
      </Modal>

      {/* Add Checkpoint Modal */}
      <Modal
        title="Add Checkpoint"
        open={showCheckpointModal}
        onCancel={() => {
          setShowCheckpointModal(false);
          checkpointForm.resetFields();
        }}
        onOk={handleAddCheckpoint}
      >
        <Form form={checkpointForm} layout="vertical">
          <Form.Item name="checkType" label="Type" rules={[{ required: true }]}>
            <Select options={checkpointTypes} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={[
              { label: 'Pass', value: 'PASS' },
              { label: 'Fail', value: 'FAIL' },
              { label: 'N/A', value: 'NA' },
            ]} />
          </Form.Item>
          <Form.Item name="specification" label="Specification" rules={[{ required: true }]}>
            <Input placeholder="e.g., 1000 GSM ±5%" />
          </Form.Item>
          <Form.Item name="actualValue" label="Actual Value">
            <Input placeholder="e.g., 1005 GSM" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
