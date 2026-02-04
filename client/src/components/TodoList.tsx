import { useEffect, useState, useRef } from 'react';
import type { Todo } from '../types';
import { fetchTodos, addTodo, toggleTodo, deleteTodo, exportJsonUrl, exportCsvUrl } from '../api';
import TodoItem from './TodoItem';
import AddTodo from './AddTodo';

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const newTodoIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    loadTodos();
  }, []);

  async function loadTodos() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTodos();
      setTodos(data);
    } catch {
      setError('Failed to load todos');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(title: string) {
    try {
      setError(null);
      const todo = await addTodo(title);
      newTodoIds.current.add(todo.id);
      setTodos((prev) => [todo, ...prev]);
    } catch {
      setError('Failed to add todo');
    }
  }

  async function handleToggle(todo: Todo) {
    try {
      setError(null);
      const updated = await toggleTodo(todo);
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      setError('Failed to update todo');
    }
  }

  async function handleDelete(id: number) {
    try {
      setError(null);
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError('Failed to delete todo');
    }
  }

  if (loading) return <p>Loading todos...</p>;

  return (
    <div className="todo-list">
      <header className="todo-header">
        <h1>Todos</h1>
        <div className="export-buttons">
          <a href={exportJsonUrl()} download>
            <button type="button" className="btn-export">
              <span className="btn-export-icon" aria-hidden="true">{'{ }'}</span>
              Export JSON
            </button>
          </a>
          <a href={exportCsvUrl()} download>
            <button type="button" className="btn-export">
              <span className="btn-export-icon" aria-hidden="true">&#9776;</span>
              Export CSV
            </button>
          </a>
        </div>
      </header>
      {error && <p className="error">{error}</p>}
      <AddTodo onAdd={handleAdd} />
      {todos.length === 0 ? (
        <p>No todos yet. Add one above!</p>
      ) : (
        <ul>
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={handleToggle}
              onDelete={handleDelete}
              isNew={newTodoIds.current.has(todo.id)}
              onAnimationEnd={() => newTodoIds.current.delete(todo.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
