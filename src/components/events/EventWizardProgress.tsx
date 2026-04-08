import "./EventWizardProgress.css";

interface EventWizardProgressProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

export const EventWizardProgress = ({
  steps,
  currentStep,
  onStepClick,
}: EventWizardProgressProps) => {
  return (
    <section className="event-wizard-progress" aria-label="Progreso del formulario">
      {steps.map((stepLabel, stepIndex) => {
        let stepState = "upcoming";

        if (stepIndex < currentStep) {
          stepState = "completed";
        } else if (stepIndex === currentStep) {
          stepState = "active";
        }

        const isLineCompleted = stepIndex < currentStep;

        return (
          <div key={stepLabel + stepIndex} className="event-step-item">
            <button
              type="button"
              className={`event-step-circle ${stepState}`}
              onClick={() => onStepClick?.(stepIndex)}
              aria-current={stepIndex === currentStep ? "step" : undefined}
              aria-label={`Ir al paso ${stepIndex + 1}: ${stepLabel}`}
            >
              {stepIndex + 1}
            </button>

            <span className={`event-step-label ${stepState}`}>{stepLabel}</span>

            {stepIndex < steps.length - 1 && (
              <span
                className={`event-step-line ${isLineCompleted ? "completed" : ""}`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </section>
  );
};
