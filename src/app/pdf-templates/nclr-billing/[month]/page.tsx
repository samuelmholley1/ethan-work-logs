import NCLRBillingTemplate from '@/components/pdf/NCLRBillingTemplate';

export default function NCLRBillingPage({
  params,
}: {
  params: { month: string };
}) {
  // Parse month from params (format: "2025-01" for January 2025)
  const [year, monthNum] = params.month.split('-');
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthName = monthNames[parseInt(monthNum) - 1] || '';

  const data = {
    month: monthName,
    year: year,
    clientName: '', // Blank for now
    recordNumber: '', // Blank for now
    serviceType: 'CLS', // Default service type
  };

  return <NCLRBillingTemplate data={data} />;
}
