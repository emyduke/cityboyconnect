import { useState, useRef } from 'react';
import { cn } from '../lib/cn';

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
    <div className="relative flex flex-col gap-1" ref={ref}>
      {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
      <div
        className={cn(
          'flex items-center px-3.5 py-2.5 border-[1.5px] border-gray-300 rounded-[10px] bg-white cursor-pointer transition-colors hover:border-gray-400',
          error && 'border-danger',
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <input
            type="text"
            className="flex-1 border-none outline-none text-[0.9375rem] bg-transparent"
            value={search}
            onChange={handleSearch}
            placeholder={placeholder || 'Type to search...'}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={cn('flex-1 text-[0.9375rem]', !selected && 'text-gray-400')}>
            {selected ? selected.label : placeholder || 'Select...'}
          </span>
        )}
        <span className="text-[0.625rem] text-gray-400 ml-2">{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && (
        <ul className="absolute top-full left-0 right-0 bg-white border-[1.5px] border-gray-200 rounded-[10px] shadow-elevated max-h-[200px] overflow-y-auto z-[100] list-none mt-1" role="listbox">
          {filtered.length === 0 ? (
            <li className="px-3.5 py-2 text-[0.9375rem] text-gray-400 cursor-default">No results found</li>
          ) : (
            filtered.map((opt) => (
              <li
                key={opt.value}
                className={cn(
                  'px-3.5 py-2 text-[0.9375rem] cursor-pointer transition-colors',
                  String(opt.value) === String(value) ? 'bg-forest text-white hover:bg-forest-light' : 'hover:bg-gray-50',
                )}
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
      {error && <span className="text-[0.8125rem] text-danger">{error}</span>}
    </div>
  );
}
