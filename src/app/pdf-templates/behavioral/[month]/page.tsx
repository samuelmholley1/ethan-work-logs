import { format } from 'date-fns';
import BehavioralDataSheetTemplate from '@/components/pdf/BehavioralDataSheetTemplate';

interface PageProps {
  params: Promise<{
    month: string; // YYYY-MM format
  }>;
  searchParams: Promise<{
    half?: 'first' | 'second'; // Optional: first or second half of month
  }>;
}

export default async function BehavioralDataSheetPDFPage({ params, searchParams }: PageProps) {
  const { month } = await params;
  const { half } = await searchParams;
  
  // Parse month (YYYY-MM)
  const [year, monthNum] = month.split('-').map(Number);
  const monthDate = new Date(year, monthNum - 1, 1);
  
  // Format as "MARCH 2025"
  const monthStr = format(monthDate, 'MMMM yyyy').toUpperCase();
  
  const data = {
    month: monthStr,
    halfMonth: half || 'first', // Default to first half (days 1-15)
  };

  return <BehavioralDataSheetTemplate data={data} />;
}
