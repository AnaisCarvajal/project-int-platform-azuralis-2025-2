/**
 * Unit Tests for CalculateAge Helper
 * Tests age calculation from birth date string
 * 
 * Test Coverage:
 * - Normal age calculation
 * - Birthday edge cases
 * - Invalid inputs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateAge } from './CalculateAge';

// =====================================================
// CALCULATE AGE TESTS
// =====================================================

describe('calculateAge', () => {
  // Mock current date for consistent tests
  beforeEach(() => {
    // Set mock date to December 16, 2025
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-16'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // =====================================================
  // BASIC AGE CALCULATION
  // =====================================================
  describe('basic calculations', () => {
    it('should calculate age correctly for past birthday this year', () => {
      // Person born January 15, 1990 - already had birthday in 2025
      const result = calculateAge('1990-01-15');
      expect(result).toBe(35);
    });

    it('should calculate age correctly for future birthday this year', () => {
      // Person born December 20, 1990 - birthday not yet in 2025
      const result = calculateAge('1990-12-20');
      expect(result).toBe(34);
    });

    it('should return 0 for someone born today', () => {
      const result = calculateAge('2025-12-16');
      expect(result).toBe(0);
    });

    it('should calculate age for newborn (less than a year old)', () => {
      const result = calculateAge('2025-06-15');
      expect(result).toBe(0);
    });
  });

  // =====================================================
  // BIRTHDAY EDGE CASES
  // =====================================================
  describe('birthday edge cases', () => {
    it('should handle birthday on same day (exact birthday)', () => {
      // Today is December 16, person born December 16
      const result = calculateAge('2000-12-16');
      expect(result).toBe(25);
    });

    it('should handle birthday yesterday', () => {
      const result = calculateAge('2000-12-15');
      expect(result).toBe(25);
    });

    it('should handle birthday tomorrow', () => {
      const result = calculateAge('2000-12-17');
      expect(result).toBe(24);
    });

    it('should handle leap year birthday (Feb 29)', () => {
      // Person born Feb 29, 2000 (leap year)
      const result = calculateAge('2000-02-29');
      expect(result).toBe(25);
    });
  });

  // =====================================================
  // INVALID INPUTS
  // =====================================================
  describe('invalid inputs', () => {
    it('should return 0 for empty string', () => {
      const result = calculateAge('');
      expect(result).toBe(0);
    });

    it('should return 0 for null-like value', () => {
      const result = calculateAge(null as unknown as string);
      expect(result).toBe(0);
    });

    it('should return 0 for undefined', () => {
      const result = calculateAge(undefined as unknown as string);
      expect(result).toBe(0);
    });
  });

  // =====================================================
  // DIFFERENT DATE FORMATS
  // =====================================================
  describe('date format handling', () => {
    it('should handle ISO date format', () => {
      const result = calculateAge('1995-06-15');
      expect(result).toBe(30);
    });

    it('should handle date with time component', () => {
      const result = calculateAge('1995-06-15T10:30:00');
      expect(result).toBe(30);
    });
  });
});
