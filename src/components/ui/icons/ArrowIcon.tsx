import React from "react";

type Direction = "up" | "down" | "left" | "right";

interface ArrowIconProps {
  color?: string;
  size?: number | string;
  className?: string;
  direction?: Direction;
}

const ArrowIcon: React.FC<ArrowIconProps> = ({
  color = "currentColor",
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
      viewBox="0 0 40 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        transform: rotationStyles[direction],
        transition: "transform 0.2s ease",
      }}
    >
      <path
        d="M21.0868 1.18022C20.4905 0.58392 19.5095 0.58392 18.9132 1.18022L0.447223 19.6462C-0.149074 20.2425 -0.149074 21.2235 0.447223 21.8198C1.04352 22.4161 2.02453 22.4161 2.62082 21.8198L20 4.44061L37.3792 21.8198C37.9755 22.4161 38.9565 22.4161 39.5528 21.8198C40.1491 21.2235 40.1491 20.2425 39.5528 19.6462L21.0868 1.18022Z"
        fill={color}
      />
    </svg>
  );
};

export default ArrowIcon;
