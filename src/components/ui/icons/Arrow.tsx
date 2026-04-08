import React from "react";

interface ArrowIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const ArrowIcon: React.FC<ArrowIconProps> = ({ size = 24, color = "#131313", className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M13.0595 17.0607C12.4738 17.6464 11.5226 17.6464 10.9369 17.0607L4.9394 11.0631C4.50833 10.632 4.38182 9.99004 4.6161 9.42776C4.85037 8.86548 5.3939 8.5 6.00302 8.5H17.998C18.6025 8.5 19.1507 8.86548 19.3849 9.42776C19.6192 9.99004 19.488 10.632 19.0616 11.0631L13.0641 17.0607H13.0595Z"
      fill={color}
    />
  </svg>
);

export default ArrowIcon;
