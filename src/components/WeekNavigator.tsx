'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { format, addWeeks, subWeeks, startOfWeek } from 'date-fns';

export function WeekNavigator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentWeekParam = searchParams.get('week');
  const currentWeek = currentWeekParam 
    ? new Date(currentWeekParam) 
    : startOfWeek(new Date(), { weekStartsOn: 1 });

  const goToPreviousWeek = () => {
    const prevWeek = subWeeks(currentWeek, 1);
    router.push(`/summary?week=${format(prevWeek, 'yyyy-MM-dd')}`);
  };

  const goToNextWeek = () => {
    const nextWeek = addWeeks(currentWeek, 1);
    router.push(`/summary?week=${format(nextWeek, 'yyyy-MM-dd')}`);
  };

  const goToCurrentWeek = () => {
    router.push('/summary');
  };

  const isCurrentWeek = !currentWeekParam || 
    format(currentWeek, 'yyyy-MM-dd') === format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  return (
    <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4 mb-6">
      <button
        onClick={goToPreviousWeek}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
      >
        ← Previous Week
      </button>
      
      <div className="text-center">
        <p className="text-sm text-gray-600">Viewing Week Of</p>
        <p className="text-lg font-bold text-gray-900">
          {format(currentWeek, 'MMM d, yyyy')}
        </p>
        {!isCurrentWeek && (
          <button
            onClick={goToCurrentWeek}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Jump to Current Week
          </button>
        )}
      </div>
      
      <button
        onClick={goToNextWeek}
        disabled={isCurrentWeek}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next Week →
      </button>
    </div>
  );
}
