import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SubtaskList from './SubtaskList';
import * as api from '../api';
import type { Subtask } from '../types';

vi.mock('../api');

const mockSubtasks: Subtask[] = [
  {
    id: 1,
    todo_id: 10,
    title: 'First subtask',
    completed: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    todo_id: 10,
    title: 'Second subtask',
    completed: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

beforeEach(() => {
  vi.resetAllMocks();
});

describe('SubtaskList', () => {
  it('renders subtasks after loading', async () => {
    vi.mocked(api.fetchSubtasks).mockResolvedValue(mockSubtasks);
    render(<SubtaskList todoId={10} />);
    await waitFor(() => {
      expect(screen.getByText('First subtask')).toBeInTheDocument();
    });
    expect(screen.getByText('Second subtask')).toBeInTheDocument();
  });

  it('shows error when fetch fails', async () => {
    vi.mocked(api.fetchSubtasks).mockRejectedValue(new Error('Network error'));
    render(<SubtaskList todoId={10} />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load subtasks')).toBeInTheDocument();
    });
  });

  it('renders empty list when no subtasks', async () => {
    vi.mocked(api.fetchSubtasks).mockResolvedValue([]);
    render(<SubtaskList todoId={10} />);
    await waitFor(() => {
      expect(api.fetchSubtasks).toHaveBeenCalledWith(10);
    });
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('renders checked checkbox for completed subtask', async () => {
    vi.mocked(api.fetchSubtasks).mockResolvedValue(mockSubtasks);
    render(<SubtaskList todoId={10} />);
    await waitFor(() => {
      expect(screen.getByText('First subtask')).toBeInTheDocument();
    });
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).toBeChecked();
  });

  it('applies completed class to completed subtask', async () => {
    vi.mocked(api.fetchSubtasks).mockResolvedValue(mockSubtasks);
    render(<SubtaskList todoId={10} />);
    await waitFor(() => {
      expect(screen.getByText('Second subtask')).toHaveClass('completed');
    });
    expect(screen.getByText('First subtask')).not.toHaveClass('completed');
  });

  it('adds a new subtask', async () => {
    const newSubtask: Subtask = {
      id: 3,
      todo_id: 10,
      title: 'New subtask',
      completed: false,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
    };
    vi.mocked(api.fetchSubtasks).mockResolvedValue(mockSubtasks);
    vi.mocked(api.addSubtask).mockResolvedValue(newSubtask);

    render(<SubtaskList todoId={10} />);
    await waitFor(() => {
      expect(screen.getByText('First subtask')).toBeInTheDocument();
    });

    await userEvent.type(screen.getByPlaceholderText('Add a subtask...'), 'New subtask');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(screen.getByText('New subtask')).toBeInTheDocument();
    });
    expect(api.addSubtask).toHaveBeenCalledWith(10, 'New subtask');
  });

  it('clears input after adding subtask', async () => {
    const newSubtask: Subtask = {
      id: 3,
      todo_id: 10,
      title: 'New subtask',
      completed: false,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
    };
    vi.mocked(api.fetchSubtasks).mockResolvedValue([]);
    vi.mocked(api.addSubtask).mockResolvedValue(newSubtask);

    render(<SubtaskList todoId={10} />);
    await waitFor(() => {
      expect(api.fetchSubtasks).toHaveBeenCalled();
    });

    const input = screen.getByPlaceholderText('Add a subtask...');
    await userEvent.type(input, 'New subtask');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('does not add subtask with empty title', async () => {
    vi.mocked(api.fetchSubtasks).mockResolvedValue([]);
    render(<SubtaskList todoId={10} />);
    await waitFor(() => {
      expect(api.fetchSubtasks).toHaveBeenCalled();
    });

    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));
    expect(api.addSubtask).not.toHaveBeenCalled();
  });

  it('does not add subtask with whitespace-only title', async () => {
    vi.mocked(api.fetchSubtasks).mockResolvedValue([]);
    render(<SubtaskList todoId={10} />);
    await waitFor(() => {
      expect(api.fetchSubtasks).toHaveBeenCalled();
    });

    await userEvent.type(screen.getByPlaceholderText('Add a subtask...'), '   ');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));
    expect(api.addSubtask).not.toHaveBeenCalled();
  });

  it('shows error when add fails', async () => {
    vi.mocked(api.fetchSubtasks).mockResolvedValue([]);
    vi.mocked(api.addSubtask).mockRejectedValue(new Error('fail'));

    render(<SubtaskList todoId={10} />);
    await waitFor(() => {
      expect(api.fetchSubtasks).toHaveBeenCalled();
    });

    await userEvent.type(screen.getByPlaceholderText('Add a subtask...'), 'Fail subtask');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to add subtask')).toBeInTheDocument();
    });
  });

  it('toggles a subtask', async () => {
    const toggled = { ...mockSubtasks[0], completed: true };
    vi.mocked(api.fetchSubtasks).mockResolvedValue(mockSubtasks);
    vi.mocked(api.toggleSubtask).mockResolvedValue(toggled);

    render(<SubtaskList todoId={10} />);
    await waitFor(() => {
      expect(screen.getByText('First subtask')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);

    await waitFor(() => {
      expect(api.toggleSubtask).toHaveBeenCalledWith(10, mockSubtasks[0]);
    });
  });

  it('shows error when toggle fails', async () => {
    vi.mocked(api.fetchSubtasks).mockResolvedValue(mockSubtasks);
    vi.mocked(api.toggleSubtask).mockRejectedValue(new Error('fail'));

    render(<SubtaskList todoId={10} />);
    await waitFor(() => {
      expect(screen.getByText('First subtask')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);

    await waitFor(() => {
      expect(screen.getByText('Failed to update subtask')).toBeInTheDocument();
    });
  });

  it('deletes a subtask', async () => {
    vi.mocked(api.fetchSubtasks).mockResolvedValue(mockSubtasks);
    vi.mocked(api.deleteSubtask).mockResolvedValue();

    render(<SubtaskList todoId={10} />);
    await waitFor(() => {
      expect(screen.getByText('First subtask')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete subtask/i });
    await userEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('First subtask')).not.toBeInTheDocument();
    });
    expect(api.deleteSubtask).toHaveBeenCalledWith(10, 1);
  });

  it('shows error when delete fails', async () => {
    vi.mocked(api.fetchSubtasks).mockResolvedValue(mockSubtasks);
    vi.mocked(api.deleteSubtask).mockRejectedValue(new Error('fail'));

    render(<SubtaskList todoId={10} />);
    await waitFor(() => {
      expect(screen.getByText('First subtask')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete subtask/i });
    await userEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Failed to delete subtask')).toBeInTheDocument();
    });
  });
});
