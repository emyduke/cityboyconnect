import './Modal.css';
import { useEffect, useRef } from 'react';

export default function Modal({ title, children, onClose, show = true }) {
  const overlayRef = useRef();

  useEffect(() => {
    if (show) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!show) return null;

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__header">
          <h3 className="modal__title">{title}</h3>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
