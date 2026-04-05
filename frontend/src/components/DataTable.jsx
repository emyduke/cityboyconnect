import './DataTable.css';
import { useState, useMemo } from 'react';
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
    <div className="data-table">
      {searchable && (
        <div className="data-table__search">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="data-table__search-input"
          />
        </div>
      )}
      {sorted.length === 0 ? (
        <EmptyState title={emptyMessage} icon="📭" />
      ) : (
        <div className="data-table__wrap">
          <table className="data-table__table">
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={sortable ? 'data-table__th--sortable' : ''}
                  >
                    {col.label}
                    {sortKey === col.key && <span className="data-table__sort-icon">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr key={row.id ?? i}>
                  {columns.map(col => (
                    <td key={col.key}>{col.render ? col.render(row[col.key], row) : row[col.key]}</td>
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
