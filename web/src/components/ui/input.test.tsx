/**
 * Unit Tests for Input Component
 * Tests the reusable Input UI component
 * 
 * Test Coverage:
 * - Rendering with different types
 * - Placeholder text
 * - Disabled state
 * - Value handling
 * - Custom className
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './input';

// =====================================================
// INPUT COMPONENT TESTS
// =====================================================

describe('Input Component', () => {
  // =====================================================
  // BASIC RENDERING
  // =====================================================
  describe('basic rendering', () => {
    it('should render input element', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter your email" />);
      
      const input = screen.getByPlaceholderText('Enter your email');
      expect(input).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Input className="custom-input" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-input');
    });
  });

  // =====================================================
  // INPUT TYPES
  // =====================================================
  describe('input types', () => {
    it('should render text input by default', () => {
      render(<Input type="text" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should render email input', () => {
      render(<Input type="email" placeholder="Email" />);
      
      const input = screen.getByPlaceholderText('Email');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render password input', () => {
      render(<Input type="password" data-testid="password-input" />);
      
      const input = screen.getByTestId('password-input');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render number input', () => {
      render(<Input type="number" data-testid="number-input" />);
      
      const input = screen.getByTestId('number-input');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  // =====================================================
  // VALUE HANDLING
  // =====================================================
  describe('value handling', () => {
    it('should accept initial value', () => {
      render(<Input defaultValue="Initial value" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('Initial value');
    });

    it('should call onChange when typing', () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'new value' } });
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('should update value on user input', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'typed text' } });
      
      expect(input).toHaveValue('typed text');
    });
  });

  // =====================================================
  // DISABLED STATE
  // =====================================================
  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should be truly disabled and not interactive', () => {
      render(<Input disabled data-testid="disabled-input" />);
      
      const input = screen.getByTestId('disabled-input');
      
      // Verify disabled attribute is set
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute('disabled');
    });

    it('should apply disabled styles', () => {
      render(<Input disabled />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('disabled:cursor-not-allowed');
      expect(input).toHaveClass('disabled:opacity-50');
    });
  });

  // =====================================================
  // ACCESSIBILITY
  // =====================================================
  describe('accessibility', () => {
    it('should support aria-label', () => {
      render(<Input aria-label="Search input" />);
      
      const input = screen.getByLabelText('Search input');
      expect(input).toBeInTheDocument();
    });

    it('should support aria-describedby', () => {
      render(
        <>
          <Input aria-describedby="helper-text" />
          <span id="helper-text">Enter a valid email</span>
        </>
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'helper-text');
    });

    it('should support required attribute', () => {
      render(<Input required />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });
  });

  // =====================================================
  // FOCUS HANDLING
  // =====================================================
  describe('focus handling', () => {
    it('should call onFocus when focused', () => {
      const handleFocus = vi.fn();
      render(<Input onFocus={handleFocus} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      
      expect(handleFocus).toHaveBeenCalled();
    });

    it('should call onBlur when blurred', () => {
      const handleBlur = vi.fn();
      render(<Input onBlur={handleBlur} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.blur(input);
      
      expect(handleBlur).toHaveBeenCalled();
    });
  });
});
