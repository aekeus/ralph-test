import { useEffect, useState, useRef, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import type { Todo, Tag, TodoStats } from '../types';
import { fetchTodos, addTodo, toggleTodo, deleteTodo, updateTodoPriority, updateTodoTitle, updateTodoNotes, reorderTodos, exportJsonUrl, exportCsvUrl, fetchTags, createTag, addTagToTodo, removeTagFromTodo, fetchTodoStats } from '../api';
import type { FetchTodosParams } from '../api';
import TodoItem from './TodoItem';
import AddTodo from './AddTodo';
import StatsBar from './StatsBar';
import ThemeToggle from './ThemeToggle';
import Toast from './Toast';
import type { ToastItem } from './Toast';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const newTodoIds = useRef<Set<number>>(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'due_date' | 'priority'>('newest');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toasts, setToasts] = useState<(ToastItem & { todo: Todo })[]>([]);
  const toastIdCounter = useRef(0);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [stats, setStats] = useState<TodoStats>({ total: 0, completed: 0, active: 0, overdue: 0, byPriority: { high: 0, medium: 0, low: 0 } });
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const addTodoInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedTodoIds, setSelectedTodoIds] = useState<Set<number>>(new Set());
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);

  const loadTodos = useCallback(async (params?: FetchTodosParams) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTodos(params);
      setTodos(data);
      // Refresh stats whenever todos are loaded
      try {
        const statsData = await fetchTodoStats();
        setStats(statsData);
      } catch {
        // silently fail
      }
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
    if (sortOrder !== 'newest') params.sort = sortOrder;
    if (selectedTags.length > 0) params.tag = selectedTags;
    return params;
  }, [searchQuery, statusFilter, priorityFilter, sortOrder, selectedTags]);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchTodoStats();
      setStats(data);
    } catch {
      // silently fail - stats are supplementary
    }
  }, []);

  const loadAllTags = useCallback(async () => {
    try {
      const tags = await fetchTags();
      setAllTags(tags);
    } catch {
      // silently fail - tags are supplementary
    }
  }, []);

  useEffect(() => {
    loadTodos();
    loadAllTags();
    loadStats();
  }, [loadTodos, loadAllTags, loadStats]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      loadTodos(buildParams());
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery, statusFilter, priorityFilter, sortOrder, selectedTags, loadTodos, buildParams]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 'Escape') {
        if (isInputFocused && target instanceof HTMLElement) {
          target.blur();
        }
        return;
      }

      if (isInputFocused) return;

      if (e.key === 'n') {
        e.preventDefault();
        addTodoInputRef.current?.focus();
      } else if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  async function handleNotesChange(id: number, notes: string) {
    try {
      setError(null);
      const updated = await updateTodoNotes(id, notes);
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      setError('Failed to update notes');
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

  function handleDelete(id: number) {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    setError(null);
    // Remove from UI immediately
    setTodos((prev) => prev.filter((t) => t.id !== id));
    // Show toast with undo option
    const toastId = ++toastIdCounter.current;
    setToasts((prev) => [...prev, { id: toastId, todoId: id, message: 'Todo deleted', todo }]);
  }

  function handleToastUndo(toast: ToastItem & { todo: Todo }) {
    // Restore the todo to the list
    setTodos((prev) => {
      const restored = [...prev, toast.todo];
      restored.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      return restored;
    });
    // Remove the toast
    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
  }

  async function handleToastDismiss(toastId: number) {
    const toast = toasts.find((t) => t.id === toastId);
    if (!toast) return;
    // Remove toast from state
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
    // Actually delete from the server
    try {
      await deleteTodo(toast.todoId);
      loadStats();
    } catch {
      // Restore the todo if the delete fails
      setTodos((prev) => {
        const restored = [...prev, toast.todo];
        restored.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        return restored;
      });
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

  async function handleAddTag(todoId: number, tag: Tag) {
    try {
      setError(null);
      const updatedTags = await addTagToTodo(todoId, tag.id);
      setTodos((prev) => prev.map((t) => (t.id === todoId ? { ...t, tags: updatedTags } : t)));
    } catch {
      setError('Failed to add tag');
    }
  }

  async function handleCreateAndAddTag(todoId: number, name: string) {
    try {
      setError(null);
      const newTag = await createTag(name);
      setAllTags((prev) => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));
      const updatedTags = await addTagToTodo(todoId, newTag.id);
      setTodos((prev) => prev.map((t) => (t.id === todoId ? { ...t, tags: updatedTags } : t)));
    } catch {
      setError('Failed to create tag');
    }
  }

  async function handleRemoveTag(todoId: number, tagId: number) {
    try {
      setError(null);
      await removeTagFromTodo(todoId, tagId);
      setTodos((prev) => prev.map((t) => (t.id === todoId ? { ...t, tags: (t.tags || []).filter((tag) => tag.id !== tagId) } : t)));
    } catch {
      setError('Failed to remove tag');
    }
  }

  function handleSelectToggle(id: number) {
    setSelectedTodoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSelectAll() {
    if (selectedTodoIds.size === todos.length) {
      setSelectedTodoIds(new Set());
    } else {
      setSelectedTodoIds(new Set(todos.map((t) => t.id)));
    }
  }

  function handleClearSelection() {
    setSelectedTodoIds(new Set());
  }

  function handleBulkDelete() {
    const idsToDelete = Array.from(selectedTodoIds);
    for (const id of idsToDelete) {
      handleDelete(id);
    }
    setSelectedTodoIds(new Set());
  }

  async function handleBulkPriorityChange(priority: 'low' | 'medium' | 'high') {
    setPriorityDropdownOpen(false);
    const idsToUpdate = Array.from(selectedTodoIds);
    for (const id of idsToUpdate) {
      await handlePriorityChange(id, priority);
    }
  }

  function toggleTagFilter(tagName: string) {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value);
  }

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all' || priorityFilter !== 'all' || sortOrder !== 'newest' || selectedTags.length > 0;

  if (loading && todos.length === 0 && !hasActiveFilters) return <p>Loading todos...</p>;

  return (
    <div className="todo-list">
      <header className="todo-header">
        <div className="todo-header-left">
          {todos.length > 0 && (
            <label className="select-all-label">
              <input
                type="checkbox"
                className="select-all-checkbox"
                checked={todos.length > 0 && selectedTodoIds.size === todos.length}
                onChange={handleSelectAll}
                aria-label="Select all"
              />
              <span className="select-all-custom" aria-hidden="true">
                <svg viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </label>
          )}
          <h1>Todos</h1>
        </div>
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
          <button
            type="button"
            className="btn-shortcuts"
            onClick={() => setShortcutsOpen(true)}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
            </svg>
          </button>
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
          ref={searchInputRef}
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
          {(['all', 'active', 'completed', 'overdue'] as const).map((status) => (
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
        <div className="filter-group">
          <span className="filter-label">Sort:</span>
          {([
            { value: 'newest', label: 'Newest' },
            { value: 'due_date', label: 'Due Date' },
            { value: 'priority', label: 'Priority' },
          ] as const).map((option) => (
            <button
              key={option.value}
              type="button"
              className={`filter-chip ${sortOrder === option.value ? 'filter-chip--active' : ''}`}
              onClick={() => setSortOrder(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {allTags.length > 0 && (
        <div className="tag-filter-bar" role="group" aria-label="Filter by tags">
          <span className="filter-label">Tags:</span>
          <div className="tag-filter-chips">
            {allTags.map((tag) => {
              const isActive = selectedTags.includes(tag.name);
              return (
                <button
                  key={tag.id}
                  type="button"
                  className={`tag-filter-chip ${isActive ? 'tag-filter-chip--active' : ''}`}
                  style={isActive ? { backgroundColor: tag.color + '22', borderColor: tag.color, color: tag.color } : undefined}
                  onClick={() => toggleTagFilter(tag.name)}
                  aria-pressed={isActive}
                >
                  <span className="tag-filter-dot" style={{ backgroundColor: tag.color }} />
                  {tag.name}
                  {isActive && (
                    <span
                      className="tag-filter-clear"
                      role="button"
                      aria-label={`Clear ${tag.name} filter`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTagFilter(tag.name);
                      }}
                    >
                      &times;
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <StatsBar stats={stats} />
      <AddTodo ref={addTodoInputRef} onAdd={handleAdd} />
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
                          onNotesChange={handleNotesChange}
                          allTags={allTags}
                          onAddTag={handleAddTag}
                          onCreateAndAddTag={handleCreateAndAddTag}
                          onRemoveTag={handleRemoveTag}
                          isNew={newTodoIds.current.has(todo.id)}
                          onAnimationEnd={() => newTodoIds.current.delete(todo.id)}
                          dragHandleProps={provided.dragHandleProps}
                          isSelected={selectedTodoIds.has(todo.id)}
                          onSelectToggle={handleSelectToggle}
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
      {selectedTodoIds.size > 0 && (
        <div className="bulk-action-bar" role="toolbar" aria-label="Bulk actions">
          <span className="bulk-action-count">{selectedTodoIds.size} selected</span>
          <button
            type="button"
            className="bulk-action-btn bulk-action-btn--delete"
            onClick={handleBulkDelete}
          >
            Delete Selected ({selectedTodoIds.size})
          </button>
          <div className="bulk-action-priority-wrapper">
            <button
              type="button"
              className="bulk-action-btn bulk-action-btn--priority"
              onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
              aria-haspopup="true"
              aria-expanded={priorityDropdownOpen}
            >
              Set Priority
            </button>
            {priorityDropdownOpen && (
              <div className="bulk-priority-dropdown" role="menu">
                <button type="button" role="menuitem" className="bulk-priority-option bulk-priority-option--high" onClick={() => handleBulkPriorityChange('high')}>High</button>
                <button type="button" role="menuitem" className="bulk-priority-option bulk-priority-option--medium" onClick={() => handleBulkPriorityChange('medium')}>Medium</button>
                <button type="button" role="menuitem" className="bulk-priority-option bulk-priority-option--low" onClick={() => handleBulkPriorityChange('low')}>Low</button>
              </div>
            )}
          </div>
          <button
            type="button"
            className="bulk-action-btn bulk-action-btn--clear"
            onClick={handleClearSelection}
          >
            Clear Selection
          </button>
        </div>
      )}
      {toasts.length > 0 && (
        <div className="toast-container" aria-live="polite">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              toast={toast}
              onUndo={() => handleToastUndo(toast)}
              onDismiss={handleToastDismiss}
            />
          ))}
        </div>
      )}
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
