import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TodoList from './TodoList';
import * as api from '../api';
import type { Todo } from '../types';

vi.mock('../api');

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

  it('deletes a todo', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue(mockTodos);
    vi.mocked(api.deleteTodo).mockResolvedValue();

    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

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
});
