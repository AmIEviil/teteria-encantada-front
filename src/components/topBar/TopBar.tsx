import style from "./TopBar.module.css";
import CustomDropmenu from "../ui/customdropmenu/NavBarComponent";

export const TopBar = () => {
  return (
    <div className={style.topBarContainer}>
      <div className={style.headerModuleContainer}>
        <span>Portal D'Encanto</span>
      </div>
      <CustomDropmenu />
    </div>
  );
};
