import React from 'react';

interface IconWrapperProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  ariaLabel?: string;
}

const sizeMap = {
  xs: '1rem',
  sm: '1.25rem',
  md: '1.5rem',
  lg: '2rem',
};

const IconWrapper: React.FC<IconWrapperProps> = ({
  children,
  size = 'md',
  ariaLabel,
}) => {
  return (
    <span
      style={{ width: sizeMap[size], height: sizeMap[size] }}
      role="img"
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    >
      {children}
    </span>
  );
};

export default IconWrapper;
