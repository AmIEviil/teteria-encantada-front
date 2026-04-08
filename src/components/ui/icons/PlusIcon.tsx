import React from "react";

interface PlusIconProps {
  color?: string;
  size?: number | string;
  className?: string;
}

const PlusIcon: React.FC<PlusIconProps> = ({
  color = "#131313",
  size = 16,
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M42.125 22.125C43.1641 22.125 44 22.9609 44 24C44 25.0391 43.1641 25.875 42.125 25.875H25.875V42.125C25.875 43.1641 25.0391 44 24 44C22.9609 44 22.125 43.1641 22.125 42.125V25.875H5.875C4.83594 25.875 4 25.0391 4 24C4 22.9609 4.83594 22.125 5.875 22.125H22.125V5.875C22.125 4.83594 22.9609 4 24 4C25.0391 4 25.875 4.83594 25.875 5.875V22.125H42.125Z"
        fill={color}
      />
    </svg>
  );
};

export default PlusIcon;
