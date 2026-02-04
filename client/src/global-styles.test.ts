import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const indexCss = readFileSync(resolve(__dirname, 'index.css'), 'utf-8');
const indexHtml = readFileSync(resolve(__dirname, '..', 'index.html'), 'utf-8');

describe('Global CSS reset and design tokens', () => {
  describe('CSS Reset', () => {
    it('applies box-sizing: border-box to all elements', () => {
      expect(indexCss).toContain('box-sizing: border-box');
    });

    it('resets margin on common elements', () => {
      expect(indexCss).toMatch(/body,[\s\S]*?margin:\s*0/);
    });

    it('removes list styles', () => {
      expect(indexCss).toContain('list-style: none');
    });

    it('resets font on form elements', () => {
      expect(indexCss).toMatch(/input,\s*button,\s*textarea,\s*select[\s\S]*?font:\s*inherit/);
    });
  });

  describe('CSS Custom Properties', () => {
    it('defines font-family with Inter', () => {
      expect(indexCss).toMatch(/--font-family:.*Inter/);
    });

    it('defines spacing scale variables', () => {
      expect(indexCss).toContain('--space-xs:');
      expect(indexCss).toContain('--space-sm:');
      expect(indexCss).toContain('--space-md:');
      expect(indexCss).toContain('--space-lg:');
      expect(indexCss).toContain('--space-xl:');
    });

    it('defines typography scale variables', () => {
      expect(indexCss).toContain('--font-size-sm:');
      expect(indexCss).toContain('--font-size-base:');
      expect(indexCss).toContain('--font-size-lg:');
      expect(indexCss).toContain('--font-size-xl:');
    });

    it('defines color palette variables', () => {
      expect(indexCss).toContain('--color-primary-500:');
      expect(indexCss).toContain('--color-primary-600:');
      expect(indexCss).toContain('--color-gray-50:');
      expect(indexCss).toContain('--color-gray-900:');
    });

    it('defines semantic color tokens', () => {
      expect(indexCss).toContain('--color-bg:');
      expect(indexCss).toContain('--color-surface:');
      expect(indexCss).toContain('--color-text:');
      expect(indexCss).toContain('--color-border:');
      expect(indexCss).toContain('--color-error:');
    });

    it('defines border-radius variables', () => {
      expect(indexCss).toContain('--radius-sm:');
      expect(indexCss).toContain('--radius-md:');
      expect(indexCss).toContain('--radius-lg:');
    });

    it('defines shadow variables', () => {
      expect(indexCss).toContain('--shadow-sm:');
      expect(indexCss).toContain('--shadow-md:');
    });

    it('defines transition variables', () => {
      expect(indexCss).toContain('--transition-fast:');
      expect(indexCss).toContain('--transition-normal:');
    });
  });

  describe('Dark mode support', () => {
    it('includes data-theme dark selector', () => {
      expect(indexCss).toContain('[data-theme="dark"]');
    });

    it('overrides semantic tokens in dark mode', () => {
      const darkBlock = indexCss.split('[data-theme="dark"]')[1];
      expect(darkBlock).toContain('--color-bg:');
      expect(darkBlock).toContain('--color-text:');
      expect(darkBlock).toContain('--color-surface:');
    });
  });

  describe('Background gradient', () => {
    it('applies a gradient to the body', () => {
      expect(indexCss).toMatch(/body[\s\S]*?linear-gradient/);
    });
  });

  describe('Google Font integration', () => {
    it('includes Inter font link in index.html', () => {
      expect(indexHtml).toContain('fonts.googleapis.com');
      expect(indexHtml).toContain('Inter');
    });

    it('includes preconnect links for performance', () => {
      expect(indexHtml).toContain('rel="preconnect"');
      expect(indexHtml).toContain('fonts.gstatic.com');
    });
  });
});
