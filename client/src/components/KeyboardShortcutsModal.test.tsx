import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';

// jsdom doesn't support HTMLDialogElement methods
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  });
});

describe('KeyboardShortcutsModal', () => {
  it('renders a dialog element', () => {
    render(<KeyboardShortcutsModal open={false} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument();
  });

  it('shows modal when open is true', () => {
    render(<KeyboardShortcutsModal open={true} onClose={vi.fn()} />);
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });

  it('displays all keyboard shortcuts', () => {
    render(<KeyboardShortcutsModal open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('n')).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByText('Escape')).toBeInTheDocument();
    expect(screen.getByText('Focus add todo input')).toBeInTheDocument();
    expect(screen.getByText('Focus search input')).toBeInTheDocument();
    expect(screen.getByText('Blur focused input')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsModal open={true} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('has accessible aria-label on dialog', () => {
    render(<KeyboardShortcutsModal open={true} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'Keyboard shortcuts');
  });
});
