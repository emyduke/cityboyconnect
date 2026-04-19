import { useState, useMemo } from 'react';
import { cn } from '../lib/cn';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';

export default function DataTable({ columns = [], data = [], searchable = false, sortable = false, loading = false, emptyMessage = 'No data found' }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(row => columns.some(col => String(row[col.key] ?? '').toLowerCase().includes(q)));
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  if (loading) return <Skeleton variant="table" />;

  return (
    <div className="flex flex-col gap-4">
      {searchable && (
        <div>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-xs px-4 py-2 border-[1.5px] border-gray-300 rounded-[10px] text-sm outline-none transition-colors focus:border-forest"
          />
        </div>
      )}
      {sorted.length === 0 ? (
        <EmptyState title={emptyMessage} icon="📭" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={cn(
                      'text-left px-4 py-2 bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider whitespace-nowrap border-b border-gray-200',
                      sortable && 'cursor-pointer select-none hover:text-forest',
                    )}
                  >
                    {col.label}
                    {sortKey === col.key && <span className="text-[0.7rem]">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr key={row.id ?? i} className="hover:bg-gray-50">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-2 border-b border-gray-100 text-gray-700">{col.render ? col.render(row[col.key], row) : row[col.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
