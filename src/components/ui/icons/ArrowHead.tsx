interface ArrowHeadProps {
  size?: string | number;
  color?: string;
  className?: string;
  onClick?: () => void;
}

export const ArrowHead: React.FC<ArrowHeadProps> = ({ 
  size = "16", 
  color = "#131313",
  className = "",
  onClick
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 8 14" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={onClick}
    >
      <path 
        d="M0.560207 7.36228C0.361441 7.16351 0.361441 6.83651 0.560207 6.63774L6.71553 0.482418C6.9143 0.283652 7.2413 0.283652 7.44006 0.482418C7.63883 0.681184 7.63883 1.00819 7.44006 1.20695L1.64701 7.00001L7.44006 12.7931C7.63883 12.9918 7.63883 13.3188 7.44006 13.5176C7.2413 13.7164 6.9143 13.7164 6.71553 13.5176L0.560207 7.36228Z" 
        fill={color}
      />
    </svg>
  );
};

export default ArrowHead; 