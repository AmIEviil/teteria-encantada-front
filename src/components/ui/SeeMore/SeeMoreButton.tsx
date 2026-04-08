import { useEffect, useRef, useState } from "react";
import s from "./SeeMoreButton.module.css";
import { Tooltip } from "@mui/material";
import EyeIcon from "../icons/EyeIcon";

interface SeeMoreButtonProps {
  labelTooltip?: string;
  content?: string;
  customClassName?: string;
  customContent?: React.ReactNode;
  customIcon?: React.ReactNode;
}

const SeeMoreButton = ({
  labelTooltip,
  content,
  customClassName,
  customContent,
  customIcon,
}: SeeMoreButtonProps) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`${s.dropmenuContainer} ${customClassName}`}>
      <Tooltip title={labelTooltip || "Ver Observaciones"} arrow leaveDelay={0}>
        <span
          className={`${s.dropmenuLabel} ${isOpen ? s.active : ""}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {customIcon || (
            <EyeIcon
              open={isOpen}
              className={`${s.dropmenuIcon} ${isOpen ? s.active : ""}`}
              size={24}
            />
          )}
        </span>
      </Tooltip>
      <div
        ref={modalRef}
        style={{ display: isOpen ? "block" : "none" }}
        className={s.dropmenuOptionsContainer}
      >
        {content && <div className={s.optionLabel}>{content}</div>}
        {customContent && <div className={s.optionLabel}>{customContent}</div>}
      </div>
    </div>
  );
};

export default SeeMoreButton;
