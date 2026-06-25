import { PublicHeader } from "../components/public/PublicHeader";
import { LoyaltyView } from "./LoyaltyView/LoyaltyView";
import "./PublicViews.css";

export const PublicLoyaltyView = () => {
  return (
    <main className="publicPage">
      <div className="publicPageContainer">
        <PublicHeader />

        <section className="publicPanel">
          <LoyaltyView />
        </section>
      </div>
    </main>
  );
};
