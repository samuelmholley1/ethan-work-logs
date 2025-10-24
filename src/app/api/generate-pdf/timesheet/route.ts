import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const week = searchParams.get('week');

  if (!week) {
    return NextResponse.json(
      { error: 'Week parameter is required (YYYY-MM-DD format)' },
      { status: 400 }
    );
  }

  let browser;
  
  try {
    // Launch headless browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // Build the URL to the hidden template page
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) || 
                    request.nextUrl.origin ||
                    'http://localhost:3000';
    
    const templateUrl = `${baseUrl}/pdf-templates/timesheet/${week}`;
    
    console.log('Navigating to:', templateUrl);
    
    // Navigate to the template page
    await page.goto(templateUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Generate PDF
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
    });

    await browser.close();

    // Return PDF as downloadable file
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="timesheet-${week}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    if (browser) {
      await browser.close();
    }

    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
