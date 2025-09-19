import * as React from 'react';
import clsx from 'clsx';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0-100
}

const Progress: React.FC<ProgressProps> = ({ value = 0, className, ...props }) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={clsx('w-full h-3 bg-gray-200 rounded-full overflow-hidden', className)} {...props}>
      <div
        className="h-full bg-green-500 transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};

export default Progress;


