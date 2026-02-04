import { useState } from 'react';
import type { Todo } from '../types';
import SubtaskList from './SubtaskList';

interface TodoItemProps {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onDelete: (id: number) => void;
}

export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <li className={`todo-item${todo.completed ? ' todo-item--completed' : ''}`}>
      <div className="todo-item-header">
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
          <span className={todo.completed ? 'completed' : ''}>{todo.title}</span>
        </label>
        <div className="todo-item-actions">
          <button
            className={`subtask-toggle${expanded ? ' subtask-toggle--expanded' : ''}`}
            onClick={() => setExpanded(!expanded)}
            aria-label="Toggle subtasks"
          >
            <span className="subtask-toggle-arrow" aria-hidden="true">▸</span>
            Subtasks
          </button>
          {confirmingDelete ? (
            <span className="confirm-delete">
              <span>Delete this todo and its subtasks?</span>
              <button onClick={() => { onDelete(todo.id); setConfirmingDelete(false); }} aria-label="Confirm delete">
                Yes
              </button>
              <button onClick={() => setConfirmingDelete(false)} aria-label="Cancel delete">
                No
              </button>
            </span>
          ) : (
            <button onClick={() => setConfirmingDelete(true)} aria-label="Delete">
              Delete
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="subtask-section">
          <SubtaskList todoId={todo.id} />
        </div>
      )}
    </li>
  );
}
