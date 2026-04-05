import { useState } from 'react';
import './CardFlow.css';
import ProgressBar from '../ProgressBar';

function CardRenderer({ card, data, goNext, goBack, goTo, current, total }) {
  return card({ data, goNext, goBack, goTo, current, total });
}

export default function CardFlow({ cards, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [data, setData] = useState({});
  const [direction, setDirection] = useState('forward');

  const goNext = (cardData) => {
    setData((prev) => ({ ...prev, ...cardData }));
    setDirection('forward');
    if (current < cards.length - 1) {
      setCurrent((prev) => prev + 1);
    } else if (onComplete) {
      onComplete({ ...data, ...cardData });
    }
  };

  const goBack = () => {
    if (current > 0) {
      setDirection('backward');
      setCurrent((prev) => prev - 1);
    }
  };

  const goTo = (index) => {
    if (index >= 0 && index < cards.length) {
      setDirection(index > current ? 'forward' : 'backward');
      setCurrent(index);
    }
  };

  return (
    <div className="card-flow">
      <ProgressBar value={current + 1} max={cards.length} />
      <div className={`flow-card card-enter-${direction}`} key={current}>
        <CardRenderer
          card={cards[current]}
          data={data}
          goNext={goNext}
          goBack={goBack}
          goTo={goTo}
          current={current}
          total={cards.length}
        />
      </div>
      <div className="card-flow__footer">
        <span className="card-flow__step">
          Step {current + 1} of {cards.length}
        </span>
      </div>
    </div>
  );
}
