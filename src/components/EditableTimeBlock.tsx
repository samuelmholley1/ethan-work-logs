'use client';

import { useState } from 'react';
import { format, parse } from 'date-fns';

interface EditableTimeBlockProps {
  id: string;
  startTime: string;
  endTime: string;
  duration: string;
  onSave: (id: string, startTime: string, endTime: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function EditableTimeBlock({
  id,
  startTime,
  endTime,
  duration,
  onSave,
  onDelete,
}: EditableTimeBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedStart, setEditedStart] = useState('');
  const [editedEnd, setEditedEnd] = useState('');
  const [error, setError] = useState('');

  const formatTimeForInput = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'HH:mm');
    } catch (e) {
      return '';
    }
  };

  const handleEdit = () => {
    setEditedStart(formatTimeForInput(startTime));
    setEditedEnd(formatTimeForInput(endTime));
    setIsEditing(true);
    setError('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
  };

  const handleSave = async () => {
    if (!editedStart || !editedEnd) {
      setError('Both times are required');
      return;
    }

    // Validate time format and logic
    try {
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      
      const [startHour, startMin] = editedStart.split(':').map(Number);
      const [endHour, endMin] = editedEnd.split(':').map(Number);

      if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
        setError('Invalid time format');
        return;
      }

      const newStartDate = new Date(startDate);
      newStartDate.setHours(startHour, startMin, 0, 0);

      const newEndDate = new Date(endDate);
      newEndDate.setHours(endHour, endMin, 0, 0);

      if (newEndDate <= newStartDate) {
        setError('End time must be after start time');
        return;
      }

      setIsSaving(true);
      setError('');

      await onSave(id, newStartDate.toISOString(), newEndDate.toISOString());
      setIsEditing(false);
    } catch (e) {
      setError('Failed to save changes');
      console.error('Save error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this time block?')) {
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await onDelete(id);
    } catch (e) {
      setError('Failed to delete time block');
      console.error('Delete error:', e);
      setIsDeleting(false);
    }
  };

  if (isEditing) {
    return (
      <>
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="time"
            value={editedStart}
            onChange={(e) => setEditedStart(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSaving}
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="time"
            value={editedEnd}
            onChange={(e) => setEditedEnd(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSaving}
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          {duration}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          {error && (
            <p className="text-red-600 text-xs mb-1">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </td>
      </>
    );
  }

  return (
    <>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {format(new Date(startTime), 'h:mm a')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {format(new Date(endTime), 'h:mm a')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {duration}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="text-blue-600 hover:text-blue-800 font-medium"
            title="Edit time block"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
            title="Delete time block"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </td>
    </>
  );
}
