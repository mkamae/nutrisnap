import * as React from 'react';
function cx(...args: Array<string | undefined | false>) {
  return args.filter(Boolean).join(' ');
}

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0-100
}

const Progress: React.FC<ProgressProps> = ({ value = 0, className, ...props }) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cx('w-full h-3 bg-gray-200 rounded-full overflow-hidden', className)} {...props}>
      <div
        className="h-full bg-green-500 transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};

export default Progress;


