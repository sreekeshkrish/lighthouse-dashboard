export const dynamic = 'force-dynamic';

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

function formatCurrency(amount) {
  if (!amount) return '₹0';
  return '₹' + amount.toLocaleString('en-IN');
}

function formatSegmentName(segment) {
  if (segment.startsWith('Oro Money - ')) {
    return segment.replace('Oro Money - ', '').replace(' Branch', ' DC');
  }
  return segment;
}

export default async function Dashboard() {
  const report = await getReport();

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

  const { summary, city_breakdown } = report;

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
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>Fresh GL</div>
              <div style={styles.summaryValue}>{summary.total_gl}</div>
              <div style={styles.summaryAmount}>{formatCurrency(summary.total_gl_amount)}</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>With PL</div>
              <div style={styles.summaryValue}>{summary.total_pl}</div>
              <div style={styles.summaryAmount}>{formatCurrency(summary.total_pl_amount)}</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>PL Attach %</div>
              <div style={styles.summaryValue}>{summary.pl_attach_rate}%</div>
            </div>
          </div>

          {/* City Breakdown */}
          {city_breakdown && city_breakdown.map((cityData) => (
            <div key={cityData.city} style={styles.citySection}>
              <div style={styles.cityHeader}>
                <h2 style={styles.cityTitle}>{cityData.city}</h2>
                <div style={styles.cityStats}>
                  <div style={styles.cityStatGroup}>
                    <span style={styles.cityStatLabel}>GL:</span>
                    <span style={styles.cityStatValue}>{cityData.gl_total}</span>
                    <span style={styles.cityStatAmount}>({formatCurrency(cityData.gl_amount)})</span>
                  </div>
                  <div style={styles.cityStatGroup}>
                    <span style={styles.cityStatLabel}>PL:</span>
                    <span style={styles.cityStatValue}>{cityData.pl_total}</span>
                    <span style={styles.cityStatAmount}>({formatCurrency(cityData.pl_amount)})</span>
                  </div>
                  <div style={styles.cityStatGroup}>
                    <span style={styles.cityStatLabel}>Attach:</span>
                    <span style={styles.cityStatValue}>{cityData.pl_attach_rate}%</span>
                  </div>
                </div>
              </div>
              
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Segment</th>
                    <th style={styles.thRight}>GL #</th>
                    <th style={styles.thRight}>GL Amt</th>
                    <th style={styles.thRight}>PL #</th>
                    <th style={styles.thRight}>PL Amt</th>
                    <th style={styles.thRight}>Attach %</th>
                  </tr>
                </thead>
                <tbody>
                  {cityData.segments.map((seg) => (
                    <tr key={seg.segment}>
                      <td style={styles.td}>{formatSegmentName(seg.segment)}</td>
                      <td style={styles.tdRight}>{seg.gl_count}</td>
                      <td style={styles.tdRightAmount}>{formatCurrency(seg.gl_amount)}</td>
                      <td style={styles.tdRight}>{seg.pl_count}</td>
                      <td style={styles.tdRightAmount}>{formatCurrency(seg.pl_amount)}</td>
                      <td style={styles.tdRight}>{seg.pl_attach_rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <footer style={styles.footer}>
            Generated: {new Date(report.generated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </footer>
        </div>
      </body>
    </html>
  );
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
    maxWidth: '900px',
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
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '32px',
  },
  summaryCard: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: '13px',
    color: '#94a3b8',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  summaryValue: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#f8fafc',
  },
  summaryAmount: {
    fontSize: '14px',
    color: '#22c55e',
    marginTop: '4px',
  },
  citySection: {
    marginBottom: '24px',
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  cityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#334155',
    flexWrap: 'wrap',
    gap: '12px',
  },
  cityTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    color: '#f8fafc',
  },
  cityStats: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  cityStatGroup: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  cityStatLabel: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  cityStatValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f8fafc',
  },
  cityStatAmount: {
    fontSize: '12px',
    color: '#22c55e',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    borderBottom: '1px solid #334155',
  },
  thRight: {
    padding: '12px 16px',
    textAlign: 'right',
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    borderBottom: '1px solid #334155',
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    borderBottom: '1px solid #334155',
  },
  tdRight: {
    padding: '12px 16px',
    fontSize: '14px',
    textAlign: 'right',
    borderBottom: '1px solid #334155',
  },
  tdRightAmount: {
    padding: '12px 16px',
    fontSize: '13px',
    textAlign: 'right',
    borderBottom: '1px solid #334155',
    color: '#22c55e',
  },
  footer: {
    marginTop: '40px',
    paddingTop: '20px',
    borderTop: '1px solid #334155',
    fontSize: '12px',
    color: '#64748b',
  },
};
