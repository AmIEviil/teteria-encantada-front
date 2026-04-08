import React from "react";

interface ConsultIconProps {
  color?: string;
  size?: number;
  className?: string;
}

const CheckIcon: React.FC<ConsultIconProps> = ({
  color = "#6cc24a",
  size = 24,
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} w-auto`}
    >
      <path
        d="M14.4571 3.54384C14.7368 3.82494 14.7368 4.2795 14.4571 4.55762L6.60167 12.4555C6.32197 12.7366 5.86969 12.7366 5.59296 12.4555L1.54327 8.38844C1.26357 8.10733 1.26357 7.65278 1.54327 7.37466C1.82297 7.09655 2.27525 7.09355 2.55197 7.37466L6.09285 10.9334L13.4454 3.54384C13.7251 3.26273 14.1774 3.26273 14.4541 3.54384H14.4571Z"
        fill={color}
      />
    </svg>
  );
};

export default CheckIcon;
