import { type ReactNode, useEffect, useRef, useState } from "react";
import style from "./CustomDropmenu.module.css";

type DropmenuVariant = "primary" | "secondary" | "danger" | "ghost";

type MenuLeafOption = {
  label: string;
  onClick: () => void;
};

type MenuOption =
  | MenuLeafOption
  | {
      label: string;
      subOptions: MenuLeafOption[];
      onClick?: never;
    };

type MenuPlacement = {
  horizontal: "left" | "right";
  vertical: "up" | "down";
};

interface CustomDropmenuV2Props {
  options: MenuOption[];
  icon: ReactNode;
  label?: string;
  typeClass?: DropmenuVariant;
  menuAreaElement?: HTMLElement | null;
}

const CustomDropmenuV2 = ({
  options,
  icon,
  label,
  typeClass = "primary",
  menuAreaElement,
}: CustomDropmenuV2Props) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState<number | null>(null);
  const [placement, setPlacement] = useState<MenuPlacement>({
    horizontal: "left",
    vertical: "down",
  });

  const typeClassMap = {
    primary: style.primary,
    secondary: style.secondary,
    danger: style.danger,
    ghost: style.ghost,
  } as const;

  const resolvedClass = typeClassMap[typeClass ?? "primary"];

  const closeMenu = () => {
    setIsOpen(false);
    setOpenSubmenuIndex(null);
  };

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
    setOpenSubmenuIndex(null);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // La posición del menú depende de medir el DOM (getBoundingClientRect), que
  // solo está disponible tras el render: el setState aquí es intencional.
  useEffect(() => {
    if (!isOpen) return;

    const triggerElement = triggerRef.current;
    if (!triggerElement) {
      return;
    }

    const triggerRect = triggerElement.getBoundingClientRect();
    const areaRect = menuAreaElement?.getBoundingClientRect();

    if (!areaRect || areaRect.width <= 0 || areaRect.height <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- placement basado en medición del DOM
      setPlacement({
        horizontal: "left",
        vertical: "down",
      });
      return;
    }

    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    const triggerCenterY = triggerRect.top + triggerRect.height / 2;
    const areaCenterX = areaRect.left + areaRect.width / 2;
    const areaCenterY = areaRect.top + areaRect.height / 2;

    setPlacement({
      horizontal: triggerCenterX < areaCenterX ? "right" : "left",
      vertical: triggerCenterY < areaCenterY ? "down" : "up",
    });
  }, [isOpen, menuAreaElement]);

  const menuPositionStyle = {
    top: placement.vertical === "down" ? "100%" : "auto",
    bottom: placement.vertical === "up" ? "100%" : "auto",
    left: placement.horizontal === "right" ? "0" : "auto",
    right: placement.horizontal === "left" ? "0" : "auto",
    marginTop: placement.vertical === "down" ? "0.5rem" : "0",
    marginBottom: placement.vertical === "up" ? "0.5rem" : "0",
  };

  const submenuClass =
    placement.horizontal === "right"
      ? style.submenuContainerRight
      : style.submenuContainerLeft;

  return (
    <div
      className={style.dropmenuContainer}
      ref={menuRef}
      style={{ zIndex: isOpen ? 100001 : 40 }}
    >
      <button
        type="button"
        ref={triggerRef}
        className={`${style.dropmenuLabel} ${resolvedClass}`}
        onClick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {label && <span>{label}</span>}
        {icon}
      </button>

      {isOpen && (
        <div
          className={`${style.dropmenuOptionsContainer} ${resolvedClass}`}
          style={menuPositionStyle}
          role="menu"
        >
          {options.map((option, index) => (
            <div
              key={option.label + index}
              className={style.optionRow}
            >
              <button
                type="button"
                className={`${style.optionLabel} ${resolvedClass}`}
                role="menuitem"
                onClick={() => {
                  if ("subOptions" in option) {
                    setOpenSubmenuIndex((prev) => (prev === index ? null : index));
                    return;
                  }

                  option.onClick();
                  closeMenu();
                }}
              >
                <span>{option.label}</span>
                {"subOptions" in option && <span aria-hidden="true">▸</span>}
              </button>

              {"subOptions" in option && openSubmenuIndex === index && (
                <div className={`${style.submenuContainer} ${submenuClass}`} role="menu">
                  {option.subOptions.map((subOption, subIndex) => (
                    <button
                      key={subOption.label + subIndex}
                      type="button"
                      className={`${style.optionLabel} ${resolvedClass}`}
                      role="menuitem"
                      onClick={() => {
                        subOption.onClick();
                        closeMenu();
                      }}
                    >
                      {subOption.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropmenuV2;
