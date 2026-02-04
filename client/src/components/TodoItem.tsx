import { useState, useRef, useEffect } from 'react';
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import type { Todo, Tag } from '../types';
import SubtaskList from './SubtaskList';
import TagInput from './TagInput';

interface TodoItemProps {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onDelete: (id: number) => void;
  onPriorityChange?: (id: number, priority: 'low' | 'medium' | 'high') => void;
  onTitleChange?: (id: number, title: string) => void;
  onNotesChange?: (id: number, notes: string) => void;
  allTags: Tag[];
  onAddTag: (todoId: number, tag: Tag) => void;
  onCreateAndAddTag: (todoId: number, name: string) => void;
  onRemoveTag: (todoId: number, tagId: number) => void;
  isNew?: boolean;
  onAnimationEnd?: () => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  isSelected?: boolean;
  onSelectToggle?: (id: number) => void;
}

function toDateOnly(dateStr: string): string {
  return dateStr.slice(0, 10);
}

function getDueDateStatus(dueDate: string, completed: boolean): 'overdue' | 'today' | 'soon' | 'future' {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const dueDateOnly = toDateOnly(dueDate);
  if (!completed && dueDateOnly < todayStr) return 'overdue';
  if (dueDateOnly === todayStr) return 'today';
  // Check if due within next 3 days
  const soonDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
  const soonStr = `${soonDate.getFullYear()}-${String(soonDate.getMonth() + 1).padStart(2, '0')}-${String(soonDate.getDate()).padStart(2, '0')}`;
  if (dueDateOnly <= soonStr) return 'soon';
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

export default function TodoItem({ todo, onToggle, onDelete, onPriorityChange, onTitleChange, onNotesChange, allTags, onAddTag, onCreateAndAddTag, onRemoveTag, isNew, onAnimationEnd, dragHandleProps, isSelected, onSelectToggle }: TodoItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [editNotes, setEditNotes] = useState(todo.notes || '');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const editInputRef = useRef<HTMLInputElement>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editing]);

  useEffect(() => {
    if (notesExpanded && notesTextareaRef.current) {
      notesTextareaRef.current.focus();
    }
  }, [notesExpanded]);

  useEffect(() => {
    setEditNotes(todo.notes || '');
  }, [todo.notes]);

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

  function handleNotesSave() {
    const trimmed = editNotes.trim();
    const currentNotes = (todo.notes || '').trim();
    if (trimmed !== currentNotes && onNotesChange) {
      onNotesChange(todo.id, trimmed);
    }
    if (!trimmed) {
      setNotesExpanded(false);
    }
  }

  function handleNotesToggle() {
    setNotesExpanded(!notesExpanded);
  }

  const hasNotes = !!(todo.notes && todo.notes.trim());

  return (
    <>
      <li className={`todo-item${todo.completed ? ' todo-item--completed' : ''}${isNew ? ' todo-item--enter' : ''}${isSelected ? ' todo-item--selected' : ''}`} onAnimationEnd={onAnimationEnd}>
        <div className="todo-item-header">
          <label className="bulk-select-label">
            <input
              type="checkbox"
              className="bulk-select-checkbox"
              checked={!!isSelected}
              onChange={() => onSelectToggle?.(todo.id)}
              aria-label={`Select ${todo.title}`}
            />
            <span className="bulk-select-custom" aria-hidden="true">
              <svg viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </label>
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
                {dueDateStatus === 'overdue' && 'Overdue'}
                {dueDateStatus === 'today' && 'Due Today'}
                {dueDateStatus === 'soon' && 'Due Soon'}
                {dueDateStatus === 'future' && `Due: ${formatDueDate(todo.due_date)}`}
              </span>
            )}
            {hasNotes && (
              <button
                type="button"
                className={`notes-indicator${notesExpanded ? ' notes-indicator--active' : ''}`}
                onClick={handleNotesToggle}
                aria-label="Toggle notes"
                data-testid="notes-indicator"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </button>
            )}
            <button
              type="button"
              className={`notes-toggle${notesExpanded ? ' notes-toggle--expanded' : ''}`}
              onClick={handleNotesToggle}
              aria-label="Toggle notes"
            >
              <span className="notes-toggle-arrow" aria-hidden="true">▸</span>
              Notes
            </button>
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
        {todo.tags && todo.tags.length > 0 && (
          <div className="todo-tags-display">
            {todo.tags.map((tag) => (
              <span
                key={tag.id}
                className="tag-chip tag-chip--readonly"
                style={{ backgroundColor: tag.color + '22', color: tag.color, borderColor: tag.color + '44' }}
                data-testid="tag-chip"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
        <div className="todo-tag-input-row">
          <TagInput
            allTags={allTags}
            currentTags={todo.tags || []}
            onAddTag={(tag) => onAddTag(todo.id, tag)}
            onCreateAndAddTag={(name) => onCreateAndAddTag(todo.id, name)}
            onRemoveTag={(tagId) => onRemoveTag(todo.id, tagId)}
          />
        </div>
        {notesExpanded && (
          <div className="notes-section">
            <textarea
              ref={notesTextareaRef}
              className="notes-textarea"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              onBlur={handleNotesSave}
              placeholder="Add notes..."
              aria-label="Todo notes"
              rows={3}
            />
          </div>
        )}
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
