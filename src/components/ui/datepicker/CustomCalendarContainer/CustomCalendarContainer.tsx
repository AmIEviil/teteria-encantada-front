/* eslint-disable @typescript-eslint/no-explicit-any */
import { CalendarContainer } from "react-datepicker";

export const CustomCalendarContainer = ({ children }: any) => {
  return (
    <div className="custom-calendar-wrapper">
      <CalendarContainer>
        <div style={{ borderTop: "none", padding: "16px", borderRadius: "8px" }}>
          {children}
        </div>
      </CalendarContainer>
    </div>
  );
};
