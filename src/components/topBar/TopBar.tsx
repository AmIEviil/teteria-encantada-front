import style from "./TopBar.module.css";
import CustomDropmenu from "../ui/customdropmenu/NavBarComponent";

export const TopBar = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  return (
    <div className={style.topBarContainer}>
      <div className={style.headerModuleContainer}>
        <span className="font-andirla">D'encanto</span>
      </div>
      <CustomDropmenu isAuthenticated={isAuthenticated} />
    </div>
  );
};
