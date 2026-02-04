import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Subtask } from '../types';
import { fetchSubtasks, addSubtask, toggleSubtask, deleteSubtask } from '../api';

interface SubtaskListProps {
  todoId: number;
}

export default function SubtaskList({ todoId }: SubtaskListProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSubtasks(todoId)
      .then((data) => {
        if (!cancelled) {
          setSubtasks(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load subtasks');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [todoId]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    try {
      setError(null);
      const subtask = await addSubtask(todoId, trimmed);
      setSubtasks((prev) => [...prev, subtask]);
      setNewTitle('');
    } catch {
      setError('Failed to add subtask');
    }
  }

  async function handleToggle(subtask: Subtask) {
    try {
      setError(null);
      const updated = await toggleSubtask(todoId, subtask);
      setSubtasks((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch {
      setError('Failed to update subtask');
    }
  }

  async function handleDelete(subtaskId: number) {
    try {
      setError(null);
      await deleteSubtask(todoId, subtaskId);
      setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    } catch {
      setError('Failed to delete subtask');
    }
  }

  return (
    <div className="subtask-list">
      {error && <p className="error">{error}</p>}
      <ul>
        {subtasks.map((subtask) => (
          <li key={subtask.id} className="subtask-item">
            <label>
              <input
                type="checkbox"
                checked={subtask.completed}
                onChange={() => handleToggle(subtask)}
              />
              <span className={subtask.completed ? 'completed' : ''}>{subtask.title}</span>
            </label>
            <button onClick={() => handleDelete(subtask.id)} aria-label="Delete subtask">
              Delete
            </button>
          </li>
        ))}
      </ul>
      <form className="add-subtask" onSubmit={handleAdd}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a subtask..."
        />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
