import './Reports.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReports } from '../api/client';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const statusVariant = { DRAFT: 'default', SUBMITTED: 'info', ACKNOWLEDGED: 'warning', REVIEWED: 'success' };

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getReports();
        setReports(res.data.data || res.data.results || res.data || []);
      } catch { /* ok */ }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="reports-page">
      <div className="reports-page__header">
        <h1>Reports</h1>
        <Button size="sm" onClick={() => navigate('/reports/new')}>+ New Report</Button>
      </div>
      {loading ? (
        <div className="reports-grid"><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : reports.length === 0 ? (
        <EmptyState title="No reports" description="Submit your first grassroots report" icon="📋" action={<Button size="sm" onClick={() => navigate('/reports/new')}>Create Report</Button>} />
      ) : (
        <div className="reports-grid">
          {reports.map(r => (
            <Card key={r.id} padding="md" className="report-item">
              <div className="report-item__header">
                <Badge variant={statusVariant[r.status] || 'default'}>{r.status}</Badge>
                <span className="report-item__period">{r.report_period}</span>
              </div>
              <h3 className="report-item__level">{r.report_level} Report</h3>
              <p className="report-item__summary">{r.summary_of_activities?.slice(0, 100)}...</p>
              <div className="report-item__stats">
                <span>New: {r.membership_new}</span>
                <span>Total: {r.membership_total}</span>
                <span>Events: {r.events_held}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
