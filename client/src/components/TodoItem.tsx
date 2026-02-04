import type { Todo } from '../types';

interface TodoItemProps {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onDelete: (id: number) => void;
}

export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li className="todo-item">
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo)}
        />
        <span className={todo.completed ? 'completed' : ''}>{todo.title}</span>
      </label>
      <button onClick={() => onDelete(todo.id)} aria-label="Delete">
        Delete
      </button>
    </li>
  );
}
