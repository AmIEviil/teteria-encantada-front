interface ArrowDownIconProps {
  size?: string | number;
  color?: string;
  className?: string;
  onClick?: () => void;
}

export const ArrowDownIcon: React.FC<ArrowDownIconProps> = ({ 
  size = "16", 
  color = "#131313",
  className = "",
  onClick
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 16 9" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={onClick}
    >
      <path 
        d="M9.05945 0.439281C8.47376 -0.146427 7.52259 -0.146427 6.9369 0.439281L0.9394 6.43694C0.50833 6.86802 0.38182 7.50996 0.616097 8.07224C0.850375 8.63452 1.3939 9 2.00302 9H13.998C14.6025 9 15.1507 8.63452 15.3849 8.07224C15.6192 7.50996 15.488 6.86802 15.0616 6.43694L9.06414 0.439281H9.05945Z" 
        fill={color}
      />
    </svg>
  );
};

export default ArrowDownIcon;
