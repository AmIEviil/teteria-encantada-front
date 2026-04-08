import React from "react";
import styles from "./loading.module.css";
import PiscinasElMaipoIcon from "../Icons/piscinasDelMaipoIcon";

interface LoadingSpinnerProps {
  size?: number;
  iconSize?: number;
  testId?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 196,
  iconSize = 60,
  testId,
}) => {
  return (
    <div
      className={styles.spinnerContainer}
      style={{ width: size, height: size }}
      data-testid={testId}
    >
      <div className={styles.spinnerCircle}></div>
      <div className="icon">
        <PiscinasElMaipoIcon size={iconSize} />
      </div>
    </div>
  );
};

export default LoadingSpinner;
