import { kv } from '@vercel/kv';

async function getReport() {
  try {
    const report = await kv.get('lighthouse:latest');
    return report;
  } catch (error) {
    console.error('Error fetching report:', error);
    return null;
  }
}

async function getReportDates() {
  try {
    const dates = await kv.get('lighthouse:dates');
    return dates || [];
  } catch (error) {
    return [];
  }
}

export default async function Dashboard() {
  const report = await getReport();
  const dates = await getReportDates();

  if (!report) {
    return (
      <html>
        <head>
          <title>Lighthouse - Oro</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style={styles.body}>
          <div style={styles.container}>
            <h1 style={styles.title}>🏠 Lighthouse</h1>
            <p style={styles.subtitle}>No reports yet. Waiting for first data push from n8n.</p>
          </div>
        </body>
      </html>
    );
  }

  const { summary, gl, pl, outliers, raw_data } = report;
  
  // Top 5 outliers by gl_total
  const topOutliers = [...(outliers || [])].sort((a, b) => b.gl_total - a.gl_total).slice(0, 5);

  return (
    <html>
      <head>
        <title>Lighthouse - {report.report_date}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={styles.body}>
        <div style={styles.container}>
          <header style={styles.header}>
            <h1 style={styles.title}>🏠 Lighthouse</h1>
            <p style={styles.date}>{report.report_date}</p>
          </header>

          {/* Summary Cards */}
          <div style={styles.cardRow}>
            <div style={styles.card}>
              <div style={styles.cardLabel}>Total GL Disbursals</div>
              <div style={styles.cardValue}>{summary.total_visits}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>With PL</div>
              <div style={styles.cardValue}>{summary.with_pl}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>PL Conversion</div>
              <div style={styles.cardValue}>{Math.round((summary.with_pl / summary.total_visits) * 100)}%</div>
            </div>
          </div>

          {/* GL Stats */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>GL Execution Time</h2>
            <div style={styles.cardRow}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Median</div>
                <div style={styles.statValue}>{gl.median} min</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>p90</div>
                <div style={styles.statValue}>{gl.p90} min</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Min</div>
                <div style={styles.statValue}>{gl.min} min</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Max</div>
                <div style={styles.statValue}>{gl.max} min</div>
              </div>
            </div>
          </div>

          {/* Stage Breakdown */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Stage Breakdown (Median)</h2>
            <div style={styles.stageBar}>
              {Object.entries(gl.stages).map(([stage, mins]) => (
                <div key={stage} style={{...styles.stageSegment, flex: Math.max(mins, 1)}}>
                  <div style={styles.stageName}>{formatStageName(stage)}</div>
                  <div style={styles.stageTime}>{mins}m</div>
                </div>
              ))}
            </div>
          </div>

          {/* PL Stats */}
          {pl && pl.count > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>PL Execution Time</h2>
              <div style={styles.cardRow}>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Count</div>
                  <div style={styles.statValue}>{pl.count}</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Median</div>
                  <div style={styles.statValue}>{pl.median} min</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>p90</div>
                  <div style={styles.statValue}>{pl.p90} min</div>
                </div>
              </div>
            </div>
          )}

          {/* Top Outliers */}
          {topOutliers.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Slowest Visits</h2>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Visit ID</th>
                    <th style={styles.th}>Total</th>
                    <th style={styles.th}>KYC</th>
                    <th style={styles.th}>Appraisal</th>
                    <th style={styles.th}>Sealing</th>
                    <th style={styles.th}>eSign</th>
                    <th style={styles.th}>Disbursal</th>
                  </tr>
                </thead>
                <tbody>
                  {topOutliers.map((o) => (
                    <tr key={o.visit_id}>
                      <td style={styles.td}>{o.visit_id}</td>
                      <td style={{...styles.td, fontWeight: 'bold'}}>{o.gl_total}m</td>
                      <td style={styles.td}>{o.stages.kyc}m</td>
                      <td style={styles.td}>{o.stages.gold_appraisal}m</td>
                      <td style={styles.td}>{o.stages.gold_sealing}m</td>
                      <td style={styles.td}>{o.stages.esign}m</td>
                      <td style={styles.td}>{o.stages.disbursal}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <footer style={styles.footer}>
            Generated: {new Date(report.generated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </footer>
        </div>
      </body>
    </html>
  );
}

function formatStageName(stage) {
  const names = {
    kyc: 'KYC',
    gold_appraisal: 'Appraisal',
    gold_sealing: 'Sealing',
    esign: 'eSign',
    disbursal: 'Disbursal'
  };
  return names[stage] || stage;
}

const styles = {
  body: {
    margin: 0,
    padding: 0,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    minHeight: '100vh',
  },
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '24px',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 8px 0',
    color: '#f8fafc',
  },
  date: {
    fontSize: '16px',
    color: '#94a3b8',
    margin: 0,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '16px',
  },
  cardRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '20px',
    flex: '1',
    minWidth: '140px',
  },
  cardLabel: {
    fontSize: '13px',
    color: '#94a3b8',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  cardValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#f8fafc',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#f8fafc',
  },
  statCard: {
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
    minWidth: '100px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#f8fafc',
  },
  stageBar: {
    display: 'flex',
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    overflow: 'hidden',
    minHeight: '60px',
  },
  stageSegment: {
    padding: '12px 8px',
    textAlign: 'center',
    borderRight: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minWidth: '60px',
  },
  stageName: {
    fontSize: '11px',
    color: '#94a3b8',
    marginBottom: '4px',
  },
  stageTime: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fbbf24',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#334155',
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #334155',
    fontSize: '14px',
  },
  footer: {
    marginTop: '40px',
    paddingTop: '20px',
    borderTop: '1px solid #334155',
    fontSize: '12px',
    color: '#64748b',
  },
};
