import { useState } from 'react';
import { cn } from '../../lib/cn';
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
    <div className="max-w-[560px] mx-auto px-4 py-8">
      <ProgressBar value={current + 1} max={cards.length} />
      <div
        className={cn(
          'bg-white border border-gray-200 rounded-2xl p-8 min-h-[320px] flex flex-col gap-5 my-5',
          direction === 'forward' && 'animate-slide-in-right',
          direction === 'backward' && 'animate-slide-in-left',
        )}
        key={current}
      >
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
      <div className="text-center">
        <span className="text-xs text-gray-400">
          Step {current + 1} of {cards.length}
        </span>
      </div>
    </div>
  );
}
