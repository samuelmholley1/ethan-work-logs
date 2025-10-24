'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useRouter } from 'next/navigation';

interface TimeBlockInput {
  startTime: string;
  endTime: string;
}

interface ManualEntryForm {
  date: Date;
  serviceType: 'CLS' | 'Supported Employment';
  userId: string;
  timeBlocks: TimeBlockInput[];
}

export default function ManualEntryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<ManualEntryForm>({
    defaultValues: {
      date: new Date(),
      serviceType: 'CLS',
      userId: '',
      timeBlocks: [{ startTime: '', endTime: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'timeBlocks',
  });

  const watchDate = watch('date');

  const onSubmit = async (data: ManualEntryForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate date range (max 1 year in past, no future dates)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (data.date > today) {
        throw new Error('Cannot create entries for future dates');
      }
      if (data.date < oneYearAgo) {
        throw new Error('Cannot create entries more than 1 year in the past');
      }
      
      // Validate at least one time block
      if (data.timeBlocks.length === 0) {
        throw new Error('At least one time block is required');
      }
      
      // Validate time blocks and check for overlaps
      const blockRanges: Array<{ start: number; end: number }> = [];
      
      for (const block of data.timeBlocks) {
        if (!block.startTime || !block.endTime) continue;
        
        const [startHour, startMin] = block.startTime.split(':').map(Number);
        const [endHour, endMin] = block.endTime.split(':').map(Number);
        let startMinutes = startHour * 60 + startMin;
        let endMinutes = endHour * 60 + endMin;
        
        // Handle time blocks spanning midnight (e.g., 11pm - 1am)
        // If end time < start time, assume it crosses midnight
        if (endMinutes < startMinutes) {
          endMinutes += 24 * 60; // Add 24 hours to end time
        }
        
        if (startMinutes === endMinutes) {
          throw new Error('Time blocks cannot have zero duration (start time = end time)');
        }
        
        const duration = endMinutes - startMinutes;
        if (duration > 16 * 60) { // 16 hours
          throw new Error('Time blocks cannot exceed 16 hours');
        }
        
        // Check for overlaps with existing blocks
        for (const existing of blockRanges) {
          const overlapStart = Math.max(startMinutes, existing.start);
          const overlapEnd = Math.min(endMinutes, existing.end);
          
          if (overlapStart < overlapEnd) {
            throw new Error('Time blocks cannot overlap. Please check your time entries.');
          }
        }
        
        blockRanges.push({ start: startMinutes, end: endMinutes });
      }
      
      // Validate userId format
      if (!data.userId.startsWith('rec')) {
        throw new Error('User ID must be a valid Airtable record ID (starts with "rec")');
      }
      
      // First, create the work session
      const sessionResponse = await fetch('/api/sessions/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: data.date.toISOString(),
          serviceType: data.serviceType,
          userId: data.userId,
        }),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create work session');
      }

      const { sessionId } = await sessionResponse.json();

      // Then create all time blocks
      for (const block of data.timeBlocks) {
        if (!block.startTime || !block.endTime) continue;

        // Combine date with time
        const startDateTime = new Date(data.date);
        const [startHour, startMin] = block.startTime.split(':');
        startDateTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

        const endDateTime = new Date(data.date);
        const [endHour, endMin] = block.endTime.split(':');
        endDateTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
        
        // Handle midnight crossover - if end time is before start time, add a day
        if (endDateTime < startDateTime) {
          endDateTime.setDate(endDateTime.getDate() + 1);
        }

        const blockResponse = await fetch('/api/time-blocks/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
          }),
        });
        
        if (!blockResponse.ok) {
          const errorData = await blockResponse.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to create time block');
        }
      }

      // Success! Redirect to summary
      router.push('/summary');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Manual Entry
          </h1>
          
          <p className="text-gray-600 mb-6">
            Add a retroactive work session with custom time blocks.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Date Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Date
              </label>
              <DatePicker
                selected={watchDate}
                onChange={(date) => setValue('date', date || new Date())}
                dateFormat="MMMM d, yyyy"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type
              </label>
              <select
                {...register('serviceType', { required: 'Service type is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="CLS">CLS</option>
                <option value="Supported Employment">Supported Employment</option>
              </select>
              {errors.serviceType && (
                <p className="text-red-600 text-sm mt-1">{errors.serviceType.message}</p>
              )}
            </div>

            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID (Airtable Record ID)
              </label>
              <input
                type="text"
                {...register('userId', { required: 'User ID is required' })}
                placeholder="rec..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              {errors.userId && (
                <p className="text-red-600 text-sm mt-1">{errors.userId.message}</p>
              )}
            </div>

            {/* Time Blocks */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Time Blocks
                </label>
                <button
                  type="button"
                  onClick={() => append({ startTime: '', endTime: '' })}
                  className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700"
                >
                  + Add Block
                </button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-3">
                    <input
                      type="time"
                      {...register(`timeBlocks.${index}.startTime`, {
                        required: 'Start time is required',
                      })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      {...register(`timeBlocks.${index}.endTime`, {
                        required: 'End time is required',
                      })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Entry...' : 'Create Entry'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
