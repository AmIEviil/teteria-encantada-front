import React from "react";

interface CheckIconBG {
  colorCheck?: string;
  colorBG?: string;
  width?: number;
  height?: number;
  className?: string;
}

const CheckIconBG: React.FC<CheckIconBG> = ({
  colorCheck = "#2A5C16",
  colorBG = "#E0FFD3",
  width = 32,
  height = 24,
  className,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 32 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width={width} height={height} rx="2" fill={colorBG} />
      <path
        d="M22.4571 7.54384C22.7368 7.82494 22.7368 8.2795 22.4571 8.55762L14.6017 16.4555C14.322 16.7366 13.8697 16.7366 13.593 16.4555L9.54327 12.3884C9.26357 12.1073 9.26357 11.6528 9.54327 11.3747C9.82297 11.0965 10.2753 11.0936 10.552 11.3747L14.0929 14.9334L21.4454 7.54384C21.7251 7.26273 22.1774 7.26273 22.4541 7.54384H22.4571Z"
        fill={colorCheck}
      />
    </svg>
  );
};

export default CheckIconBG;
