import { useState, useRef } from 'react';
import './SearchableSelect.css';

export default function SearchableSelect({ label, options = [], value, onChange, placeholder, disabled, error, onSearchChange }) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const selected = options.find((o) => String(o.value) === String(value));

  const handleSearch = (e) => {
    setSearch(e.target.value);
    onSearchChange?.(e.target.value);
  };

  const handleSelect = (opt) => {
    onChange?.(opt.value);
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div className={`ss ${error ? 'ss--error' : ''}`} ref={ref}>
      {label && <label className="ss__label">{label}</label>}
      <div className="ss__control" onClick={() => !disabled && setIsOpen(!isOpen)}>
        {isOpen ? (
          <input
            type="text"
            className="ss__search"
            value={search}
            onChange={handleSearch}
            placeholder={placeholder || 'Type to search...'}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={`ss__value ${!selected ? 'ss__value--placeholder' : ''}`}>
            {selected ? selected.label : placeholder || 'Select...'}
          </span>
        )}
        <span className="ss__arrow">{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && (
        <ul className="ss__dropdown" role="listbox">
          {filtered.length === 0 ? (
            <li className="ss__option ss__option--empty">No results found</li>
          ) : (
            filtered.map((opt) => (
              <li
                key={opt.value}
                className={`ss__option ${String(opt.value) === String(value) ? 'ss__option--active' : ''}`}
                onClick={() => handleSelect(opt)}
                role="option"
                aria-selected={String(opt.value) === String(value)}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
      {error && <span className="ss__error">{error}</span>}
    </div>
  );
}
