import * as React from 'react';
function cx(...args: Array<string | undefined | false>) {
  return args.filter(Boolean).join(' ');
}

type Variant = 'default' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  default: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  secondary: 'bg-gray-800 text-white hover:bg-gray-900 focus:ring-gray-700',
  outline: 'border border-gray-300 text-gray-900 hover:bg-gray-100',
  ghost: 'bg-transparent hover:bg-gray-100',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4',
  lg: 'h-12 px-6 text-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button ref={ref} className={cx(base, variants[variant], sizes[size], className)} {...props} />
    );
  }
);

Button.displayName = 'Button';

export default Button;


