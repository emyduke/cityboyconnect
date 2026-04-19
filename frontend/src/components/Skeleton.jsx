import { cn } from '../lib/cn';

const variantClasses = {
  text: 'h-4 w-full mb-2 rounded-md',
  avatar: 'w-12 h-12 rounded-full',
  card: 'h-[120px] w-full rounded-[10px]',
  table: 'h-10 w-full mb-1',
};

export default function Skeleton({ variant = 'text', width, height, count = 1 }) {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <>
      {items.map((i) => (
        <div
          key={i}
          className={cn(
            'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer',
            variantClasses[variant] || variantClasses.text,
          )}
          style={{ width, height }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}
