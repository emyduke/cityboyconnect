import './Avatar.css';

export default function Avatar({ src, name = '', size = 'md' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className={`avatar avatar--${size}`}>
      {src ? (
        <img src={src} alt={name} className="avatar__img" />
      ) : (
        <span className="avatar__initials">{initials || '?'}</span>
      )}
    </div>
  );
}
