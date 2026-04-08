import React from "react";

interface EmailSendIconProps {
  color?: string;
  size?: number;
  className?: string;
}

const EmailIcon: React.FC<EmailSendIconProps> = ({
  color = "#6AB4FF",
  size = 313,
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 313 314"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M9.65174 159.569C-4.17347 167.455 -2.88883 188.484 11.854 194.598L97.6804 230.36V293.51C97.6804 304.575 106.612 313.5 117.684 313.5C123.618 313.5 129.246 310.871 133.039 306.286L170.966 260.865L246.76 292.409C258.322 297.239 271.719 289.658 273.615 277.31L312.766 22.999C313.929 15.602 310.687 8.14388 304.508 3.92575C298.33 -0.292383 290.255 -0.659177 283.709 3.0699L9.65174 159.569ZM41.5231 175.157L250.431 55.8882L116.094 205.907L116.828 206.518L41.5231 175.157ZM246.516 260.559L144.6 218.072L275.573 71.7827L246.516 260.559Z"
        fill={color}
      />
    </svg>
  );
};

export default EmailIcon;
