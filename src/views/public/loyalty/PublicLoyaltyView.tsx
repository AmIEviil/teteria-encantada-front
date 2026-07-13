import { LoyaltyView } from "../../LoyaltyView/LoyaltyView";
import "../PublicViews.css";

export const PublicLoyaltyView = () => {
  return (
    <main className="publicPage">
      <div className="publicPageContainer">

        <section className="publicPanel">
          <LoyaltyView />
        </section>
      </div>
    </main>
  );
};
