import React from 'react';

interface ArrowRightIconProps {
  size?: string | number;
  color?: string;
  className?: string;
  onClick?: () => void;
}

export const ArrowRightIcon: React.FC<ArrowRightIconProps> = ({ 
  size = "16", 
  color = "#131313",
  className = "",
  onClick
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 9 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={onClick}
    >
      <path 
        d="M8.56072 6.94055C9.14643 7.52624 9.14643 8.47741 8.56072 9.0631L2.56306 15.0606C2.13198 15.4917 1.49004 15.6182 0.92776 15.3839C0.36548 15.1496 0 14.6061 0 13.997V2.002C0 1.3975 0.36548 0.8493 0.92776 0.6151C1.49004 0.3808 2.13198 0.512 2.56306 0.9384L8.56072 6.94055Z" 
        fill={color}
      />
    </svg>
  );
};

export default ArrowRightIcon;
