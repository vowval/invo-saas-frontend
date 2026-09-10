import React, { useState, useEffect } from 'react';
import {
  Layout,
  Breadcrumb,
  Card,
  Button,
  Spin,
  message,
  Alert,
  Tabs,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import ParameterEditor from '../components/process-master/ParameterEditor';

interface Process {
  id: string;
  name: string;
  process_code: string;
  description?: string;
  category_id: string;
  factory_id?: string | null;
  cloned_from_process_id?: string | null;
  is_active: boolean;
}

/**
 * Process Parameters Page
 * 
 * Route: /factory-admin/process-master/:processId/parameters
 * 
 * Allows factory admins to:
 * - View global parameters (inherited from super-admin)
 * - Create factory-specific parameter overrides
 * - Manage their custom parameters
 */
export const ProcessParametersPage: React.FC = () => {
  const { processId } = useParams<{ processId: string }>();
  const navigate = useNavigate();
  
  const [process, setProcess] = useState<Process | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCustomProcess, setIsCustomProcess] = useState(false);

  useEffect(() => {
    if (processId) {
      loadProcessDetails();
    }
  }, [processId]);

  /**
   * Load process details
   */
  const loadProcessDetails = async () => {
    setLoading(true);
    try {
      // TODO: Implement proper API endpoint
      // const response = await fetch(`/api/admin/process-master/processes/${processId}`);
      // if (response.ok) {
      //   const data = await response.json();
      //   setProcess(data);
      //   setIsCustomProcess(data.factory_id !== null);
      // }

      // Mock data for now
      setProcess({
        id: processId!,
        name: 'Normal Wash',
        process_code: 'WASH-NORM',
        description: 'Standard washing process',
        category_id: 'cat-washing',
        factory_id: null,
        is_active: true,
      });
      setIsCustomProcess(false);
    } catch (error) {
      console.error('Error loading process:', error);
      message.error('Failed to load process details');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !process) {
    return (
      <Layout.Content style={{ padding: '24px' }}>
        <Spin />
      </Layout.Content>
    );
  }

  return (
    <Layout.Content style={{ padding: '24px' }}>
      <Breadcrumb
        items={[
          { title: 'Home' },
          { title: 'Process Master' },
          { title: 'Parameters' },
          { title: process.name },
        ]}
        style={{ marginBottom: '24px' }}
      />

      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/factory-admin/process-master')}
        style={{ marginBottom: '16px' }}
      >
        Back to Process Master
      </Button>

      <Card
        title={`Process: ${process.name} (${process.process_code})`}
        style={{ marginBottom: '24px' }}
      >
        <Alert
          message={
            isCustomProcess
              ? 'Custom Process - You can create factory-specific parameter customizations'
              : 'Global Process - Click on parameters to view or customize them for your factory'
          }
          type={isCustomProcess ? 'success' : 'info'}
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <p>
          <strong>Description:</strong> {process.description || 'No description'}
        </p>

        {isCustomProcess && (
          <p>
            <strong>Original Process:</strong> Process cloned from {process.cloned_from_process_id}
          </p>
        )}
      </Card>

      <Tabs
        items={[
          {
            key: 'global',
            label: 'Global Parameters',
            children: (
              <ParameterEditor
                processId={processId!}
                processName={`${process.name} (Global)`}
                isGlobal={true}
              />
            ),
          },
          ...(isCustomProcess
            ? [
                {
                  key: 'custom',
                  label: 'Custom Parameters',
                  children: (
                    <ParameterEditor
                      processId={processId!}
                      processName={`${process.name} (Custom)`}
                      isGlobal={false}
                    />
                  ),
                },
              ]
            : []),
        ]}
      />
    </Layout.Content>
  );
};

export default ProcessParametersPage;
