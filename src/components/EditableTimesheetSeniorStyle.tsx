'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { formatDuration } from '@/lib/rounding';

// Helper functions for time dropdowns (from senior center)
function parseTime24(time24: string): { hour: string; minute: string; ampm: 'AM' | 'PM' } | null {
  if (!time24 || !time24.includes(':')) return null;
  const date = new Date(time24);
  let hour = date.getHours();
  const minute = date.getMinutes();
  
  const ampm: 'AM' | 'PM' = hour >= 12 ? 'PM' : 'AM';
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  
  // Round minute to nearest 5
  const roundedMinute = Math.round(minute / 5) * 5;
  
  return {
    hour: hour.toString().padStart(2, '0'),
    minute: (roundedMinute === 60 ? 0 : roundedMinute).toString().padStart(2, '0'),
    ampm
  };
}

function buildTime24(dateStr: string, hour: string, minute: string, ampm: 'AM' | 'PM'): string {
  const date = new Date(dateStr);
  let hour24 = parseInt(hour);
  if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
  if (ampm === 'AM' && hour24 === 12) hour24 = 0;
  
  date.setHours(hour24, parseInt(minute), 0, 0);
  return date.toISOString();
}

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

interface EditableTimesheetSeniorStyleProps {
  dailySummaries: DailySummaryDisplay[];
  weekStartDate: Date;
  onRefresh: () => void;
}

export function EditableTimesheetSeniorStyle({
  dailySummaries: initialSummaries,
  weekStartDate,
  onRefresh,
}: EditableTimesheetSeniorStyleProps) {
  const [summaries, setSummaries] = useState(initialSummaries);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);

  const handleTimeChange = (
    dayIndex: number,
    sessionIndex: number,
    blockIndex: number,
    field: 'start' | 'end',
    newTime: string
  ) => {
    const newSummaries = [...summaries];
    const block = newSummaries[dayIndex].sessions[sessionIndex].roundedBlocks[blockIndex];
    
    if (field === 'start') {
      block.roundedStartTime = new Date(newTime);
    } else {
      block.roundedEndTime = new Date(newTime);
    }
    
    // Recalculate duration
    const start = block.roundedStartTime.getTime();
    const end = block.roundedEndTime.getTime();
    block.duration = Math.max(0, (end - start) / 60000); // minutes
    
    // Recalculate session total
    const session = newSummaries[dayIndex].sessions[sessionIndex];
    session.totalMinutes = session.roundedBlocks.reduce((sum, b) => sum + b.duration, 0);
    
    setSummaries(newSummaries);
  };

  const handleSaveChanges = async () => {
    try {
      // Update all changed time blocks
      for (const day of summaries) {
        for (const session of day.sessions) {
          for (const block of session.roundedBlocks) {
            await fetch(`/api/time-blocks/${block.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                startTime: block.roundedStartTime.toISOString(),
                endTime: block.roundedEndTime.toISOString(),
              }),
            });
          }
        }
      }
      
      setIsEditing(false);
      setShowConfirmModal(false);
      onRefresh();
      
      // Show success
      setConfirmModalConfig({
        title: 'Success!',
        message: 'Your timesheet changes have been saved successfully.',
        confirmText: 'OK',
        cancelText: '',
        type: 'info',
        onConfirm: () => setShowConfirmModal(false),
      });
      setShowConfirmModal(true);
    } catch (error) {
      console.error('Error saving:', error);
      setConfirmModalConfig({
        title: 'Error',
        message: 'Failed to save changes. Please try again.',
        confirmText: 'OK',
        cancelText: '',
        type: 'warning',
        onConfirm: () => setShowConfirmModal(false),
      });
      setShowConfirmModal(true);
    }
  };

  const handleEditClick = () => {
    if (isEditing) {
      setConfirmModalConfig({
        title: 'Save Changes?',
        message: 'Would you like to save your timesheet changes?',
        confirmText: 'Save Changes',
        cancelText: 'Discard Changes',
        type: 'info',
        onConfirm: handleSaveChanges,
      });
      setShowConfirmModal(true);
    } else {
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setConfirmModalConfig({
      title: 'Discard Changes?',
      message: 'Are you sure you want to exit edit mode? All unsaved changes will be lost.',
      confirmText: 'Discard Changes',
      cancelText: 'Keep Editing',
      type: 'warning',
      onConfirm: () => {
        setSummaries(initialSummaries);
        setIsEditing(false);
        setShowConfirmModal(false);
        onRefresh();
      },
    });
    setShowConfirmModal(true);
  };

  // Calculate weekly total
  const weeklyTotal = summaries.reduce(
    (total, day) => total + day.sessions.reduce((dayTotal, s) => dayTotal + s.totalMinutes, 0),
    0
  );

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border-2 border-teal-500 p-6 mb-6">
        <h2 className="text-xl font-semibold text-teal-700 mb-4">
          Week of {format(weekStartDate, 'MMM d, yyyy')}
        </h2>

        {/* Edit Mode Warning Banner */}
        {isEditing && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">Edit Mode Active</p>
                <p className="text-xs text-amber-700">Make your changes below, then click "Save Changes" to update Airtable.</p>
              </div>
            </div>
          </div>
        )}

        {summaries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No work sessions found for this week.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6 md:mx-0 md:px-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                  <thead className="bg-teal-50">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">Date</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">Service</th>
                      <th className="px-1 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">In</th>
                      <th className="px-1 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">Out</th>
                      <th className="px-1 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">Hrs</th>
                      <th className="px-1 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {summaries.map((day, dayIndex) => {
                      const totalDayMinutes = day.sessions.reduce((sum, s) => sum + s.totalMinutes, 0);
                      const formattedDate = format(new Date(day.date), 'EEE, MMM d');
                      
                      return day.sessions.map((session, sessionIndex) =>
                        session.roundedBlocks.map((block, blockIndex) => (
                          <tr 
                            key={`${day.date}-${sessionIndex}-${blockIndex}`}
                            className={dayIndex % 2 === 0 ? 'bg-white' : 'bg-teal-50/30'}
                          >
                            {/* Date (rowspan for all blocks in day) */}
                            {sessionIndex === 0 && blockIndex === 0 && (
                              <td
                                className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 font-medium whitespace-nowrap"
                                rowSpan={day.sessions.reduce((sum, s) => sum + s.roundedBlocks.length, 0)}
                              >
                                {formattedDate}
                              </td>
                            )}
                            
                            {/* Service Type (rowspan for all blocks in session) */}
                            {blockIndex === 0 && (
                              <td
                                className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700"
                                rowSpan={session.roundedBlocks.length}
                              >
                                {session.serviceType}
                              </td>
                            )}
                            
                            {/* Time In */}
                            <td className="px-1 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                              {isEditing ? (
                                (() => {
                                  const parsed = parseTime24(block.roundedStartTime.toISOString());
                                  if (!parsed) return <span className="text-gray-400">--</span>;
                                  
                                  return (
                                    <div className="flex gap-1 items-center">
                                      <select
                                        value={parsed.hour}
                                        onChange={(e) => {
                                          const newTime = buildTime24(
                                            block.roundedStartTime.toISOString(),
                                            e.target.value,
                                            parsed.minute,
                                            parsed.ampm
                                          );
                                          handleTimeChange(dayIndex, sessionIndex, blockIndex, 'start', newTime);
                                        }}
                                        className="w-12 px-1 py-1 text-xs border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                                      >
                                        {Array.from({ length: 12 }, (_, i) => {
                                          const h = (i + 1).toString().padStart(2, '0');
                                          return <option key={h} value={h}>{h}</option>;
                                        })}
                                      </select>
                                      <span className="text-teal-700">:</span>
                                      <select
                                        value={parsed.minute}
                                        onChange={(e) => {
                                          const newTime = buildTime24(
                                            block.roundedStartTime.toISOString(),
                                            parsed.hour,
                                            e.target.value,
                                            parsed.ampm
                                          );
                                          handleTimeChange(dayIndex, sessionIndex, blockIndex, 'start', newTime);
                                        }}
                                        className="w-12 px-1 py-1 text-xs border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                                      >
                                        {Array.from({ length: 12 }, (_, i) => {
                                          const m = (i * 5).toString().padStart(2, '0');
                                          return <option key={m} value={m}>{m}</option>;
                                        })}
                                      </select>
                                      <select
                                        value={parsed.ampm}
                                        onChange={(e) => {
                                          const newTime = buildTime24(
                                            block.roundedStartTime.toISOString(),
                                            parsed.hour,
                                            parsed.minute,
                                            e.target.value as 'AM' | 'PM'
                                          );
                                          handleTimeChange(dayIndex, sessionIndex, blockIndex, 'start', newTime);
                                        }}
                                        className="w-14 px-1 py-1 text-xs border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                                      >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                      </select>
                                    </div>
                                  );
                                })()
                              ) : (
                                format(new Date(block.roundedStartTime), 'h:mm a')
                              )}
                            </td>
                            
                            {/* Time Out */}
                            <td className="px-1 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                              {isEditing ? (
                                (() => {
                                  const parsed = parseTime24(block.roundedEndTime.toISOString());
                                  if (!parsed) return <span className="text-gray-400">--</span>;
                                  
                                  return (
                                    <div className="flex gap-1 items-center">
                                      <select
                                        value={parsed.hour}
                                        onChange={(e) => {
                                          const newTime = buildTime24(
                                            block.roundedEndTime.toISOString(),
                                            e.target.value,
                                            parsed.minute,
                                            parsed.ampm
                                          );
                                          handleTimeChange(dayIndex, sessionIndex, blockIndex, 'end', newTime);
                                        }}
                                        className="w-12 px-1 py-1 text-xs border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                                      >
                                        {Array.from({ length: 12 }, (_, i) => {
                                          const h = (i + 1).toString().padStart(2, '0');
                                          return <option key={h} value={h}>{h}</option>;
                                        })}
                                      </select>
                                      <span className="text-teal-700">:</span>
                                      <select
                                        value={parsed.minute}
                                        onChange={(e) => {
                                          const newTime = buildTime24(
                                            block.roundedEndTime.toISOString(),
                                            parsed.hour,
                                            e.target.value,
                                            parsed.ampm
                                          );
                                          handleTimeChange(dayIndex, sessionIndex, blockIndex, 'end', newTime);
                                        }}
                                        className="w-12 px-1 py-1 text-xs border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                                      >
                                        {Array.from({ length: 12 }, (_, i) => {
                                          const m = (i * 5).toString().padStart(2, '0');
                                          return <option key={m} value={m}>{m}</option>;
                                        })}
                                      </select>
                                      <select
                                        value={parsed.ampm}
                                        onChange={(e) => {
                                          const newTime = buildTime24(
                                            block.roundedEndTime.toISOString(),
                                            parsed.hour,
                                            parsed.minute,
                                            e.target.value as 'AM' | 'PM'
                                          );
                                          handleTimeChange(dayIndex, sessionIndex, blockIndex, 'end', newTime);
                                        }}
                                        className="w-14 px-1 py-1 text-xs border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                                      >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                      </select>
                                    </div>
                                  );
                                })()
                              ) : (
                                format(new Date(block.roundedEndTime), 'h:mm a')
                              )}
                            </td>
                            
                            {/* Hours for this block */}
                            <td className="px-1 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900">
                              {formatDuration(block.duration)}
                            </td>
                            
                            {/* Total for day (rowspan for all blocks in day) */}
                            {sessionIndex === 0 && blockIndex === 0 && (
                              <td
                                className="px-1 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold text-teal-700 bg-teal-50"
                                rowSpan={day.sessions.reduce((sum, s) => sum + s.roundedBlocks.length, 0)}
                              >
                                {formatDuration(totalDayMinutes)}
                              </td>
                            )}
                          </tr>
                        ))
                      );
                    })}
                    
                    {/* Weekly Total Row */}
                    <tr className="bg-teal-50 border-t-4 border-teal-500">
                      <td className="px-2 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-bold text-teal-700" colSpan={4}>
                        Weekly Total
                      </td>
                      <td className="px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-bold text-teal-900">
                        {formatDuration(weeklyTotal)}
                      </td>
                      <td className="px-1 sm:px-4 py-2 sm:py-4"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-8">
        <button
          onClick={handleEditClick}
          className="px-4 sm:px-6 py-3 bg-[#5eb3a1] text-white font-semibold rounded-lg hover:bg-[#4a9a8a] transition-colors inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm sm:text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="whitespace-nowrap">{isEditing ? 'Save Changes' : 'Edit Timesheet'}</span>
        </button>
        
        {isEditing && (
          <button
            onClick={handleCancelEdit}
            className="px-4 sm:px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="whitespace-nowrap">Cancel</span>
          </button>
        )}
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && confirmModalConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-teal-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold text-white">{confirmModalConfig.title}</h3>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6">
              <p className="text-gray-700 text-base leading-relaxed">
                {confirmModalConfig.message}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => {
                  confirmModalConfig.onConfirm();
                }}
                className={`flex-1 px-4 py-3 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg ${
                  confirmModalConfig.type === 'warning' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                {confirmModalConfig.confirmText}
              </button>
              {confirmModalConfig.cancelText && (
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors shadow-md"
                >
                  {confirmModalConfig.cancelText}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
