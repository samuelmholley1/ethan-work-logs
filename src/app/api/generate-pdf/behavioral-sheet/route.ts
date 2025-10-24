import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get('month'); // YYYY-MM format
  const serviceType = searchParams.get('serviceType');

  if (!month) {
    return NextResponse.json(
      { error: 'Month parameter is required (YYYY-MM format)' },
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
    
    let templateUrl = `${baseUrl}/pdf-templates/behavioral/${month}`;
    if (serviceType) {
      templateUrl += `?serviceType=${encodeURIComponent(serviceType)}`;
    }
    
    console.log('Navigating to:', templateUrl);
    
    // Navigate to the template page
    await page.goto(templateUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Generate PDF in landscape mode for the grid layout
    const pdf = await page.pdf({
      format: 'Letter',
      landscape: true,
      printBackground: true,
      margin: {
        top: '0.25in',
        right: '0.25in',
        bottom: '0.25in',
        left: '0.25in',
      },
    });

    await browser.close();

    // Return PDF as downloadable file
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="behavioral-data-sheet-${month}.pdf"`,
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
