/**
 * Unit Tests for Utils Library
 * Tests the cn() utility function for merging Tailwind classes
 * 
 * Test Coverage:
 * - Basic class merging
 * - Conditional classes
 * - Conflicting Tailwind classes
 */

import { describe, it, expect } from 'vitest';
import { cn } from './utils';

// =====================================================
// CN FUNCTION TESTS
// =====================================================

describe('cn (classNames utility)', () => {
  // =====================================================
  // BASIC MERGING
  // =====================================================
  describe('basic class merging', () => {
    it('should merge multiple class strings', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle single class', () => {
      const result = cn('single-class');
      expect(result).toBe('single-class');
    });

    it('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should filter out falsy values', () => {
      const result = cn('valid', null, undefined, false, 'another');
      expect(result).toBe('valid another');
    });
  });

  // =====================================================
  // CONDITIONAL CLASSES
  // =====================================================
  describe('conditional classes', () => {
    it('should include class when condition is true', () => {
      const isActive = true;
      const result = cn('base', isActive && 'active');
      expect(result).toBe('base active');
    });

    it('should exclude class when condition is false', () => {
      const isActive = false;
      const result = cn('base', isActive && 'active');
      expect(result).toBe('base');
    });

    it('should handle object syntax for conditions', () => {
      const result = cn({
        'always-present': true,
        'conditionally-present': true,
        'not-present': false,
      });
      expect(result).toContain('always-present');
      expect(result).toContain('conditionally-present');
      expect(result).not.toContain('not-present');
    });
  });

  // =====================================================
  // TAILWIND CLASS MERGING
  // =====================================================
  describe('Tailwind class conflict resolution', () => {
    it('should resolve conflicting padding classes (last wins)', () => {
      const result = cn('p-4', 'p-8');
      expect(result).toBe('p-8');
    });

    it('should resolve conflicting text color classes', () => {
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toBe('text-blue-500');
    });

    it('should resolve conflicting background classes', () => {
      const result = cn('bg-white', 'bg-gray-100');
      expect(result).toBe('bg-gray-100');
    });

    it('should not merge non-conflicting classes', () => {
      const result = cn('p-4', 'm-4', 'text-red-500');
      expect(result).toContain('p-4');
      expect(result).toContain('m-4');
      expect(result).toContain('text-red-500');
    });

    it('should handle responsive variants correctly', () => {
      const result = cn('p-4', 'md:p-8');
      // Both should be present as they apply to different breakpoints
      expect(result).toContain('p-4');
      expect(result).toContain('md:p-8');
    });
  });

  // =====================================================
  // REAL-WORLD USAGE PATTERNS
  // =====================================================
  describe('real-world usage patterns', () => {
    it('should handle component variant pattern', () => {
      const variant = 'primary';
      const size = 'large';
      
      const result = cn(
        'btn-base',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-500 text-black',
        size === 'large' && 'px-6 py-3',
        size === 'small' && 'px-2 py-1',
      );

      expect(result).toContain('btn-base');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('px-6');
    });

    it('should handle disabled state override', () => {
      const isDisabled = true;
      
      const result = cn(
        'bg-blue-500 hover:bg-blue-600',
        isDisabled && 'bg-gray-300 cursor-not-allowed',
      );

      // Gray background should override blue due to twMerge
      expect(result).toContain('bg-gray-300');
      expect(result).toContain('cursor-not-allowed');
    });
  });
});
