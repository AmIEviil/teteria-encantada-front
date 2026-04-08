
interface CheckboxProps {
    onSelect:React.Dispatch<React.SetStateAction<boolean>>;
    isHeader?:boolean;
}
const Checkbox = ({onSelect,isHeader=false}:CheckboxProps) => {
  return (
    <div className={isHeader ? "checkbox-container-header":"checkbox-container"}>
      <input
        type="checkbox"
        value=""
        onClick={()=>{onSelect(value=>!value)}}
      />
    </div>
  );
};

export default Checkbox;
