import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TodoItem from './TodoItem';
import type { Todo } from '../types';
import * as api from '../api';

vi.mock('../api');

const baseTodo: Todo = {
  id: 1,
  title: 'Test todo',
  completed: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('TodoItem', () => {
  it('renders the todo title', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Test todo')).toBeInTheDocument();
  });

  it('renders an unchecked checkbox for incomplete todo', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('renders a checked checkbox for completed todo', () => {
    const completed = { ...baseTodo, completed: true };
    render(<TodoItem todo={completed} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('applies completed class when todo is completed', () => {
    const completed = { ...baseTodo, completed: true };
    render(<TodoItem todo={completed} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Test todo')).toHaveClass('completed');
  });

  it('calls onToggle when checkbox is clicked', async () => {
    const onToggle = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={onToggle} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith(baseTodo);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it('toggles subtask list visibility when subtasks button is clicked', async () => {
    vi.mocked(api.fetchSubtasks).mockResolvedValue([]);
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.queryByPlaceholderText('Add a subtask...')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /toggle subtasks/i }));
    expect(screen.getByPlaceholderText('Add a subtask...')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /toggle subtasks/i }));
    expect(screen.queryByPlaceholderText('Add a subtask...')).not.toBeInTheDocument();
  });
});
