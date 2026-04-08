import React from "react"

interface LogoutIconProps {
  filled?: boolean
  size?: number
  className?: string
}

const LogoutIcon: React.FC<LogoutIconProps> = ({
  filled = false,
  size = 24,
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {filled ? (
        <path d="M16 17L21 12L16 7V10H9V14H16V17ZM5 3H13V5H5V19H13V21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3Z" />
      ) : (
        <>
          <path d="M16 17L21 12L16 7" vectorEffect="non-scaling-stroke" />
          <path d="M21 12H9" vectorEffect="non-scaling-stroke" />
          <path
            d="M13 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H13"
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
    </svg>
  )
}

export default LogoutIcon
