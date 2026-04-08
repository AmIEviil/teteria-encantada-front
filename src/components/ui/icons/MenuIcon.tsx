import React from "react";

interface MenuIconProps {
  className?: string;
  color?: string;
  size?: number | string;
}

const MenuIcon: React.FC<MenuIconProps> = ({
  className = "",
  color = "#131313",
  size = "24",
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
        d="M3 5.47826C3 4.93614 3.42991 4.5 3.96429 4.5H20.0357C20.5701 4.5 21 4.93614 21 5.47826C21 6.02038 20.5701 6.45652 20.0357 6.45652H3.96429C3.42991 6.45652 3 6.02038 3 5.47826ZM3 12C3 11.4579 3.42991 11.0217 3.96429 11.0217H20.0357C20.5701 11.0217 21 11.4579 21 12C21 12.5421 20.5701 12.9783 20.0357 12.9783H3.96429C3.42991 12.9783 3 12.5421 3 12ZM21 18.5217C21 19.0639 20.5701 19.5 20.0357 19.5H3.96429C3.42991 19.5 3 19.0639 3 18.5217C3 17.9796 3.42991 17.5435 3.96429 17.5435H20.0357C20.5701 17.5435 21 17.9796 21 18.5217Z"
        fill={color}
      />
    </svg>
  );
};

export default MenuIcon;
