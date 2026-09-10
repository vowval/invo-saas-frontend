'use client';

interface ToastProps {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function Toast({ type, message }: ToastProps) {
  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  }[type];

  const textColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
  }[type];

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }[type];

  return (
    <div
      className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg border ${bgColor} ${textColor} font-medium text-sm flex items-center gap-3 shadow-lg animate-in slide-in-from-bottom-4 fade-in`}
      role="alert"
    >
      <span className="text-lg font-bold">{icon}</span>
      <span>{message}</span>
    </div>
  );
}
