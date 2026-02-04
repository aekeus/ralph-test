import { useState, forwardRef } from 'react';
import type { FormEvent } from 'react';

type Priority = 'low' | 'medium' | 'high';

interface AddTodoProps {
  onAdd: (title: string, dueDate?: string, priority?: Priority) => void;
}

const AddTodo = forwardRef<HTMLInputElement, AddTodoProps>(function AddTodo({ onAdd }, ref) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, dueDate || undefined, priority);
    setTitle('');
    setDueDate('');
    setPriority('medium');
  }

  return (
    <form className="add-todo" onSubmit={handleSubmit}>
      <input
        ref={ref}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a new todo..."
      />
      <div className="priority-selector" role="group" aria-label="Priority">
        <button
          type="button"
          className={`priority-btn priority-btn--high${priority === 'high' ? ' priority-btn--active' : ''}`}
          onClick={() => setPriority('high')}
          aria-pressed={priority === 'high'}
        >
          High
        </button>
        <button
          type="button"
          className={`priority-btn priority-btn--medium${priority === 'medium' ? ' priority-btn--active' : ''}`}
          onClick={() => setPriority('medium')}
          aria-pressed={priority === 'medium'}
        >
          Med
        </button>
        <button
          type="button"
          className={`priority-btn priority-btn--low${priority === 'low' ? ' priority-btn--active' : ''}`}
          onClick={() => setPriority('low')}
          aria-pressed={priority === 'low'}
        >
          Low
        </button>
      </div>
      <input
        type="date"
        className="add-todo-date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        aria-label="Due date"
      />
      <button type="submit" className="add-todo-btn">Add</button>
    </form>
  );
});

export default AddTodo;
