import './Skeleton.css';

export default function Skeleton({ variant = 'text', width, height, count = 1 }) {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <>
      {items.map((i) => (
        <div
          key={i}
          className={`skeleton skeleton--${variant}`}
          style={{ width, height }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}
