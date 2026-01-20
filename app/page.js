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

  const { summary, gl, pl, loan_ops, city_breakdown, partner_breakdown, branch_breakdown, outliers } = report;

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
              <div style={styles.cardSubtext}>
                {summary.field_visits || summary.total_visits} Field
                {summary.dc_visits ? ` · ${summary.dc_visits} DC` : ''}
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>With PL</div>
              <div style={styles.cardValue}>{summary.with_pl}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>PL Conversion</div>
              <div style={styles.cardValue}>{summary.pl_conversion}%</div>
            </div>
          </div>

          {/* GL Stats */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>GL Execution Time</h2>
            <div style={styles.cardRow}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Median</div>
                <div style={styles.statValue}>{gl.median}m</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>p90</div>
                <div style={styles.statValue}>{gl.p90}m</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Min</div>
                <div style={styles.statValue}>{gl.min}m</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Max</div>
                <div style={styles.statValue}>{gl.max}m</div>
              </div>
            </div>
          </div>

          {/* GL Stage Breakdown */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>GL Stage Breakdown (Median)</h2>
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
                  <div style={styles.statValue}>{pl.median}m</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>p90</div>
                  <div style={styles.statValue}>{pl.p90}m</div>
                </div>
              </div>
              {pl.stages && (
                <div style={{...styles.cardRow, marginTop: '12px'}}>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Selection → Initiate</div>
                    <div style={styles.statValue}>{pl.stages.selection_to_initiate || 0}m</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Initiate → Complete</div>
                    <div style={styles.statValue}>{pl.stages.initiate_to_complete || 0}m</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loan Ops Efficiency */}
          {loan_ops && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Loan Ops Efficiency (Median)</h2>
              <div style={styles.cardRow}>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>GL Approval → Initiate</div>
                  <div style={styles.statValue}>{loan_ops.gl_approval_to_initiate || 0}m</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>GL Initiate → Complete</div>
                  <div style={styles.statValue}>{loan_ops.gl_initiate_to_complete || 0}m</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>PL Initiate → Complete</div>
                  <div style={styles.statValue}>{loan_ops.sl_initiate_to_complete || 0}m</div>
                </div>
              </div>
            </div>
          )}

          {/* City Breakdown */}
          {city_breakdown && city_breakdown.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>City Breakdown</h2>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>City</th>
                    <th style={styles.th}>Total</th>
                    <th style={styles.th}>Field</th>
                    <th style={styles.th}>DC</th>
                    <th style={styles.th}>GL Median</th>
                    <th style={styles.th}>PL Count</th>
                    <th style={styles.th}>PL %</th>
                  </tr>
                </thead>
                <tbody>
                  {city_breakdown.map((c) => (
                    <tr key={c.city}>
                      <td style={styles.td}>{c.city}</td>
                      <td style={styles.td}>{c.count}</td>
                      <td style={styles.td}>{c.field || c.count}</td>
                      <td style={styles.td}>{c.dc || 0}</td>
                      <td style={styles.td}>{c.gl_median}m</td>
                      <td style={styles.td}>{c.pl_count}</td>
                      <td style={styles.td}>{Math.round((c.pl_count / c.count) * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Partner Breakdown */}
          {partner_breakdown && partner_breakdown.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Partner Breakdown</h2>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Partner</th>
                    <th style={styles.th}>GL Count</th>
                    <th style={styles.th}>GL Median</th>
                    <th style={styles.th}>PL Count</th>
                    <th style={styles.th}>PL Median</th>
                  </tr>
                </thead>
                <tbody>
                  {partner_breakdown.map((p) => (
                    <tr key={p.partner}>
                      <td style={styles.td}>{p.partner}</td>
                      <td style={styles.td}>{p.count}</td>
                      <td style={styles.td}>{p.gl_median}m</td>
                      <td style={styles.td}>{p.pl_count}</td>
                      <td style={styles.td}>{p.pl_median || '-'}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Branch Breakdown */}
          {branch_breakdown && branch_breakdown.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Branch Breakdown (Top 15)</h2>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Branch</th>
                    <th style={styles.th}>Partner</th>
                    <th style={styles.th}>GL Count</th>
                    <th style={styles.th}>GL Median</th>
                    <th style={styles.th}>PL Count</th>
                  </tr>
                </thead>
                <tbody>
                  {branch_breakdown.slice(0, 15).map((b, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{b.branch}</td>
                      <td style={styles.td}>{b.partner}</td>
                      <td style={styles.td}>{b.count}</td>
                      <td style={styles.td}>{b.gl_median}m</td>
                      <td style={styles.td}>{b.pl_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Outliers */}
          {outliers && outliers.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Slowest Visits (&gt;60m)</h2>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Visit ID</th>
                    <th style={styles.th}>Source</th>
                    <th style={styles.th}>City</th>
                    <th style={styles.th}>Branch</th>
                    <th style={styles.th}>Total</th>
                    <th style={styles.th}>KYC</th>
                    <th style={styles.th}>Appraisal</th>
                    <th style={styles.th}>Sealing</th>
                    <th style={styles.th}>eSign</th>
                    <th style={styles.th}>Disbursal</th>
                  </tr>
                </thead>
                <tbody>
                  {outliers.map((o) => (
                    <tr key={o.visit_id}>
                      <td style={styles.td}>{o.visit_id}</td>
                      <td style={styles.td}>{o.source || 'Field'}</td>
                      <td style={styles.td}>{o.city}</td>
                      <td style={styles.td}>{o.branch}</td>
                      <td style={{...styles.td, fontWeight: 'bold', color: '#ef4444'}}>{o.gl_total}m</td>
                      <td style={styles.td}>{o.stages?.kyc || '-'}m</td>
                      <td style={styles.td}>{o.stages?.gold_appraisal || '-'}m</td>
                      <td style={styles.td}>{o.stages?.gold_sealing || '-'}m</td>
                      <td style={styles.td}>{o.stages?.esign || '-'}m</td>
                      <td style={styles.td}>{o.stages?.disbursal || '-'}m</td>
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
    maxWidth: '1200px',
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
  cardSubtext: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '4px',
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
    fontSize: '11px',
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
    fontSize: '11px',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #334155',
    fontSize: '13px',
  },
  footer: {
    marginTop: '40px',
    paddingTop: '20px',
    borderTop: '1px solid #334155',
    fontSize: '12px',
    color: '#64748b',
  },
};
