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

  return (
    <li className="todo-item">
      <div className="todo-item-header">
        <label>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo)}
          />
          <span className={todo.completed ? 'completed' : ''}>{todo.title}</span>
        </label>
        <div className="todo-item-actions">
          <button onClick={() => setExpanded(!expanded)} aria-label="Toggle subtasks">
            {expanded ? '▾' : '▸'} Subtasks
          </button>
          <button onClick={() => onDelete(todo.id)} aria-label="Delete">
            Delete
          </button>
        </div>
      </div>
      {expanded && <SubtaskList todoId={todo.id} />}
    </li>
  );
}
