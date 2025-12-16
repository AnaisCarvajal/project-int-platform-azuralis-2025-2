/**
 * Unit Tests for Button Component
 * Tests the reusable Button UI component
 * 
 * Test Coverage:
 * - Rendering with different variants
 * - Size variants
 * - Disabled state
 * - Click handling
 * - Accessibility attributes
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

// =====================================================
// BUTTON COMPONENT TESTS
// =====================================================

describe('Button Component', () => {
  // =====================================================
  // BASIC RENDERING
  // =====================================================
  describe('basic rendering', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it('should render with default variant classes', () => {
      render(<Button>Default Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
    });

    it('should apply custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  // =====================================================
  // VARIANT TESTS
  // =====================================================
  describe('variants', () => {
    it('should render destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
    });

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('bg-background');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary');
    });

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('should render link variant', () => {
      render(<Button variant="link">Link</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('underline-offset-4');
    });
  });

  // =====================================================
  // SIZE TESTS
  // =====================================================
  describe('sizes', () => {
    it('should render default size', () => {
      render(<Button size="default">Default Size</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('px-4');
    });

    it('should render small size', () => {
      render(<Button size="sm">Small</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8');
      expect(button).toHaveClass('px-3');
    });

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('px-8');
    });

    it('should render icon size', () => {
      render(<Button size="icon">Icon</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('w-9');
    });
  });

  // =====================================================
  // INTERACTION TESTS
  // =====================================================
  describe('interactions', () => {
    it('should call onClick handler when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // =====================================================
  // DISABLED STATE TESTS
  // =====================================================
  describe('disabled state', () => {
    it('should have disabled attribute when disabled', () => {
      render(<Button disabled>Disabled Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should apply disabled styles', () => {
      render(<Button disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toHaveClass('disabled:pointer-events-none');
    });
  });

  // =====================================================
  // ACCESSIBILITY TESTS
  // =====================================================
  describe('accessibility', () => {
    it('should support aria-label', () => {
      render(<Button aria-label="Close dialog">X</Button>);
      
      const button = screen.getByRole('button', { name: /close dialog/i });
      expect(button).toBeInTheDocument();
    });

    it('should support type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });
});
