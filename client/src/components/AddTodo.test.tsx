import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import AddTodo from './AddTodo';

const appCss = readFileSync(resolve(__dirname, '..', 'App.css'), 'utf-8');

describe('AddTodo', () => {
  it('renders an input and submit button', () => {
    render(<AddTodo onAdd={vi.fn()} />);
    expect(screen.getByPlaceholderText('Add a new todo...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('renders a date input for due date', () => {
    render(<AddTodo onAdd={vi.fn()} />);
    expect(screen.getByLabelText('Due date')).toBeInTheDocument();
  });

  it('renders priority selector buttons', () => {
    render(<AddTodo onAdd={vi.fn()} />);
    expect(screen.getByRole('group', { name: /priority/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /high/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /med/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /low/i })).toBeInTheDocument();
  });

  it('defaults to medium priority', () => {
    render(<AddTodo onAdd={vi.fn()} />);
    const medBtn = screen.getByRole('button', { name: /med/i });
    expect(medBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onAdd with trimmed title on submit', async () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);
    const input = screen.getByPlaceholderText('Add a new todo...');
    await userEvent.type(input, '  New todo  ');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));
    expect(onAdd).toHaveBeenCalledWith('New todo', undefined, 'medium');
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

  it('calls onAdd with title and due date when date is set', async () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);
    await userEvent.type(screen.getByPlaceholderText('Add a new todo...'), 'Todo with date');
    const dateInput = screen.getByLabelText('Due date');
    await userEvent.type(dateInput, '2025-03-15');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(onAdd).toHaveBeenCalledWith('Todo with date', '2025-03-15', 'medium');
  });

  it('clears the date input after submit', async () => {
    render(<AddTodo onAdd={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText('Add a new todo...'), 'Test');
    const dateInput = screen.getByLabelText('Due date');
    await userEvent.type(dateInput, '2025-03-15');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(dateInput).toHaveValue('');
  });

  it('does not call onAdd with whitespace-only input', async () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);
    await userEvent.type(screen.getByPlaceholderText('Add a new todo...'), '   ');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('renders the Add button with the add-todo-btn class', () => {
    render(<AddTodo onAdd={vi.fn()} />);
    const button = screen.getByRole('button', { name: /^add$/i });
    expect(button).toHaveClass('add-todo-btn');
  });

  it('calls onAdd with selected priority', async () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);
    await userEvent.type(screen.getByPlaceholderText('Add a new todo...'), 'High priority task');
    await userEvent.click(screen.getByRole('button', { name: /high/i }));
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));
    expect(onAdd).toHaveBeenCalledWith('High priority task', undefined, 'high');
  });

  it('resets priority to medium after submit', async () => {
    render(<AddTodo onAdd={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText('Add a new todo...'), 'Test');
    await userEvent.click(screen.getByRole('button', { name: /high/i }));
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));
    const medBtn = screen.getByRole('button', { name: /med/i });
    expect(medBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('highlights only the selected priority button', async () => {
    render(<AddTodo onAdd={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /low/i }));
    expect(screen.getByRole('button', { name: /low/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /high/i })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /med/i })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('AddTodo CSS styles', () => {
  it('uses pill-shaped border-radius on the form container', () => {
    expect(appCss).toMatch(/\.add-todo\s*\{[^}]*border-radius:\s*var\(--radius-full\)/);
  });

  it('applies a box-shadow on the form container', () => {
    expect(appCss).toMatch(/\.add-todo\s*\{[^}]*box-shadow:\s*var\(--shadow-md\)/);
  });

  it('has a focus-within state with enhanced shadow', () => {
    expect(appCss).toContain('.add-todo:focus-within');
  });

  it('removes border from the input field', () => {
    expect(appCss).toMatch(/\.add-todo input\s*\{[^}]*border:\s*none/);
  });

  it('animates the placeholder on focus', () => {
    expect(appCss).toContain('.add-todo input:focus::placeholder');
  });

  it('applies placeholder transition for animation', () => {
    expect(appCss).toMatch(/\.add-todo input::placeholder\s*\{[^}]*transition:/);
  });

  it('styles the Add button with pill shape', () => {
    expect(appCss).toMatch(/\.add-todo .add-todo-btn\s*\{[^}]*border-radius:\s*var\(--radius-full\)/);
  });

  it('includes hover state with scale transform on the Add button', () => {
    expect(appCss).toMatch(/\.add-todo .add-todo-btn:hover\s*\{[^}]*transform:\s*scale/);
  });

  it('includes active state with scale-down on the Add button', () => {
    expect(appCss).toMatch(/\.add-todo .add-todo-btn:active\s*\{[^}]*transform:\s*scale\(0\.97\)/);
  });

  it('uses smooth transitions on the form container', () => {
    expect(appCss).toMatch(/\.add-todo\s*\{[^}]*transition:/);
  });

  it('uses smooth transitions on the Add button', () => {
    expect(appCss).toMatch(/\.add-todo .add-todo-btn\s*\{[^}]*transition:/);
  });
});
