import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import AddTodo from './AddTodo';

describe('AddTodo', () => {
  it('renders an input and submit button', () => {
    render(<AddTodo onAdd={vi.fn()} />);
    expect(screen.getByPlaceholderText('Add a new todo...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('calls onAdd with trimmed title on submit', async () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);
    const input = screen.getByPlaceholderText('Add a new todo...');
    await userEvent.type(input, '  New todo  ');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(onAdd).toHaveBeenCalledWith('New todo');
  });

  it('clears the input after submit', async () => {
    render(<AddTodo onAdd={vi.fn()} />);
    const input = screen.getByPlaceholderText('Add a new todo...');
    await userEvent.type(input, 'New todo');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(input).toHaveValue('');
  });

  it('does not call onAdd with empty input', async () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('does not call onAdd with whitespace-only input', async () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);
    await userEvent.type(screen.getByPlaceholderText('Add a new todo...'), '   ');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(onAdd).not.toHaveBeenCalled();
  });
});
