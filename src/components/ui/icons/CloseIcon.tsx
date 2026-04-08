import React from "react";

interface CloseIconProps {
  color?: string;
  size?: string | number;
  className?: string;
}

const CloseIcon: React.FC<CloseIconProps> = ({
  color = "white",
  size = 16,
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M13.5291 1.52747C13.7879 1.26873 14.2135 1.26873 14.4723 1.52747C14.731 1.78621 14.731 2.21187 14.4723 2.47061L8.94281 8.00008L14.4723 13.5296C14.731 13.7883 14.731 14.214 14.4723 14.4727C14.2135 14.7314 13.7879 14.7314 13.5291 14.4727L7.99967 8.94322L2.47437 14.4727C2.21564 14.7314 1.78997 14.7314 1.53123 14.4727C1.2725 14.214 1.2725 13.7883 1.53123 13.5296L7.05653 8.00008L1.52706 2.47061C1.26832 2.21187 1.26832 1.78621 1.52706 1.52747C1.7858 1.26873 2.21146 1.26873 2.4702 1.52747L7.99967 7.05694L13.5291 1.52747Z"
        fill={color}
      />
    </svg>
  );
};
export default CloseIcon;
