'use client';

import { useState, Fragment } from 'react';
import { format, addDays } from 'date-fns';
import { EditableTimeBlock } from '@/components/EditableTimeBlock';
import { formatDuration } from '@/lib/rounding';

interface TimeBlockDisplay {
  id: string;
  roundedStartTime: Date;
  roundedEndTime: Date;
  duration: number;
  sessionId: string;
}

interface SessionDisplay {
  serviceType: string;
  roundedBlocks: TimeBlockDisplay[];
  totalMinutes: number;
}

interface DailySummaryDisplay {
  date: string;
  sessions: SessionDisplay[];
}

interface EditableTimesheetProps {
  dailySummaries: DailySummaryDisplay[];
  weekStartDate: Date;
  onRefresh: () => void;
}

export function EditableTimesheet({
  dailySummaries: initialSummaries,
  weekStartDate,
  onRefresh,
}: EditableTimesheetProps) {
  const [summaries, setSummaries] = useState(initialSummaries);
  const [addingToSession, setAddingToSession] = useState<string | null>(null);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [addError, setAddError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSaveBlock = async (blockId: string, startTime: string, endTime: string) => {
    const response = await fetch(`/api/time-blocks/${blockId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startTime, endTime }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save');
    }

    // Refresh data after successful save
    onRefresh();
  };

  const handleDeleteBlock = async (blockId: string) => {
    const response = await fetch(`/api/time-blocks/${blockId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete');
    }

    // Refresh data after successful delete
    onRefresh();
  };

  const handleAddBlock = async (sessionId: string, dateStr: string) => {
    if (!newStartTime || !newEndTime) {
      setAddError('Both times are required');
      return;
    }

    try {
      // Parse times and combine with session date
      const [startHour, startMin] = newStartTime.split(':').map(Number);
      const [endHour, endMin] = newEndTime.split(':').map(Number);

      if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
        setAddError('Invalid time format');
        return;
      }

      const sessionDate = new Date(dateStr);
      
      const startDate = new Date(sessionDate);
      startDate.setHours(startHour, startMin, 0, 0);

      const endDate = new Date(sessionDate);
      endDate.setHours(endHour, endMin, 0, 0);

      if (endDate <= startDate) {
        setAddError('End time must be after start time');
        return;
      }

      setIsAdding(true);
      setAddError('');

      const response = await fetch('/api/time-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add time block');
      }

      // Reset form and refresh
      setAddingToSession(null);
      setNewStartTime('');
      setNewEndTime('');
      onRefresh();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to add time block');
      console.error('Add block error:', e);
    } finally {
      setIsAdding(false);
    }
  };

  const handleCancelAdd = () => {
    setAddingToSession(null);
    setNewStartTime('');
    setNewEndTime('');
    setAddError('');
  };

  // Calculate weekly total from current state
  const weeklyTotal = summaries.reduce(
    (total, day) => total + day.sessions.reduce((dayTotal, s) => dayTotal + s.totalMinutes, 0),
    0
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Timesheet Summary
        </h2>
        <p className="text-sm text-gray-600">
          Week of {format(weekStartDate, 'MMM d, yyyy')}
        </p>
      </div>

      {summaries.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No work sessions found for this week.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summaries.map((day) =>
                  day.sessions.map((session, sessionIdx) => {
                    const sessionId = session.roundedBlocks[0]?.sessionId || '';
                    const blocksToRender = session.roundedBlocks;
                    const isAddingHere = addingToSession === sessionId;

                    return (
                      <Fragment key={`${day.date}-${sessionIdx}`}>
                        {blocksToRender.map((block, blockIdx) => (
                          <tr key={`${day.date}-${sessionIdx}-${blockIdx}`}>
                            {blockIdx === 0 && sessionIdx === 0 && (
                              <td
                                className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                                rowSpan={
                                  day.sessions.reduce((sum, s) => sum + s.roundedBlocks.length, 0) +
                                  day.sessions.filter(s => addingToSession === s.roundedBlocks[0]?.sessionId).length
                                }
                              >
                                {format(new Date(day.date), 'EEE, MMM d')}
                              </td>
                            )}
                            {blockIdx === 0 && (
                              <td
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                                rowSpan={session.roundedBlocks.length + (isAddingHere ? 1 : 0)}
                              >
                                {session.serviceType}
                              </td>
                            )}
                            <EditableTimeBlock
                              id={block.id}
                              startTime={block.roundedStartTime.toISOString()}
                              endTime={block.roundedEndTime.toISOString()}
                              duration={formatDuration(block.duration)}
                              onSave={handleSaveBlock}
                              onDelete={handleDeleteBlock}
                            />
                          </tr>
                        ))}

                        {/* Add Time Block Row */}
                        {isAddingHere && (
                          <tr className="bg-blue-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="time"
                                value={newStartTime}
                                onChange={(e) => setNewStartTime(e.target.value)}
                                className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={isAdding}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="time"
                                value={newEndTime}
                                onChange={(e) => setNewEndTime(e.target.value)}
                                className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={isAdding}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              New block
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {addError && (
                                <p className="text-red-600 text-xs mb-1">{addError}</p>
                              )}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAddBlock(sessionId, day.date)}
                                  disabled={isAdding}
                                  className="text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                                >
                                  {isAdding ? 'Adding...' : 'Add'}
                                </button>
                                <button
                                  onClick={handleCancelAdd}
                                  disabled={isAdding}
                                  className="text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Add Time Block Button Row */}
                        {!isAddingHere && sessionIdx === day.sessions.length - 1 && (
                          <tr className="bg-gray-50">
                            <td colSpan={6} className="px-6 py-2 text-center">
                              <button
                                onClick={() => setAddingToSession(sessionId)}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                + Add Time Block to {format(new Date(day.date), 'MMM d')}
                              </button>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-sm font-bold text-gray-900 text-right"
                  >
                    Weekly Total:
                  </td>
                  <td
                    colSpan={2}
                    className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900"
                  >
                    {formatDuration(weeklyTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
