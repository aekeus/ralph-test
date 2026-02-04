import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TodoList from './TodoList';
import * as api from '../api';
import type { Todo } from '../types';

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>();
  return {
    ...actual,
    fetchTodos: vi.fn(),
    addTodo: vi.fn(),
    toggleTodo: vi.fn(),
    deleteTodo: vi.fn(),
    updateTodoPriority: vi.fn(),
    reorderTodos: vi.fn(),
    fetchSubtasks: vi.fn(),
    addSubtask: vi.fn(),
    toggleSubtask: vi.fn(),
    deleteSubtask: vi.fn(),
  };
});

const mockTodos: Todo[] = [
  {
    id: 1,
    title: 'First todo',
    completed: false,
    due_date: null,
    priority: 'medium',
    position: 0,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 2,
    title: 'Second todo',
    completed: true,
    due_date: null,
    priority: 'medium',
    position: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

import { afterEach } from 'vitest';

describe('TodoList', () => {
  it('shows loading state initially', () => {
    vi.mocked(api.fetchTodos).mockReturnValue(new Promise(() => {}));
    render(<TodoList />);
    expect(screen.getByText('Loading todos...')).toBeInTheDocument();
  });

  it('renders todos after loading', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });
    expect(screen.getByText('Second todo')).toBeInTheDocument();
  });

  it('shows empty message when no todos', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue([]);
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();
    });
  });

  it('shows error when fetch fails', async () => {
    vi.mocked(api.fetchTodos).mockRejectedValue(new Error('Network error'));
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('Failed to load todos')).toBeInTheDocument();
    });
  });

  it('adds a new todo', async () => {
    vi.useRealTimers();
    const newTodo: Todo = {
      id: 3,
      title: 'New todo',
      completed: false,
      due_date: null,
      priority: 'medium',
      position: null,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
    };
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    vi.mocked(api.addTodo).mockResolvedValue(newTodo);

    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    // After add, fetchTodos is called again - return list with new todo
    vi.mocked(api.fetchTodos).mockResolvedValue([newTodo, ...mockTodos]);

    await userEvent.type(screen.getByPlaceholderText('Add a new todo...'), 'New todo');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText('New todo')).toBeInTheDocument();
    });
    expect(api.addTodo).toHaveBeenCalledWith('New todo', undefined, 'medium');
  });

  it('toggles a todo', async () => {
    vi.useRealTimers();
    const toggled = { ...mockTodos[0], completed: true };
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    vi.mocked(api.toggleTodo).mockResolvedValue(toggled);

    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);

    await waitFor(() => {
      expect(api.toggleTodo).toHaveBeenCalledWith(mockTodos[0]);
    });
  });

  it('shows toast after confirming delete and defers API call', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    vi.mocked(api.deleteTodo).mockResolvedValue();

    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
    await userEvent.click(deleteButtons[0]);

    // Confirmation prompt should appear
    expect(screen.getByText('Delete this todo and its subtasks?')).toBeInTheDocument();

    // Confirm the deletion
    await userEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

    // Todo should be removed from list immediately
    await waitFor(() => {
      expect(screen.queryByText('First todo')).not.toBeInTheDocument();
    });

    // Toast should appear
    expect(screen.getByText('Todo deleted')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /undo delete/i })).toBeInTheDocument();

    // API should NOT have been called yet
    expect(api.deleteTodo).not.toHaveBeenCalled();

    // After 5 seconds, toast dismisses and API is called
    await act(() => vi.advanceTimersByTime(5000));

    // Wait for exit animation (300ms)
    const toast = screen.getByText('Todo deleted').closest('.toast');
    expect(toast).toHaveClass('toast--exit');
  });

  it('restores todo when undo is clicked', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    vi.mocked(api.deleteTodo).mockResolvedValue();

    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    // Delete the first todo
    const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
    await userEvent.click(deleteButtons[0]);
    await userEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

    await waitFor(() => {
      expect(screen.queryByText('First todo')).not.toBeInTheDocument();
    });

    // Click undo
    await userEvent.click(screen.getByRole('button', { name: /undo delete/i }));

    // Todo should be restored
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    // Toast should be gone
    expect(screen.queryByText('Todo deleted')).not.toBeInTheDocument();

    // API should never have been called
    expect(api.deleteTodo).not.toHaveBeenCalled();
  });

  it('calls deleteTodo API after toast auto-dismisses', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    vi.mocked(api.deleteTodo).mockResolvedValue();

    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    // Delete the first todo
    const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
    await userEvent.click(deleteButtons[0]);
    await userEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

    await waitFor(() => {
      expect(screen.queryByText('First todo')).not.toBeInTheDocument();
    });

    // Advance past 5s timeout
    await act(() => vi.advanceTimersByTime(5000));

    // Simulate animation end to trigger dismiss
    const toast = screen.getByText('Todo deleted').closest('.toast');
    if (toast) {
      fireEvent.animationEnd(toast);
    }

    await waitFor(() => {
      expect(api.deleteTodo).toHaveBeenCalledWith(1);
    });
  });

  it('stacks multiple toasts when deleting multiple todos', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    vi.mocked(api.deleteTodo).mockResolvedValue();

    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    // Delete first todo
    const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
    await userEvent.click(deleteButtons[0]);
    await userEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

    await waitFor(() => {
      expect(screen.queryByText('First todo')).not.toBeInTheDocument();
    });

    // Delete second todo
    const remainingDeleteBtns = screen.getAllByRole('button', { name: /^delete$/i });
    await userEvent.click(remainingDeleteBtns[0]);
    await userEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

    await waitFor(() => {
      expect(screen.queryByText('Second todo')).not.toBeInTheDocument();
    });

    // Both toasts should be visible
    const toastMessages = screen.getAllByText('Todo deleted');
    expect(toastMessages).toHaveLength(2);
  });

  it('applies entrance animation class to newly added todo', async () => {
    vi.useRealTimers();
    const newTodo: Todo = {
      id: 3,
      title: 'Animated todo',
      completed: false,
      due_date: null,
      priority: 'medium',
      position: null,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
    };
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    vi.mocked(api.addTodo).mockResolvedValue(newTodo);

    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    // After add, fetchTodos returns list with new todo
    vi.mocked(api.fetchTodos).mockResolvedValue([newTodo, ...mockTodos]);

    await userEvent.type(screen.getByPlaceholderText('Add a new todo...'), 'Animated todo');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText('Animated todo')).toBeInTheDocument();
    });

    const newItem = screen.getByText('Animated todo').closest('.todo-item');
    expect(newItem).toHaveClass('todo-item--enter');
  });

  it('shows error when add fails', async () => {
    vi.useRealTimers();
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    vi.mocked(api.addTodo).mockRejectedValue(new Error('fail'));

    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    await userEvent.type(screen.getByPlaceholderText('Add a new todo...'), 'Fail todo');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to add todo')).toBeInTheDocument();
    });
  });

  it('renders Export JSON button with correct link', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    const exportJsonBtn = screen.getByRole('button', { name: /export json/i });
    expect(exportJsonBtn).toBeInTheDocument();
    const link = exportJsonBtn.closest('a');
    expect(link).toHaveAttribute('href', '/api/export/json');
    expect(link).toHaveAttribute('download');
  });

  it('renders Export CSV button with correct link', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    const exportCsvBtn = screen.getByRole('button', { name: /export csv/i });
    expect(exportCsvBtn).toBeInTheDocument();
    const link = exportCsvBtn.closest('a');
    expect(link).toHaveAttribute('href', '/api/export/csv');
    expect(link).toHaveAttribute('download');
  });

  it('shows export buttons before loading completes', () => {
    vi.mocked(api.fetchTodos).mockReturnValue(new Promise(() => {}));
    render(<TodoList />);
    // Export buttons should not be visible during loading
    expect(screen.queryByRole('button', { name: /export json/i })).not.toBeInTheDocument();
  });

  it('renders header with heading and export buttons in a header element', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('todo-header');

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Todos');
    expect(header.contains(heading)).toBe(true);
  });

  it('renders export buttons with pill styling class and icons', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    const exportJsonBtn = screen.getByRole('button', { name: /export json/i });
    const exportCsvBtn = screen.getByRole('button', { name: /export csv/i });

    expect(exportJsonBtn).toHaveClass('btn-export');
    expect(exportCsvBtn).toHaveClass('btn-export');

    // Each button should contain an icon span
    const jsonIcon = exportJsonBtn.querySelector('.btn-export-icon');
    const csvIcon = exportCsvBtn.querySelector('.btn-export-icon');
    expect(jsonIcon).toBeInTheDocument();
    expect(csvIcon).toBeInTheDocument();
    expect(jsonIcon).toHaveAttribute('aria-hidden', 'true');
    expect(csvIcon).toHaveAttribute('aria-hidden', 'true');
  });

  // ===== Search and Filter Tests =====

  it('renders search bar with magnifying glass icon', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search todos...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('aria-label', 'Search todos');

    const searchBar = searchInput.closest('.search-bar');
    expect(searchBar).toBeInTheDocument();
    const icon = searchBar!.querySelector('.search-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders status filter chips', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    expect(screen.getByText('Status:')).toBeInTheDocument();
    const allBtn = screen.getAllByRole('button', { name: 'All' })[0];
    const activeBtn = screen.getByRole('button', { name: 'Active' });
    const completedBtn = screen.getByRole('button', { name: 'Completed' });

    expect(allBtn).toHaveClass('filter-chip', 'filter-chip--active');
    expect(activeBtn).toHaveClass('filter-chip');
    expect(activeBtn).not.toHaveClass('filter-chip--active');
    expect(completedBtn).toHaveClass('filter-chip');
    expect(completedBtn).not.toHaveClass('filter-chip--active');
  });

  it('renders priority filter chips', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    expect(screen.getByText('Priority:')).toBeInTheDocument();
    const filterBar = screen.getByText('Priority:').closest('.filter-group')!;
    const highBtn = filterBar.querySelector('.filter-chip--high');
    const mediumBtn = filterBar.querySelector('.filter-chip--medium');
    const lowBtn = filterBar.querySelector('.filter-chip--low');

    expect(highBtn).toBeInTheDocument();
    expect(mediumBtn).toBeInTheDocument();
    expect(lowBtn).toBeInTheDocument();
    expect(highBtn).toHaveClass('filter-chip');
    expect(mediumBtn).toHaveClass('filter-chip');
    expect(lowBtn).toHaveClass('filter-chip');
  });

  it('calls fetchTodos with search param after debounce when typing in search', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    vi.mocked(api.fetchTodos).mockClear();
    vi.mocked(api.fetchTodos).mockResolvedValue([mockTodos[0]]);

    const searchInput = screen.getByPlaceholderText('Search todos...');
    await userEvent.type(searchInput, 'First');

    // Should not have called yet (debounce)
    expect(api.fetchTodos).not.toHaveBeenCalledWith({ search: 'First' });

    // Advance past debounce
    await act(() => vi.advanceTimersByTime(300));

    await waitFor(() => {
      expect(api.fetchTodos).toHaveBeenCalledWith({ search: 'First' });
    });
  });

  it('calls fetchTodos with status filter when clicking status chip', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    vi.mocked(api.fetchTodos).mockClear();
    vi.mocked(api.fetchTodos).mockResolvedValue([mockTodos[1]]);

    const completedBtn = screen.getByRole('button', { name: 'Completed' });
    await userEvent.click(completedBtn);

    await act(() => vi.advanceTimersByTime(300));

    await waitFor(() => {
      expect(api.fetchTodos).toHaveBeenCalledWith({ status: 'completed' });
    });

    expect(completedBtn).toHaveClass('filter-chip--active');
  });

  it('calls fetchTodos with priority filter when clicking priority chip', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    vi.mocked(api.fetchTodos).mockClear();
    vi.mocked(api.fetchTodos).mockResolvedValue([]);

    const filterBar = screen.getByText('Priority:').closest('.filter-group')!;
    const highBtn = filterBar.querySelector('.filter-chip--high') as HTMLElement;
    await userEvent.click(highBtn);

    await act(() => vi.advanceTimersByTime(300));

    await waitFor(() => {
      expect(api.fetchTodos).toHaveBeenCalledWith({ priority: 'high' });
    });

    expect(highBtn).toHaveClass('filter-chip--active');
  });

  it('shows "No todos match your filters" when filters return empty', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    vi.mocked(api.fetchTodos).mockResolvedValue([]);
    const filterBar = screen.getByText('Priority:').closest('.filter-group')!;
    const highBtn = filterBar.querySelector('.filter-chip--high') as HTMLElement;
    await userEvent.click(highBtn);

    await act(() => vi.advanceTimersByTime(300));

    await waitFor(() => {
      expect(screen.getByText('No todos match your filters.')).toBeInTheDocument();
    });
  });

  it('combines status and priority filters', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    vi.mocked(api.fetchTodos).mockClear();
    vi.mocked(api.fetchTodos).mockResolvedValue([]);

    const activeBtn = screen.getByRole('button', { name: 'Active' });
    await userEvent.click(activeBtn);
    await act(() => vi.advanceTimersByTime(300));

    vi.mocked(api.fetchTodos).mockClear();
    vi.mocked(api.fetchTodos).mockResolvedValue([]);

    const filterBar = screen.getByText('Priority:').closest('.filter-group')!;
    const highBtn = filterBar.querySelector('.filter-chip--high') as HTMLElement;
    await userEvent.click(highBtn);
    await act(() => vi.advanceTimersByTime(300));

    await waitFor(() => {
      expect(api.fetchTodos).toHaveBeenCalledWith({ status: 'active', priority: 'high' });
    });
  });

  // ===== Keyboard Shortcuts Tests =====

  it('focuses add-todo input when "n" is pressed', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    const addInput = screen.getByPlaceholderText('Add a new todo...');
    expect(addInput).not.toHaveFocus();

    fireEvent.keyDown(document, { key: 'n' });
    expect(addInput).toHaveFocus();
  });

  it('focuses search input when "/" is pressed', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search todos...');
    expect(searchInput).not.toHaveFocus();

    fireEvent.keyDown(document, { key: '/' });
    expect(searchInput).toHaveFocus();
  });

  it('blurs focused input when Escape is pressed', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search todos...');
    searchInput.focus();
    expect(searchInput).toHaveFocus();

    fireEvent.keyDown(searchInput, { key: 'Escape' });
    expect(searchInput).not.toHaveFocus();
  });

  it('does not trigger shortcuts when an input is focused', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search todos...');
    const addInput = screen.getByPlaceholderText('Add a new todo...');

    // Focus search input first
    searchInput.focus();
    expect(searchInput).toHaveFocus();

    // Press 'n' while search is focused - should NOT switch focus to add input
    fireEvent.keyDown(searchInput, { key: 'n' });
    expect(addInput).not.toHaveFocus();
  });

  it('renders keyboard shortcuts button in header', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    const shortcutsBtn = screen.getByRole('button', { name: /keyboard shortcuts/i });
    expect(shortcutsBtn).toBeInTheDocument();
    expect(shortcutsBtn).toHaveClass('btn-shortcuts');
  });

  it('opens shortcuts modal when keyboard button is clicked', async () => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    });

    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    render(<TodoList />);
    await act(() => vi.advanceTimersByTime(300));
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    const shortcutsBtn = screen.getByRole('button', { name: /keyboard shortcuts/i });
    await userEvent.click(shortcutsBtn);

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });
});
