import { render, screen, waitFor } from '@testing-library/react';
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
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 2,
    title: 'Second todo',
    completed: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

beforeEach(() => {
  vi.resetAllMocks();
});

describe('TodoList', () => {
  it('shows loading state initially', () => {
    vi.mocked(api.fetchTodos).mockReturnValue(new Promise(() => {}));
    render(<TodoList />);
    expect(screen.getByText('Loading todos...')).toBeInTheDocument();
  });

  it('renders todos after loading', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });
    expect(screen.getByText('Second todo')).toBeInTheDocument();
  });

  it('shows empty message when no todos', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue([]);
    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();
    });
  });

  it('shows error when fetch fails', async () => {
    vi.mocked(api.fetchTodos).mockRejectedValue(new Error('Network error'));
    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load todos')).toBeInTheDocument();
    });
  });

  it('adds a new todo', async () => {
    const newTodo: Todo = {
      id: 3,
      title: 'New todo',
      completed: false,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
    };
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    vi.mocked(api.addTodo).mockResolvedValue(newTodo);

    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    await userEvent.type(screen.getByPlaceholderText('Add a new todo...'), 'New todo');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText('New todo')).toBeInTheDocument();
    });
    expect(api.addTodo).toHaveBeenCalledWith('New todo');
  });

  it('toggles a todo', async () => {
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

  it('deletes a todo after confirmation', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    vi.mocked(api.deleteTodo).mockResolvedValue();

    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
    await userEvent.click(deleteButtons[0]);

    // Confirmation prompt should appear
    expect(screen.getByText('Delete this todo and its subtasks?')).toBeInTheDocument();

    // Confirm the deletion
    await userEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

    await waitFor(() => {
      expect(screen.queryByText('First todo')).not.toBeInTheDocument();
    });
    expect(api.deleteTodo).toHaveBeenCalledWith(1);
  });

  it('shows error when add fails', async () => {
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
});
