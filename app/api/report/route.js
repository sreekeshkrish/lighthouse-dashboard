import { kv } from '@vercel/kv';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.LIGHTHOUSE_API_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const report = await request.json();
    
    // Store latest report
    await kv.set('lighthouse:latest', report);
    
    // Store historical report by date
    const reportDate = report.report_date || new Date().toISOString().split('T')[0];
    await kv.set(`lighthouse:${reportDate}`, report);
    
    // Keep track of report dates (last 30)
    const dates = await kv.get('lighthouse:dates') || [];
    if (!dates.includes(reportDate)) {
      dates.unshift(reportDate);
      if (dates.length > 30) dates.pop();
      await kv.set('lighthouse:dates', dates);
    }

    return Response.json({ success: true, date: reportDate });
  } catch (error) {
    console.error('Error storing report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    let report;
    if (date) {
      report = await kv.get(`lighthouse:${date}`);
    } else {
      report = await kv.get('lighthouse:latest');
    }
    
    if (!report) {
      return Response.json({ error: 'No report found' }, { status: 404 });
    }
    
    return Response.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
