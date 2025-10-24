/**
 * Time rounding utilities for timesheet compliance
 * Ensures time entries match the 15-minute interval requirements
 */

export interface TimeBlock {
  id?: string;
  startTime: Date | string;
  endTime: Date | string | null;
  sessionId?: string;
}

export interface RoundedTimeBlock {
  id?: string;
  originalStartTime: Date;
  originalEndTime: Date;
  roundedStartTime: Date;
  roundedEndTime: Date;
  duration: number; // in minutes
  sessionId?: string;
}

/**
 * Rounds a time down to the nearest 15-minute interval
 * Examples:
 * - 10:08 AM -> 10:00 AM
 * - 10:16 AM -> 10:15 AM
 * - 10:22 AM -> 10:15 AM
 */
function roundDownTo15Minutes(date: Date): Date {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.floor(minutes / 15) * 15;
  
  const rounded = new Date(date);
  rounded.setMinutes(roundedMinutes);
  rounded.setSeconds(0);
  rounded.setMilliseconds(0);
  
  return rounded;
}

/**
 * Rounds a time up to the nearest 15-minute interval
 * Examples:
 * - 3:22 PM -> 3:30 PM
 * - 3:16 PM -> 3:30 PM
 * - 3:15 PM -> 3:15 PM (already on interval)
 */
function roundUpTo15Minutes(date: Date): Date {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  
  const rounded = new Date(date);
  
  // Handle overflow to next hour
  if (roundedMinutes === 60) {
    rounded.setHours(rounded.getHours() + 1);
    rounded.setMinutes(0);
  } else {
    rounded.setMinutes(roundedMinutes);
  }
  
  rounded.setSeconds(0);
  rounded.setMilliseconds(0);
  
  return rounded;
}

/**
 * Calculates duration between two times in minutes
 */
function calculateDuration(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Applies 15-minute rounding rules to an array of time blocks
 * - Start times are rounded DOWN to nearest 15-minute interval
 * - End times are rounded UP to nearest 15-minute interval
 * 
 * This ensures compliance with timesheet requirements while
 * being favorable to the caregiver (no lost time)
 */
export function apply15MinuteRounding(timeBlocks: TimeBlock[]): RoundedTimeBlock[] {
  return timeBlocks
    .filter(block => block.endTime) // Only process completed blocks
    .map(block => {
      const startTime = new Date(block.startTime);
      const endTime = new Date(block.endTime!);
      
      const roundedStartTime = roundDownTo15Minutes(startTime);
      const roundedEndTime = roundUpTo15Minutes(endTime);
      
      return {
        id: block.id,
        originalStartTime: startTime,
        originalEndTime: endTime,
        roundedStartTime,
        roundedEndTime,
        duration: calculateDuration(roundedStartTime, roundedEndTime),
        sessionId: block.sessionId,
      };
    });
}

/**
 * Formats a duration in minutes to HH:MM format
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Calculates total duration for multiple time blocks
 */
export function calculateTotalDuration(roundedBlocks: RoundedTimeBlock[]): number {
  return roundedBlocks.reduce((total, block) => total + block.duration, 0);
}
