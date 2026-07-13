import style from "./Card.module.css";

interface CardProps {
  title: string;
  description: string | null;
  dateLabel: string;
  scheduleLabel?: string;
  ticketsAvailable: boolean;
  imageUrl?: string | null;
  onReserve?: () => void;
}

export const Card = ({
  title,
  description,
  dateLabel,
  scheduleLabel,
  ticketsAvailable,
  imageUrl,
  onReserve,
}: CardProps) => {
  // ponytail: matchMedia check on click, no resize listener needed
  const handleCardClick = () => {
    if (window.matchMedia("(max-width: 480px)").matches) onReserve?.();
  };

  return (
    <div className={style.cardContainer} onClick={handleCardClick}>
      <div className={style.cardContent}>
        <img src={imageUrl || "/path/to/image.jpg"} alt={title} />
        <div className={style.cardBody}>
          <p className={style.cardTitle}>{title}</p>
          {description && <span className={style.cardText}>{description}</span>}
          <span className={style.cardSubtitle}>{dateLabel}</span>
          {scheduleLabel && (
            <span className={style.cardSubtitle}>{scheduleLabel}</span>
          )}
          <span
            className={
              ticketsAvailable ? style.cardAvailable : style.cardSoldOut
            }
          >
            {ticketsAvailable
              ? "Tickets disponibles"
              : "Sin tickets disponibles"}
          </span>
        </div>
      </div>
      <button
        className={style.cardButton}
        onClick={(e) => {
          e.stopPropagation();
          onReserve?.();
        }}
      >
        RESERVAR
      </button>
    </div>
  );
};
