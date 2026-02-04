import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import TodoItem from './TodoItem';
import type { Todo } from '../types';
import * as api from '../api';

vi.mock('../api');

const appCss = readFileSync(resolve(__dirname, '..', 'App.css'), 'utf-8');

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

  it('shows confirmation when delete button is clicked', async () => {
    const onDelete = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(screen.getByText('Delete this todo and its subtasks?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel delete/i })).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('calls onDelete when confirm delete is clicked', async () => {
    const onDelete = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    await userEvent.click(screen.getByRole('button', { name: /confirm delete/i }));
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it('cancels delete when cancel button is clicked', async () => {
    const onDelete = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancel delete/i }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByText('Delete this todo and its subtasks?')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
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

  it('adds todo-item--completed class when todo is completed', () => {
    const completed = { ...baseTodo, completed: true };
    render(<TodoItem todo={completed} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const li = screen.getByRole('listitem');
    expect(li).toHaveClass('todo-item--completed');
  });

  it('does not add todo-item--completed class when todo is not completed', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const li = screen.getByRole('listitem');
    expect(li).not.toHaveClass('todo-item--completed');
  });

  it('renders a custom checkbox visual element', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const customCheckbox = document.querySelector('.todo-checkbox-custom');
    expect(customCheckbox).toBeInTheDocument();
    expect(customCheckbox).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders the checkbox with todo-checkbox class', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('todo-checkbox');
  });

  it('renders a checkmark SVG inside the custom checkbox', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const svg = document.querySelector('.todo-checkbox-custom svg');
    expect(svg).toBeInTheDocument();
  });
});

describe('TodoItem CSS styles', () => {
  it('styles todo-item as a card with rounded corners', () => {
    expect(appCss).toMatch(/\.todo-item\s*\{[^}]*border-radius:\s*var\(--radius-lg\)/);
  });

  it('applies a subtle shadow to todo-item cards', () => {
    expect(appCss).toMatch(/\.todo-item\s*\{[^}]*box-shadow:\s*var\(--shadow-sm\)/);
  });

  it('applies a background color to todo-item cards', () => {
    expect(appCss).toMatch(/\.todo-item\s*\{[^}]*background-color:\s*var\(--color-surface\)/);
  });

  it('has hover state with elevated shadow', () => {
    expect(appCss).toMatch(/\.todo-item:hover\s*\{[^}]*box-shadow:\s*var\(--shadow-md\)/);
  });

  it('has hover state with upward translation', () => {
    expect(appCss).toMatch(/\.todo-item:hover\s*\{[^}]*transform:\s*translateY\(-1px\)/);
  });

  it('uses smooth transitions on todo-item', () => {
    expect(appCss).toMatch(/\.todo-item\s*\{[^}]*transition:/);
  });

  it('reduces opacity for completed todo items', () => {
    expect(appCss).toMatch(/\.todo-item--completed\s*\{[^}]*opacity:\s*0\.7/);
  });

  it('visually hides the native checkbox', () => {
    expect(appCss).toMatch(/\.todo-checkbox\s*\{[^}]*opacity:\s*0/);
  });

  it('styles custom checkbox as circular', () => {
    expect(appCss).toMatch(/\.todo-checkbox-custom\s*\{[^}]*border-radius:\s*var\(--radius-full\)/);
  });

  it('colors the custom checkbox on checked state', () => {
    expect(appCss).toMatch(/\.todo-checkbox:checked\s*\+\s*\.todo-checkbox-custom\s*\{[^}]*background-color:\s*var\(--color-primary-500\)/);
  });

  it('applies pop animation on checkbox check', () => {
    expect(appCss).toMatch(/\.todo-checkbox:checked\s*\+\s*\.todo-checkbox-custom\s*\{[^}]*animation:\s*checkbox-pop/);
  });

  it('defines the checkbox-pop keyframes animation', () => {
    expect(appCss).toContain('@keyframes checkbox-pop');
  });

  it('applies strikethrough to completed text', () => {
    expect(appCss).toMatch(/\.todo-item .completed\s*\{[^}]*text-decoration:\s*line-through/);
  });

  it('reduces opacity on completed text', () => {
    expect(appCss).toMatch(/\.todo-item .completed\s*\{[^}]*opacity:\s*0\.6/);
  });
});
