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

  it('renders delete button as icon-only with trash icon', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const deleteBtn = screen.getByRole('button', { name: /^delete$/i });
    expect(deleteBtn).toHaveClass('delete-btn');
    const icon = deleteBtn.querySelector('.delete-btn-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows modal overlay when delete button is clicked', async () => {
    const onDelete = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(screen.getByText('Delete this todo and its subtasks?')).toBeInTheDocument();
    expect(document.querySelector('.delete-modal-overlay')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /confirm deletion/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel delete/i })).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('calls onDelete when confirm delete is clicked in modal', async () => {
    const onDelete = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    await userEvent.click(screen.getByRole('button', { name: /confirm delete/i }));
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it('closes modal when cancel button is clicked', async () => {
    const onDelete = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancel delete/i }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByText('Delete this todo and its subtasks?')).not.toBeInTheDocument();
    expect(document.querySelector('.delete-modal-overlay')).not.toBeInTheDocument();
  });

  it('closes modal when clicking the overlay backdrop', async () => {
    const onDelete = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    const overlay = document.querySelector('.delete-modal-overlay')!;
    await userEvent.click(overlay);
    expect(onDelete).not.toHaveBeenCalled();
    expect(document.querySelector('.delete-modal-overlay')).not.toBeInTheDocument();
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

  it('applies expanded class to toggle button when subtasks are visible', async () => {
    vi.mocked(api.fetchSubtasks).mockResolvedValue([]);
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);

    const toggleBtn = screen.getByRole('button', { name: /toggle subtasks/i });
    expect(toggleBtn).not.toHaveClass('subtask-toggle--expanded');

    await userEvent.click(toggleBtn);
    expect(toggleBtn).toHaveClass('subtask-toggle--expanded');

    await userEvent.click(toggleBtn);
    expect(toggleBtn).not.toHaveClass('subtask-toggle--expanded');
  });

  it('renders subtask section with accent border wrapper when expanded', async () => {
    vi.mocked(api.fetchSubtasks).mockResolvedValue([]);
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);

    expect(document.querySelector('.subtask-section')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /toggle subtasks/i }));
    expect(document.querySelector('.subtask-section')).toBeInTheDocument();
  });

  it('renders a toggle arrow span inside the subtasks button', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const arrow = document.querySelector('.subtask-toggle-arrow');
    expect(arrow).toBeInTheDocument();
    expect(arrow).toHaveAttribute('aria-hidden', 'true');
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

describe('Subtask section CSS styles', () => {
  it('styles subtask-section with a left border accent line', () => {
    expect(appCss).toMatch(/\.subtask-section\s*\{[^}]*border-left:\s*3px solid var\(--color-primary-300\)/);
  });

  it('indents subtask-section with padding-left', () => {
    expect(appCss).toMatch(/\.subtask-section\s*\{[^}]*padding-left:\s*var\(--space-md\)/);
  });

  it('applies rotation transition on subtask toggle arrow', () => {
    expect(appCss).toMatch(/\.subtask-toggle-arrow\s*\{[^}]*transition:\s*transform var\(--transition-normal\)/);
  });

  it('rotates the arrow 90deg when expanded', () => {
    expect(appCss).toMatch(/\.subtask-toggle--expanded\s+\.subtask-toggle-arrow\s*\{[^}]*transform:\s*rotate\(90deg\)/);
  });

  it('styles subtask items as cards with border and shadow', () => {
    expect(appCss).toMatch(/\.subtask-item\s*\{[^}]*box-shadow:\s*var\(--shadow-sm\)/);
    expect(appCss).toMatch(/\.subtask-item\s*\{[^}]*border:\s*1px solid var\(--color-border\)/);
    expect(appCss).toMatch(/\.subtask-item\s*\{[^}]*border-radius:\s*var\(--radius-md\)/);
  });

  it('uses smaller font size for subtask items', () => {
    expect(appCss).toMatch(/\.subtask-item\s*\{[^}]*font-size:\s*var\(--font-size-sm\)/);
  });

  it('has hover state for subtask items', () => {
    expect(appCss).toMatch(/\.subtask-item:hover\s*\{[^}]*box-shadow:\s*var\(--shadow-md\)/);
  });

  it('reduces opacity for completed subtask items', () => {
    expect(appCss).toMatch(/\.subtask-item--completed\s*\{[^}]*opacity:\s*0\.7/);
  });

  it('styles subtask custom checkbox as circular', () => {
    expect(appCss).toMatch(/\.subtask-checkbox-custom\s*\{[^}]*border-radius:\s*var\(--radius-full\)/);
  });

  it('visually hides the native subtask checkbox', () => {
    expect(appCss).toMatch(/\.subtask-checkbox\s*\{[^}]*opacity:\s*0/);
  });
});

describe('Entrance animation', () => {
  it('applies todo-item--enter class when isNew is true', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} isNew={true} />);
    const li = screen.getByRole('listitem');
    expect(li).toHaveClass('todo-item--enter');
  });

  it('does not apply todo-item--enter class when isNew is false', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} isNew={false} />);
    const li = screen.getByRole('listitem');
    expect(li).not.toHaveClass('todo-item--enter');
  });

  it('does not apply todo-item--enter class when isNew is undefined', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const li = screen.getByRole('listitem');
    expect(li).not.toHaveClass('todo-item--enter');
  });

  it('calls onAnimationEnd when animation completes', () => {
    const onAnimationEnd = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} isNew={true} onAnimationEnd={onAnimationEnd} />);
    const li = screen.getByRole('listitem');
    li.dispatchEvent(new Event('animationend', { bubbles: true }));
    expect(onAnimationEnd).toHaveBeenCalled();
  });
});

describe('Entrance animation CSS styles', () => {
  it('defines todo-enter keyframes with opacity and translateY', () => {
    expect(appCss).toContain('@keyframes todo-enter');
    expect(appCss).toMatch(/todo-enter[^}]*\{[^}]*opacity:\s*0/);
    expect(appCss).toMatch(/todo-enter[^}]*\{[^}]*transform:\s*translateY\(8px\)/);
  });

  it('applies todo-enter animation to todo-item--enter class', () => {
    expect(appCss).toMatch(/\.todo-item--enter\s*\{[^}]*animation:\s*todo-enter/);
  });
});

describe('Responsive design CSS styles', () => {
  it('sets width 100% on #root', () => {
    expect(appCss).toMatch(/#root\s*\{[^}]*width:\s*100%/);
  });

  it('has a mobile breakpoint that reduces padding', () => {
    expect(appCss).toMatch(/@media\s*\(max-width:\s*480px\)\s*\{[^}]*#root\s*\{[^}]*padding:\s*var\(--space-md\)/);
  });

  it('has a mobile breakpoint that stacks the header vertically', () => {
    expect(appCss).toMatch(/@media\s*\(max-width:\s*480px\)[\s\S]*\.todo-header\s*\{[^}]*flex-direction:\s*column/);
  });

  it('has a tablet breakpoint at 768px', () => {
    expect(appCss).toMatch(/@media\s*\(min-width:\s*768px\)/);
  });

  it('has a desktop breakpoint at 1200px', () => {
    expect(appCss).toMatch(/@media\s*\(min-width:\s*1200px\)/);
  });
});

describe('Delete button CSS styles', () => {
  it('styles delete button as circular with transparent background', () => {
    expect(appCss).toMatch(/\.delete-btn\s*\{[^}]*border-radius:\s*var\(--radius-full\)/);
    expect(appCss).toMatch(/\.delete-btn\s*\{[^}]*background-color:\s*transparent/);
  });

  it('applies red hover state to delete button', () => {
    expect(appCss).toMatch(/\.delete-btn:hover\s*\{[^}]*color:\s*var\(--color-danger-500\)/);
  });

  it('styles modal overlay with fixed positioning and blur backdrop', () => {
    expect(appCss).toMatch(/\.delete-modal-overlay\s*\{[^}]*position:\s*fixed/);
    expect(appCss).toMatch(/\.delete-modal-overlay\s*\{[^}]*backdrop-filter:\s*blur\(4px\)/);
  });

  it('styles modal with rounded corners and surface background', () => {
    expect(appCss).toMatch(/\.delete-modal\s*\{[^}]*border-radius:\s*var\(--radius-lg\)/);
    expect(appCss).toMatch(/\.delete-modal\s*\{[^}]*background-color:\s*var\(--color-surface\)/);
  });

  it('styles confirm button with danger color', () => {
    expect(appCss).toMatch(/\.delete-modal-confirm\s*\{[^}]*background-color:\s*var\(--color-danger-500\)/);
  });
});
