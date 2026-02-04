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
  due_date: null,
  priority: 'medium',
  position: 0,
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

  it('renders a drag handle', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const handle = document.querySelector('.drag-handle');
    expect(handle).toBeInTheDocument();
    expect(handle).toHaveAttribute('aria-label', 'Drag to reorder');
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

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

describe('TodoItem due date badge', () => {
  it('does not render a due date badge when due_date is null', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByTestId('due-date-badge')).not.toBeInTheDocument();
  });

  it('renders overdue badge in red for past due date on incomplete todo', () => {
    const todo = { ...baseTodo, due_date: getYesterday() };
    render(<TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const badge = screen.getByTestId('due-date-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Overdue');
    expect(badge).toHaveClass('due-date-badge--overdue');
  });

  it('renders today badge in amber for todo due today', () => {
    const todo = { ...baseTodo, due_date: getToday() };
    render(<TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const badge = screen.getByTestId('due-date-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('due-date-badge--today');
    expect(badge).toHaveTextContent(/^Due:/);
  });

  it('renders future badge for todo due tomorrow', () => {
    const todo = { ...baseTodo, due_date: getTomorrow() };
    render(<TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const badge = screen.getByTestId('due-date-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('due-date-badge--future');
    expect(badge).toHaveTextContent(/^Due:/);
  });

  it('does not show overdue for completed todo with past due date', () => {
    const todo = { ...baseTodo, completed: true, due_date: getYesterday() };
    render(<TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const badge = screen.getByTestId('due-date-badge');
    expect(badge).not.toHaveClass('due-date-badge--overdue');
  });
});

describe('Due date badge CSS styles', () => {
  it('styles due-date-badge with pill shape', () => {
    expect(appCss).toMatch(/\.due-date-badge\s*\{[^}]*border-radius:\s*var\(--radius-full\)/);
  });

  it('styles overdue badge with red background', () => {
    expect(appCss).toMatch(/\.due-date-badge--overdue\s*\{[^}]*background-color:\s*#fee2e2/);
  });

  it('styles today badge with amber background', () => {
    expect(appCss).toMatch(/\.due-date-badge--today\s*\{[^}]*background-color:\s*#fef3c7/);
  });

  it('styles future badge with neutral background', () => {
    expect(appCss).toMatch(/\.due-date-badge--future\s*\{[^}]*background-color:\s*var\(--color-gray-100\)/);
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

describe('TodoItem priority indicator', () => {
  it('renders a priority indicator with the correct priority label', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const indicator = screen.getByTestId('priority-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveTextContent('Medium');
  });

  it('renders high priority indicator with correct class', () => {
    const highTodo = { ...baseTodo, priority: 'high' as const };
    render(<TodoItem todo={highTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const indicator = screen.getByTestId('priority-indicator');
    expect(indicator).toHaveClass('priority-indicator--high');
    expect(indicator).toHaveTextContent('High');
  });

  it('renders low priority indicator with correct class', () => {
    const lowTodo = { ...baseTodo, priority: 'low' as const };
    render(<TodoItem todo={lowTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const indicator = screen.getByTestId('priority-indicator');
    expect(indicator).toHaveClass('priority-indicator--low');
    expect(indicator).toHaveTextContent('Low');
  });

  it('renders a colored dot inside the priority indicator', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const dot = document.querySelector('.priority-dot');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass('priority-dot--medium');
  });

  it('renders red dot for high priority', () => {
    const highTodo = { ...baseTodo, priority: 'high' as const };
    render(<TodoItem todo={highTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const dot = document.querySelector('.priority-dot');
    expect(dot).toHaveClass('priority-dot--high');
  });

  it('renders green dot for low priority', () => {
    const lowTodo = { ...baseTodo, priority: 'low' as const };
    render(<TodoItem todo={lowTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const dot = document.querySelector('.priority-dot');
    expect(dot).toHaveClass('priority-dot--low');
  });

  it('calls onPriorityChange with next priority when indicator is clicked', async () => {
    const onPriorityChange = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} onPriorityChange={onPriorityChange} />);
    await userEvent.click(screen.getByTestId('priority-indicator'));
    expect(onPriorityChange).toHaveBeenCalledWith(1, 'low');
  });

  it('cycles priority: high -> medium', async () => {
    const onPriorityChange = vi.fn();
    const highTodo = { ...baseTodo, priority: 'high' as const };
    render(<TodoItem todo={highTodo} onToggle={vi.fn()} onDelete={vi.fn()} onPriorityChange={onPriorityChange} />);
    await userEvent.click(screen.getByTestId('priority-indicator'));
    expect(onPriorityChange).toHaveBeenCalledWith(1, 'medium');
  });

  it('cycles priority: low -> high', async () => {
    const onPriorityChange = vi.fn();
    const lowTodo = { ...baseTodo, priority: 'low' as const };
    render(<TodoItem todo={lowTodo} onToggle={vi.fn()} onDelete={vi.fn()} onPriorityChange={onPriorityChange} />);
    await userEvent.click(screen.getByTestId('priority-indicator'));
    expect(onPriorityChange).toHaveBeenCalledWith(1, 'high');
  });

  it('has accessible label on the priority indicator', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const indicator = screen.getByTestId('priority-indicator');
    expect(indicator).toHaveAttribute('aria-label', 'Priority: Medium. Click to change.');
  });
});

describe('Priority indicator CSS styles', () => {
  it('styles priority-indicator with pill shape', () => {
    expect(appCss).toMatch(/\.priority-indicator\s*\{[^}]*border-radius:\s*var\(--radius-full\)/);
  });

  it('styles high priority indicator with red background', () => {
    expect(appCss).toMatch(/\.priority-indicator--high\s*\{[^}]*background-color:\s*#fee2e2/);
  });

  it('styles medium priority indicator with amber background', () => {
    expect(appCss).toMatch(/\.priority-indicator--medium\s*\{[^}]*background-color:\s*#fef3c7/);
  });

  it('styles low priority indicator with green background', () => {
    expect(appCss).toMatch(/\.priority-indicator--low\s*\{[^}]*background-color:\s*#f0fdf4/);
  });

  it('styles high priority dot with red color', () => {
    expect(appCss).toMatch(/\.priority-dot--high\s*\{[^}]*background-color:\s*#ef4444/);
  });

  it('styles medium priority dot with amber color', () => {
    expect(appCss).toMatch(/\.priority-dot--medium\s*\{[^}]*background-color:\s*#f59e0b/);
  });

  it('styles low priority dot with green color', () => {
    expect(appCss).toMatch(/\.priority-dot--low\s*\{[^}]*background-color:\s*#22c55e/);
  });
});

describe('Drag handle CSS styles', () => {
  it('styles drag-handle with grab cursor', () => {
    expect(appCss).toMatch(/\.drag-handle\s*\{[^}]*cursor:\s*grab/);
  });

  it('styles drag-handle with flex display', () => {
    expect(appCss).toMatch(/\.drag-handle\s*\{[^}]*display:\s*flex/);
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

describe('TodoItem inline editing', () => {
  it('enters edit mode when title is clicked', async () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} onTitleChange={vi.fn()} />);
    await userEvent.click(screen.getByText('Test todo'));
    expect(screen.getByLabelText('Edit todo title')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit todo title')).toHaveValue('Test todo');
  });

  it('pre-fills input with current title', async () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} onTitleChange={vi.fn()} />);
    await userEvent.click(screen.getByText('Test todo'));
    const input = screen.getByLabelText('Edit todo title');
    expect(input).toHaveValue('Test todo');
  });

  it('focuses the input when entering edit mode', async () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} onTitleChange={vi.fn()} />);
    await userEvent.click(screen.getByText('Test todo'));
    const input = screen.getByLabelText('Edit todo title');
    expect(input).toHaveFocus();
  });

  it('calls onTitleChange and exits edit mode on Enter', async () => {
    const onTitleChange = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} onTitleChange={onTitleChange} />);
    await userEvent.click(screen.getByText('Test todo'));
    const input = screen.getByLabelText('Edit todo title');
    await userEvent.clear(input);
    await userEvent.type(input, 'Updated title{Enter}');
    expect(onTitleChange).toHaveBeenCalledWith(1, 'Updated title');
    expect(screen.queryByLabelText('Edit todo title')).not.toBeInTheDocument();
  });

  it('calls onTitleChange and exits edit mode on blur', async () => {
    const onTitleChange = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} onTitleChange={onTitleChange} />);
    await userEvent.click(screen.getByText('Test todo'));
    const input = screen.getByLabelText('Edit todo title');
    await userEvent.clear(input);
    await userEvent.type(input, 'Updated title');
    await userEvent.tab();
    expect(onTitleChange).toHaveBeenCalledWith(1, 'Updated title');
    expect(screen.queryByLabelText('Edit todo title')).not.toBeInTheDocument();
  });

  it('cancels edit and restores original title on Escape', async () => {
    const onTitleChange = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} onTitleChange={onTitleChange} />);
    await userEvent.click(screen.getByText('Test todo'));
    const input = screen.getByLabelText('Edit todo title');
    await userEvent.clear(input);
    await userEvent.type(input, 'Changed text{Escape}');
    expect(onTitleChange).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Edit todo title')).not.toBeInTheDocument();
    expect(screen.getByText('Test todo')).toBeInTheDocument();
  });

  it('does not call onTitleChange when title is unchanged', async () => {
    const onTitleChange = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} onTitleChange={onTitleChange} />);
    await userEvent.click(screen.getByText('Test todo'));
    const input = screen.getByLabelText('Edit todo title');
    await userEvent.type(input, '{Enter}');
    expect(onTitleChange).not.toHaveBeenCalled();
  });

  it('does not call onTitleChange when title is only whitespace', async () => {
    const onTitleChange = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} onTitleChange={onTitleChange} />);
    await userEvent.click(screen.getByText('Test todo'));
    const input = screen.getByLabelText('Edit todo title');
    await userEvent.clear(input);
    await userEvent.type(input, '   {Enter}');
    expect(onTitleChange).not.toHaveBeenCalled();
  });

  it('applies todo-title-edit class to the edit input', async () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} onTitleChange={vi.fn()} />);
    await userEvent.click(screen.getByText('Test todo'));
    const input = screen.getByLabelText('Edit todo title');
    expect(input).toHaveClass('todo-title-edit');
  });
});

describe('Inline editing CSS styles', () => {
  it('styles todo-title with cursor text', () => {
    expect(appCss).toMatch(/\.todo-title\s*\{[^}]*cursor:\s*text/);
  });

  it('styles todo-title-edit with border and rounded corners', () => {
    expect(appCss).toMatch(/\.todo-title-edit\s*\{[^}]*border:\s*1px solid var\(--color-primary-300\)/);
    expect(appCss).toMatch(/\.todo-title-edit\s*\{[^}]*border-radius:\s*var\(--radius-md\)/);
  });

  it('styles todo-title-edit with subtle background', () => {
    expect(appCss).toMatch(/\.todo-title-edit\s*\{[^}]*background-color:\s*var\(--color-gray-50\)/);
  });

  it('styles todo-title-edit focus with box-shadow', () => {
    expect(appCss).toMatch(/\.todo-title-edit:focus\s*\{[^}]*box-shadow:/);
  });
});
