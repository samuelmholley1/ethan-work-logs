import TimesheetTemplate from '@/components/pdf/TimesheetTemplate';

interface PageProps {
  params: Promise<{
    week: string;
  }>;
}

export default async function TimesheetPDFPage({ params }: PageProps) {
  const { week } = await params;
  
  // Parse week format "2025-W01" or convert to month format "2025-01"
  // For now, just extract year and use January as default
  const year = week.split('-')[0] || '2025';
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Get current month or default to January
  const currentMonth = new Date().getMonth();
  const monthName = monthNames[currentMonth];

  const data = {
    month: monthName,
    year: year,
  };

  return <TimesheetTemplate data={data} />;
}
