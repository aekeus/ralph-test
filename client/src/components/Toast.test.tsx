import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Toast from './Toast';
import type { ToastItem } from './Toast';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

const mockToast: ToastItem = {
  id: 1,
  todoId: 42,
  message: 'Todo deleted',
};

describe('Toast', () => {
  it('renders toast message and undo button', () => {
    render(<Toast toast={mockToast} onUndo={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText('Todo deleted')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /undo delete/i })).toBeInTheDocument();
  });

  it('has role="alert" for accessibility', () => {
    render(<Toast toast={mockToast} onUndo={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('calls onUndo when undo button is clicked', async () => {
    const onUndo = vi.fn();
    render(<Toast toast={mockToast} onUndo={onUndo} onDismiss={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /undo delete/i }));
    expect(onUndo).toHaveBeenCalledWith(mockToast);
  });

  it('adds exit class after duration', async () => {
    render(<Toast toast={mockToast} onUndo={vi.fn()} onDismiss={vi.fn()} duration={5000} />);
    const toast = screen.getByRole('alert');

    expect(toast).not.toHaveClass('toast--exit');

    await act(() => vi.advanceTimersByTime(5000));

    expect(toast).toHaveClass('toast--exit');
  });

  it('calls onDismiss after exit animation ends', async () => {
    const onDismiss = vi.fn();
    render(<Toast toast={mockToast} onUndo={vi.fn()} onDismiss={onDismiss} duration={5000} />);

    await act(() => vi.advanceTimersByTime(5000));

    const toast = screen.getByRole('alert');
    fireEvent.animationEnd(toast);

    expect(onDismiss).toHaveBeenCalledWith(1);
  });

  it('does not call onDismiss for enter animation end', () => {
    const onDismiss = vi.fn();
    render(<Toast toast={mockToast} onUndo={vi.fn()} onDismiss={onDismiss} />);

    const toast = screen.getByRole('alert');
    fireEvent.animationEnd(toast);

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
