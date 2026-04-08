import React from "react";

type Direction = "up" | "down" | "left" | "right";

interface CaretIconProps {
  color?: string;
  size?: number | string;
  className?: string;
  direction?: Direction;
}

const CaretIcon: React.FC<CaretIconProps> = ({
  color = "#000000",
  size = 12,
  className = "",
  direction = "down",
}) => {
  const rotationStyles: Record<Direction, string> = {
    down: "rotate(180deg)",
    left: "rotate(-90deg)",
    right: "rotate(90deg)",
    up: "rotate(0deg)",
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        transform: rotationStyles[direction],
        transition: "transform 0.2s ease",
      }}
    >
      <path
        d="M17.1189 0.878563C15.9475 -0.292854 14.0452 -0.292854 12.8738 0.878563L0.8788 12.8739C0.0166598 13.736 -0.23636 15.0199 0.232195 16.1445C0.700749 17.269 1.7878 18 3.00604 18H26.996C28.2049 18 29.3013 17.269 29.7699 16.1445C30.2384 15.0199 29.976 13.736 29.1233 12.8739L17.1283 0.878563H17.1189Z"
        fill={color}
      />
    </svg>
  );
};

export default CaretIcon;
