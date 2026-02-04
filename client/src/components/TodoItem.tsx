import { useState, useRef, useEffect } from 'react';
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import type { Todo } from '../types';
import SubtaskList from './SubtaskList';

interface TodoItemProps {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onDelete: (id: number) => void;
  onPriorityChange?: (id: number, priority: 'low' | 'medium' | 'high') => void;
  onTitleChange?: (id: number, title: string) => void;
  isNew?: boolean;
  onAnimationEnd?: () => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

function toDateOnly(dateStr: string): string {
  return dateStr.slice(0, 10);
}

function getDueDateStatus(dueDate: string, completed: boolean): 'overdue' | 'today' | 'future' {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const dueDateOnly = toDateOnly(dueDate);
  if (!completed && dueDateOnly < todayStr) return 'overdue';
  if (dueDateOnly === todayStr) return 'today';
  return 'future';
}

function formatDueDate(dateStr: string): string {
  const datePart = toDateOnly(dateStr);
  const [year, month, day] = datePart.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const PRIORITY_CYCLE: Record<string, 'low' | 'medium' | 'high'> = {
  high: 'medium',
  medium: 'low',
  low: 'high',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export default function TodoItem({ todo, onToggle, onDelete, onPriorityChange, onTitleChange, isNew, onAnimationEnd, dragHandleProps }: TodoItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editing]);

  const dueDateStatus = todo.due_date ? getDueDateStatus(todo.due_date, todo.completed) : null;
  const priority = todo.priority || 'medium';

  function handlePriorityClick() {
    if (onPriorityChange) {
      onPriorityChange(todo.id, PRIORITY_CYCLE[priority]);
    }
  }

  function handleTitleClick() {
    setEditTitle(todo.title);
    setEditing(true);
  }

  function handleTitleSave() {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== todo.title && onTitleChange) {
      onTitleChange(todo.id, trimmed);
    }
    setEditing(false);
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditTitle(todo.title);
      setEditing(false);
    }
  }

  return (
    <>
      <li className={`todo-item${todo.completed ? ' todo-item--completed' : ''}${isNew ? ' todo-item--enter' : ''}`} onAnimationEnd={onAnimationEnd}>
        <div className="todo-item-header">
          <span className="drag-handle" {...dragHandleProps} aria-label="Drag to reorder">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5" />
              <circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" />
              <circle cx="11" cy="13" r="1.5" />
            </svg>
          </span>
          <label className="todo-item-label">
            <input
              type="checkbox"
              className="todo-checkbox"
              checked={todo.completed}
              onChange={() => onToggle(todo)}
            />
            <span className="todo-checkbox-custom" aria-hidden="true">
              <svg viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </label>
          {editing ? (
            <input
              ref={editInputRef}
              type="text"
              className="todo-title-edit"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              aria-label="Edit todo title"
            />
          ) : (
            <span
              className={`todo-title${todo.completed ? ' completed' : ''}`}
              onClick={handleTitleClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') handleTitleClick(); }}
            >
              {todo.title}
            </span>
          )}
          <div className="todo-item-actions">
            <button
              type="button"
              className={`priority-indicator priority-indicator--${priority}`}
              onClick={handlePriorityClick}
              aria-label={`Priority: ${PRIORITY_LABELS[priority]}. Click to change.`}
              data-testid="priority-indicator"
            >
              <span className={`priority-dot priority-dot--${priority}`} aria-hidden="true" />
              {PRIORITY_LABELS[priority]}
            </button>
            {todo.due_date && dueDateStatus && (
              <span className={`due-date-badge due-date-badge--${dueDateStatus}`} data-testid="due-date-badge">
                {dueDateStatus === 'overdue' ? 'Overdue' : `Due: ${formatDueDate(todo.due_date)}`}
              </span>
            )}
            <button
              className={`subtask-toggle${expanded ? ' subtask-toggle--expanded' : ''}`}
              onClick={() => setExpanded(!expanded)}
              aria-label="Toggle subtasks"
            >
              <span className="subtask-toggle-arrow" aria-hidden="true">▸</span>
              Subtasks
            </button>
            <button className="delete-btn" onClick={() => setConfirmingDelete(true)} aria-label="Delete">
              <span className="delete-btn-icon" aria-hidden="true">🗑</span>
            </button>
          </div>
        </div>
        {expanded && (
          <div className="subtask-section">
            <SubtaskList todoId={todo.id} />
          </div>
        )}
      </li>
      {confirmingDelete && (
        <div className="delete-modal-overlay" onClick={() => setConfirmingDelete(false)}>
          <div className="delete-modal" role="dialog" aria-label="Confirm deletion" onClick={(e) => e.stopPropagation()}>
            <p className="delete-modal-message">Delete this todo and its subtasks?</p>
            <div className="delete-modal-actions">
              <button className="delete-modal-cancel" onClick={() => setConfirmingDelete(false)} aria-label="Cancel delete">
                Cancel
              </button>
              <button className="delete-modal-confirm" onClick={() => { onDelete(todo.id); setConfirmingDelete(false); }} aria-label="Confirm delete">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
