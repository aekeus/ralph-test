import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import ThemeToggle from './ThemeToggle';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('ThemeToggle', () => {
  it('renders a toggle button', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn-theme-toggle');
  });

  it('defaults to light mode', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
  });

  it('switches to dark mode on click', async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /switch to dark mode/i });
    await userEvent.click(button);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });

  it('switches back to light mode on second click', async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /switch to dark mode/i });
    await userEvent.click(button);
    await userEvent.click(screen.getByRole('button', { name: /switch to light mode/i }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
  });

  it('persists theme preference in localStorage', async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /switch to dark mode/i });
    await userEvent.click(button);

    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('restores dark theme from localStorage', () => {
    localStorage.setItem('theme', 'dark');
    render(<ThemeToggle />);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });

  it('restores light theme from localStorage', () => {
    localStorage.setItem('theme', 'light');
    render(<ThemeToggle />);

    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
  });

  it('defaults to light when localStorage has invalid value', () => {
    localStorage.setItem('theme', 'invalid');
    render(<ThemeToggle />);

    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
  });

  it('has accessible title attribute', async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(button).toHaveAttribute('title', 'Switch to dark mode');

    await userEvent.click(button);
    const darkButton = screen.getByRole('button', { name: /switch to light mode/i });
    expect(darkButton).toHaveAttribute('title', 'Switch to light mode');
  });

  it('contains an icon with aria-hidden', () => {
    render(<ThemeToggle />);
    const icon = document.querySelector('.theme-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});
