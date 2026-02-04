import { useEffect, useState, useRef, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import type { Todo } from '../types';
import { fetchTodos, addTodo, toggleTodo, deleteTodo, updateTodoPriority, updateTodoTitle, reorderTodos, exportJsonUrl, exportCsvUrl } from '../api';
import type { FetchTodosParams } from '../api';
import TodoItem from './TodoItem';
import AddTodo from './AddTodo';
import ThemeToggle from './ThemeToggle';

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const newTodoIds = useRef<Set<number>>(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadTodos = useCallback(async (params?: FetchTodosParams) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTodos(params);
      setTodos(data);
    } catch {
      setError('Failed to load todos');
    } finally {
      setLoading(false);
    }
  }, []);

  const buildParams = useCallback((): FetchTodosParams => {
    const params: FetchTodosParams = {};
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (statusFilter !== 'all') params.status = statusFilter;
    if (priorityFilter !== 'all') params.priority = priorityFilter;
    return params;
  }, [searchQuery, statusFilter, priorityFilter]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      loadTodos(buildParams());
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery, statusFilter, priorityFilter, loadTodos, buildParams]);

  async function handleAdd(title: string, dueDate?: string, priority?: 'low' | 'medium' | 'high') {
    try {
      setError(null);
      const todo = await addTodo(title, dueDate, priority);
      newTodoIds.current.add(todo.id);
      // Reload with current filters to keep list consistent
      await loadTodos(buildParams());
    } catch {
      setError('Failed to add todo');
    }
  }

  async function handlePriorityChange(id: number, priority: 'low' | 'medium' | 'high') {
    try {
      setError(null);
      const updated = await updateTodoPriority(id, priority);
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      setError('Failed to update priority');
    }
  }

  async function handleTitleChange(id: number, title: string) {
    try {
      setError(null);
      const updated = await updateTodoTitle(id, title);
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      setError('Failed to update title');
    }
  }

  async function handleToggle(todo: Todo) {
    try {
      setError(null);
      await toggleTodo(todo);
      // Reload with current filters since status may have changed
      await loadTodos(buildParams());
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

  async function handleDragEnd(result: DropResult) {
    if (!result.destination || result.source.index === result.destination.index) {
      return;
    }

    const reordered = Array.from(todos);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    // Optimistic update
    setTodos(reordered);

    const orders = reordered.map((todo, index) => ({
      id: todo.id,
      position: index,
    }));

    try {
      setError(null);
      await reorderTodos(orders);
    } catch {
      setError('Failed to reorder todos');
      // Revert on failure
      await loadTodos(buildParams());
    }
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value);
  }

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all' || priorityFilter !== 'all';

  if (loading && todos.length === 0 && !hasActiveFilters) return <p>Loading todos...</p>;

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
          <ThemeToggle />
        </div>
      </header>
      {error && <p className="error">{error}</p>}
      <div className="search-bar">
        <span className="search-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search todos..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
          aria-label="Search todos"
        />
      </div>
      <div className="filter-bar">
        <div className="filter-group">
          <span className="filter-label">Status:</span>
          {(['all', 'active', 'completed'] as const).map((status) => (
            <button
              key={status}
              type="button"
              className={`filter-chip ${statusFilter === status ? 'filter-chip--active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <div className="filter-group">
          <span className="filter-label">Priority:</span>
          {(['all', 'high', 'medium', 'low'] as const).map((priority) => (
            <button
              key={priority}
              type="button"
              className={`filter-chip ${priorityFilter === priority ? 'filter-chip--active' : ''} ${priority !== 'all' ? `filter-chip--${priority}` : ''}`}
              onClick={() => setPriorityFilter(priority)}
            >
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <AddTodo onAdd={handleAdd} />
      {todos.length === 0 ? (
        <p>{hasActiveFilters ? 'No todos match your filters.' : 'No todos yet. Add one above!'}</p>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="todo-list">
            {(provided) => (
              <ul ref={provided.innerRef} {...provided.droppableProps}>
                {todos.map((todo, index) => (
                  <Draggable key={todo.id} draggableId={String(todo.id)} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={provided.draggableProps.style}
                        className={snapshot.isDragging ? 'todo-dragging' : ''}
                      >
                        <TodoItem
                          todo={todo}
                          onToggle={handleToggle}
                          onDelete={handleDelete}
                          onPriorityChange={handlePriorityChange}
                          onTitleChange={handleTitleChange}
                          isNew={newTodoIds.current.has(todo.id)}
                          onAnimationEnd={() => newTodoIds.current.delete(todo.id)}
                          dragHandleProps={provided.dragHandleProps}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
