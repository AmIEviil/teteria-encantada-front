import React from "react"

interface FilesIconProps {
  filled?: boolean
  size?: number
  className?: string
}

const FilesIcon: React.FC<FilesIconProps> = ({
  filled = false,
  size = 24,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      d="M8.28571 4C5.91964 4 4 5.91964 4 8.28571V22.5714C4 24.9375 5.91964 26.8571 8.28571 26.8571H16.8571C19.2232 26.8571 21.1429 24.9375 21.1429 22.5714V8.28571C21.1429 5.91964 19.2232 4 16.8571 4H8.28571ZM31.1429 21.1429C28.7768 21.1429 26.8571 23.0625 26.8571 25.4286V39.7143C26.8571 42.0804 28.7768 44 31.1429 44H39.7143C42.0804 44 44 42.0804 44 39.7143V25.4286C44 23.0625 42.0804 21.1429 39.7143 21.1429H31.1429ZM4 36.8571V39.7143C4 42.0804 5.91964 44 8.28571 44H16.8571C19.2232 44 21.1429 42.0804 21.1429 39.7143V36.8571C21.1429 34.4911 19.2232 32.5714 16.8571 32.5714H8.28571C5.91964 32.5714 4 34.4911 4 36.8571ZM31.1429 4C28.7768 4 26.8571 5.91964 26.8571 8.28571V11.1429C26.8571 13.5089 28.7768 15.4286 31.1429 15.4286H39.7143C42.0804 15.4286 44 13.5089 44 11.1429V8.28571C44 5.91964 42.0804 4 39.7143 4H31.1429Z"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
    />
  </svg>
)

export default FilesIcon
