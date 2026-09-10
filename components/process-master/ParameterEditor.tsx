import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  InputNumber,
  Switch,
  Form,
  Modal,
  Table,
  Space,
  Tooltip,
  Empty,
  Spin,
  Tag,
  Popconfirm,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DragOutlined,
  EyeOutlined,
  SaveOutlined,
} from '@ant-design/icons';

/**
 * Parameter Data Types
 */
export enum ParameterDataType {
  TEXT = 'text',
  INTEGER = 'integer',
  DECIMAL = 'decimal',
  BOOLEAN = 'boolean',
  DATE = 'date',
  TIME = 'time',
  DURATION = 'duration',
  TEMPERATURE = 'temperature',
  PH = 'pH',
  QUANTITY = 'quantity',
  PERCENTAGE = 'percentage',
  MACHINE = 'machine',
  RECIPE = 'recipe',
  CHEMICAL = 'chemical',
  COLOUR = 'colour',
  SHADE = 'shade',
  SELECT = 'select',
}

const DATA_TYPE_LABELS = {
  [ParameterDataType.TEXT]: 'Text',
  [ParameterDataType.INTEGER]: 'Integer',
  [ParameterDataType.DECIMAL]: 'Decimal',
  [ParameterDataType.BOOLEAN]: 'Boolean (Yes/No)',
  [ParameterDataType.DATE]: 'Date',
  [ParameterDataType.TIME]: 'Time',
  [ParameterDataType.DURATION]: 'Duration',
  [ParameterDataType.TEMPERATURE]: 'Temperature (°C/°F)',
  [ParameterDataType.PH]: 'pH Value',
  [ParameterDataType.QUANTITY]: 'Quantity (kg/units)',
  [ParameterDataType.PERCENTAGE]: 'Percentage (%)',
  [ParameterDataType.MACHINE]: 'Machine (Dropdown)',
  [ParameterDataType.RECIPE]: 'Recipe (Dropdown)',
  [ParameterDataType.CHEMICAL]: 'Chemical (Dropdown)',
  [ParameterDataType.COLOUR]: 'Colour/Shade Code',
  [ParameterDataType.SHADE]: 'Shade Specification',
  [ParameterDataType.SELECT]: 'Select Options (Custom List)',
};

interface ProcessParameter {
  id: string;
  process_id: string;
  parameter_code: string;
  parameter_name: string;
  data_type: ParameterDataType;
  unit?: string | null;
  is_required: boolean;
  display_order: number;
  default_value?: string | null;
  min_value?: string | null;
  max_value?: string | null;
  allowed_values?: string[] | null;
  help_text?: string | null;
  factory_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ParameterEditorProps {
  processId: string;
  processName: string;
  isGlobal?: boolean; // true for super-admin (read-only), false for factory-admin (editable)
  onClose?: () => void;
}

/**
 * Parameter Editor Component
 * 
 * Manages CRUD operations for process parameters.
 * - Super Admin: View-only mode for global parameters
 * - Factory Admin: Full CRUD for factory-specific customizations
 */
export const ParameterEditor: React.FC<ParameterEditorProps> = ({
  processId,
  processName,
  isGlobal = true,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [parameters, setParameters] = useState<ProcessParameter[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingParameter, setEditingParameter] = useState<ProcessParameter | null>(null);
  const [allowedValuesInput, setAllowedValuesInput] = useState<string>('');

  // Load parameters on mount
  useEffect(() => {
    loadParameters();
  }, [processId]);

  /**
   * Load parameters from API
   */
  const loadParameters = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/process-master/parameters/process/${processId}`
      );
      if (response.ok) {
        const data = await response.json();
        setParameters(data);
      } else {
        message.error('Failed to load parameters');
      }
    } catch (error) {
      console.error('Error loading parameters:', error);
      message.error('Error loading parameters');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Open create/edit modal
   */
  const openModal = (parameter?: ProcessParameter) => {
    if (parameter) {
      setEditingParameter(parameter);
      form.setFieldsValue({
        ...parameter,
        allowed_values: parameter.allowed_values?.join('\n') || '',
      });
      setAllowedValuesInput(parameter.allowed_values?.join('\n') || '');
    } else {
      setEditingParameter(null);
      form.resetFields();
      setAllowedValuesInput('');
    }
    setModalVisible(true);
  };

  /**
   * Save parameter (create or update)
   */
  const handleSaveParameter = async (values: any) => {
    if (isGlobal && editingParameter === null) {
      message.error('Super admin can only modify existing parameters');
      return;
    }

    try {
      const payload = {
        ...values,
        allowed_values: values.data_type === ParameterDataType.SELECT
          ? allowedValuesInput.split('\n').filter((v: string) => v.trim())
          : null,
      };

      if (editingParameter) {
        // Update
        const response = await fetch(
          `/api/admin/process-master/parameters/${editingParameter.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );

        if (response.ok) {
          message.success('Parameter updated');
          loadParameters();
        } else {
          message.error('Failed to update parameter');
        }
      } else {
        // Create
        const response = await fetch('/api/admin/process-master/parameters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            process_id: processId,
            ...payload,
          }),
        });

        if (response.ok) {
          message.success('Parameter created');
          loadParameters();
        } else {
          message.error('Failed to create parameter');
        }
      }

      setModalVisible(false);
    } catch (error) {
      console.error('Error saving parameter:', error);
      message.error('Error saving parameter');
    }
  };

  /**
   * Delete parameter
   */
  const handleDeleteParameter = async (id: string) => {
    if (isGlobal) {
      message.error('Cannot delete global parameters');
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/process-master/parameters/${id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        message.success('Parameter deleted');
        loadParameters();
      } else {
        message.error('Failed to delete parameter');
      }
    } catch (error) {
      console.error('Error deleting parameter:', error);
      message.error('Error deleting parameter');
    }
  };

  /**
   * Handle drag and drop reordering
   */
  const handleReorder = async (reorderedParams: ProcessParameter[]) => {
    const reorderPayload = reorderedParams.map((p, idx) => ({
      id: p.id,
      display_order: idx + 1,
    }));

    try {
      const response = await fetch(
        '/api/admin/process-master/parameters/reorder',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parameters: reorderPayload }),
        }
      );

      if (response.ok) {
        setParameters(reorderedParams);
        message.success('Parameters reordered');
      } else {
        message.error('Failed to reorder parameters');
      }
    } catch (error) {
      console.error('Error reordering:', error);
      message.error('Error reordering parameters');
    }
  };

  /**
   * Table columns for parameter list
   */
  const columns = [
    {
      title: 'Parameter Code',
      dataIndex: 'parameter_code',
      key: 'parameter_code',
      width: 130,
      render: (code: string) => (
        <Tag color="blue">{code}</Tag>
      ),
    },
    {
      title: 'Parameter Name',
      dataIndex: 'parameter_name',
      key: 'parameter_name',
      width: 180,
    },
    {
      title: 'Data Type',
      dataIndex: 'data_type',
      key: 'data_type',
      width: 150,
      render: (type: ParameterDataType) => (
        <Tag>{DATA_TYPE_LABELS[type] || type}</Tag>
      ),
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      render: (unit: string | null | undefined) => unit || '-',
    },
    {
      title: 'Required',
      dataIndex: 'is_required',
      key: 'is_required',
      width: 80,
      render: (required: boolean) => (
        <Switch checked={required} disabled size="small" />
      ),
    },
    {
      title: 'Range',
      key: 'range',
      width: 150,
      render: (_: any, record: ProcessParameter) => {
        if (record.min_value || record.max_value) {
          return (
            <span>
              {record.min_value} → {record.max_value}
            </span>
          );
        }
        return '-';
      },
    },
    {
      title: 'Help Text',
      dataIndex: 'help_text',
      key: 'help_text',
      width: 200,
      render: (text: string | null | undefined) =>
        text ? (
          <Tooltip title={text}>
            <span>{text.substring(0, 30)}...</span>
          </Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: ProcessParameter) => (
        <Space size="small">
          <Tooltip title={isGlobal ? 'View-only' : 'Edit'}>
            <Button
              icon={isGlobal ? <EyeOutlined /> : <EditOutlined />}
              size="small"
              onClick={() => openModal(record)}
            />
          </Tooltip>
          {!isGlobal && (
            <Popconfirm
              title="Delete Parameter"
              description="Are you sure you want to delete this parameter?"
              onConfirm={() => handleDeleteParameter(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={`Parameters for: ${processName} ${isGlobal ? '(Global)' : '(Custom)'}`}
      extra={
        !isGlobal && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
          >
            Add Parameter
          </Button>
        )
      }
      style={{ marginTop: 20 }}
    >
      {loading ? (
        <Spin />
      ) : parameters.length === 0 ? (
        <Empty description="No parameters defined" />
      ) : (
        <Table
          columns={columns}
          dataSource={parameters}
          rowKey="id"
          pagination={{ pageSize: 20 }}
          scroll={{ x: 1200 }}
          size="small"
        />
      )}

      {/* Parameter Create/Edit Modal */}
      <Modal
        title={
          editingParameter
            ? `Edit Parameter: ${editingParameter.parameter_code}`
            : 'Create New Parameter'
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        okText={editingParameter ? 'Update' : 'Create'}
        okButtonProps={{ icon: editingParameter ? <SaveOutlined /> : <PlusOutlined /> }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveParameter}
          disabled={isGlobal && editingParameter === null}
        >
          <Form.Item
            label="Parameter Code"
            name="parameter_code"
            rules={[
              { required: true, message: 'Required' },
              {
                pattern: /^[A-Z_]+$/,
                message: 'Only uppercase letters and underscores',
              },
            ]}
          >
            <Input placeholder="e.g., MACHINE, INPUT_QTY" disabled={!!editingParameter} />
          </Form.Item>

          <Form.Item
            label="Parameter Name"
            name="parameter_name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g., Machine, Input Quantity" />
          </Form.Item>

          <Form.Item
            label="Data Type"
            name="data_type"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select
              placeholder="Select data type"
              options={Object.entries(DATA_TYPE_LABELS).map(([key, label]) => ({
                value: key,
                label,
              }))}
            />
          </Form.Item>

          <Form.Item label="Unit" name="unit">
            <Input placeholder="e.g., °C, kg, %" />
          </Form.Item>

          <Form.Item label="Is Required" name="is_required" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            label="Display Order"
            name="display_order"
            rules={[{ required: true, message: 'Required' }]}
          >
            <InputNumber min={1} />
          </Form.Item>

          <Form.Item label="Default Value" name="default_value">
            <Input placeholder="Default value for this parameter" />
          </Form.Item>

          <Form.Item label="Min Value" name="min_value">
            <Input placeholder="Minimum allowed value" />
          </Form.Item>

          <Form.Item label="Max Value" name="max_value">
            <Input placeholder="Maximum allowed value" />
          </Form.Item>

          {/* Show allowed values input only for SELECT type */}
          {form.getFieldValue('data_type') === ParameterDataType.SELECT && (
            <Form.Item
              label="Allowed Values (one per line)"
              required
            >
              <Input.TextArea
                rows={4}
                placeholder="Option1&#10;Option2&#10;Option3"
                value={allowedValuesInput}
                onChange={(e) => setAllowedValuesInput(e.target.value)}
              />
            </Form.Item>
          )}

          <Form.Item label="Help Text" name="help_text">
            <Input.TextArea
              rows={3}
              placeholder="Guidance text for users (e.g., supplier recommendations, machine limitations)"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ParameterEditor;
