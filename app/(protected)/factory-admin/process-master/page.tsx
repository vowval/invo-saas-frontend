'use client';

import { useState, useEffect } from 'react';
import ProcessMasterUI from '../../../../components/process-master/ProcessMasterUI';

export default function FactoryProcessMasterPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProcessMasterUI />
    </div>
  );
}
