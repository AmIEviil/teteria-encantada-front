import React from "react";

interface TrashIconProps {
  color?: string;
  size?: number | string;
  className?: string;
}

const TrashIcon: React.FC<TrashIconProps> = ({
  color = "currentColor",
  size = 24,
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
        d="M20.4406 7.75H27.5518C27.7567 7.75 27.9464 7.85156 28.0603 8.03125L29.5022 10.25H18.4978L19.9397 8.03125C20.0536 7.85937 20.2433 7.75 20.4482 7.75H20.4406ZM33.8813 10.25L31.096 5.94531C30.3067 4.73437 28.9786 4 27.5594 4H20.4406C19.0214 4 17.6933 4.73437 16.904 5.94531L14.1188 10.25H13.079H9.42857H8.82143C7.81205 10.25 7 11.0859 7 12.125C7 13.1641 7.81205 14 8.82143 14H9.70179L11.5232 39.3672C11.7129 41.9766 13.8228 44 16.3652 44H31.6272C34.1696 44 36.2795 41.9766 36.4692 39.3672L38.2982 14H39.1786C40.1879 14 41 13.1641 41 12.125C41 11.0859 40.1879 10.25 39.1786 10.25H38.5714H34.921H33.8813ZM34.6478 14L32.8415 39.0938C32.796 39.75 32.2647 40.25 31.6272 40.25H16.3652C15.7277 40.25 15.204 39.7422 15.1509 39.0938L13.3522 14H34.6478Z"
        fill={color}
      />
    </svg>
  );
};

export default TrashIcon;
