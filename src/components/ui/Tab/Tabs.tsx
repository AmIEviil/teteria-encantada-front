import style from "./Tabs.module.css";

interface TabsProps {
  options: { label: string; onClick: () => void }[];
  selectedIndex: number;
}

export const Tabs: React.FC<TabsProps> = ({ options, selectedIndex }) => {
  return (
    <div className={style.tabsContainer}>
      {options.map((option, index) => (
        <span
          key={index}
          onClick={option.onClick}
          className={`${style.tabOption} ${
            selectedIndex === index ? style.selected : ""
          }`}
        >
          {option.label}
        </span>
      ))}
    </div>
  );
};
