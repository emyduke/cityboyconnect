import './StepIndicator.css';

export default function StepIndicator({ steps = [], current = 0 }) {
  return (
    <div className="step-indicator" role="navigation" aria-label="Progress">
      {steps.map((step, i) => (
        <div key={i} className={`step-indicator__step ${i < current ? 'step-indicator__step--done' : ''} ${i === current ? 'step-indicator__step--active' : ''}`}>
          <div className="step-indicator__circle">{i < current ? '✓' : i + 1}</div>
          <span className="step-indicator__label">{step}</span>
          {i < steps.length - 1 && <div className="step-indicator__line" />}
        </div>
      ))}
    </div>
  );
}
