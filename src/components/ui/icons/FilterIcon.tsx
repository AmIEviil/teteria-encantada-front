import React from "react";

interface FilterIconProps {
  color?: string;
  size?: number | string;
  className?: string;
}

const FilterIcon: React.FC<FilterIconProps> = ({
  color = "white",
  size = 16,
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M2 4.6087C2 3.99429 2.47768 3.5 3.07143 3.5H20.9286C21.5223 3.5 22 3.99429 22 4.6087C22 5.2231 21.5223 5.71739 20.9286 5.71739H3.07143C2.47768 5.71739 2 5.2231 2 4.6087ZM4.85714 12C4.85714 11.3856 5.33482 10.8913 5.92857 10.8913H18.0714C18.6652 10.8913 19.1429 11.3856 19.1429 12C19.1429 12.6144 18.6652 13.1087 18.0714 13.1087H5.92857C5.33482 13.1087 4.85714 12.6144 4.85714 12ZM14.8571 19.3913C14.8571 20.0057 14.3795 20.5 13.7857 20.5H10.2143C9.62054 20.5 9.14286 20.0057 9.14286 19.3913C9.14286 18.7769 9.62054 18.2826 10.2143 18.2826H13.7857C14.3795 18.2826 14.8571 18.7769 14.8571 19.3913Z"
        fill={color}
      />
    </svg>
  );
};

export default FilterIcon;
