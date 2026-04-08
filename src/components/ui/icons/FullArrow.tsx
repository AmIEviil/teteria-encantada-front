import React from "react";

type Direction = "up" | "down" | "left" | "right";

interface FullArrowIconProps {
  color?: string;
  size?: number | string;
  className?: string;
  direction?: Direction;
}

const FullArrowIcon: React.FC<FullArrowIconProps> = ({
  color = "#383838",
  size = 16,
  className = "",
  direction = "down",
}) => {
  const rotationStyles: Record<Direction, string> = {
    left: "rotate(180deg)",
    up: "rotate(-90deg)",
    down: "rotate(90deg)",
    right: "rotate(0deg)",
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        transform: rotationStyles[direction],
        transition: "transform 0.2s ease",
      }}
    >
      <path
        d="M39.3393 17.4559C39.7589 17.0808 40 16.5558 40 16.0058C40 15.4557 39.7589 14.939 39.3393 14.5557L23.625 0.5548C22.7679 -0.211915 21.4107 -0.17858 20.5982 0.621471C19.7857 1.42152 19.8125 2.68827 20.6696 3.44665L32.5089 14.0056H2.14286C0.955357 14.0056 0 14.8974 0 16.0058C0 17.1142 0.955357 18.0059 2.14286 18.0059H32.5089L20.6607 28.5566C19.8036 29.3233 19.7768 30.5817 20.5893 31.3818C21.4018 32.1818 22.7589 32.2068 23.6161 31.4484L39.3304 17.4475L39.3393 17.4559Z"
        fill={color}
      />
    </svg>
  );
};

export default FullArrowIcon;
