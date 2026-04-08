import debounce from "lodash.debounce";
import { useEffect, useState, useMemo, useRef } from "react";

interface CustomTextAreaProps {
  title?: string;
  initialValue?: string;
  value?: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  onChange?: (value: string) => void;
}

export const CustomTextArea = ({
  title = "Soy un título",
  initialValue = "",
  value,
  disabled = false,
  placeholder,
  required = false,
  onChange = () => {},
}: CustomTextAreaProps) => {
  const [internalValue, setInternalValue] = useState(
    typeof value === "string" ? value : initialValue
  );
  const [charCount, setCharCount] = useState(
    typeof value === "string" ? value.length : initialValue.length
  );

  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const debouncedChange = useMemo(
    () =>
      debounce((val: string) => {
        onChangeRef.current(val);
      }, 500),
    []
  );

  useEffect(() => {
    return () => {
      debouncedChange.cancel();
    };
  }, [debouncedChange]);

  const maxLength = 250;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    setCharCount(newValue.length);
    debouncedChange(newValue);
  };

  useEffect(() => {
    if (typeof value === "string" && value !== internalValue) {
      setInternalValue(value);
      setCharCount(value.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div>
      <label className="block mb-1 font-medium">
        {title}

        {required && <span className="required">*</span>}
      </label>
      <textarea
        className="w-full h-32 p-2 border border-gray-300 rounded-md custom-scrollbar resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={internalValue}
        onChange={handleChange}
        rows={5}
        cols={30}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
      />
      <span className="text-sm text-right block font-bold">
        {charCount}/{maxLength}
      </span>
    </div>
  );
};
