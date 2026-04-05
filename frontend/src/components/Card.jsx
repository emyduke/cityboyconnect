import './Card.css';

export default function Card({ children, padding = 'md', className = '', onClick }) {
  return (
    <div className={`card card--${padding} ${onClick ? 'card--clickable' : ''} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
