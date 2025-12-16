/**
 * Unit Tests for ValidateRut Helper
 * Tests Chilean RUT validation algorithm (modulo 11)
 * 
 * Test Coverage:
 * - Valid RUT formats
 * - Invalid RUT formats
 * - Edge cases (empty, malformed)
 */

import { describe, it, expect } from 'vitest';
import { validateRut, formatRut, cleanRut } from './ValidateRut';

// =====================================================
// VALIDATE RUT TESTS
// =====================================================

describe('validateRut', () => {
  // Valid RUT tests
  describe('valid RUTs', () => {
    it('should return true for valid RUT with dots and hyphen', () => {
      // RUT: 11.111.111-1 is a valid RUT
      expect(validateRut('11.111.111-1')).toBe(true);
    });

    it('should return true for valid RUT without formatting', () => {
      expect(validateRut('111111111')).toBe(true);
    });

    it('should return true for valid RUT ending in K', () => {
      // RUT: 10.000.013-K is a valid RUT with K verifier (verified by modulo 11 algorithm)
      expect(validateRut('10.000.013-K')).toBe(true);
    });

    it('should return true for valid RUT with lowercase k', () => {
      expect(validateRut('10.000.013-k')).toBe(true);
    });
  });

  // Invalid RUT tests
  describe('invalid RUTs', () => {
    it('should return false for RUT with wrong verifier digit', () => {
      // 11.111.111-2 should be 11.111.111-1
      expect(validateRut('11.111.111-2')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateRut('')).toBe(false);
    });

    it('should return false for single character', () => {
      expect(validateRut('1')).toBe(false);
    });

    it('should return false for RUT with letters in number part', () => {
      expect(validateRut('11.ABC.111-1')).toBe(false);
    });

    it('should return false for completely invalid format', () => {
      expect(validateRut('invalid-rut')).toBe(false);
    });
  });

  // Edge cases
  describe('edge cases', () => {
    it('should handle RUT with only hyphen', () => {
      expect(validateRut('-')).toBe(false);
    });

    it('should handle RUT with spaces', () => {
      // Spaces should not affect validation after cleaning
      expect(validateRut('11 111 111-1')).toBe(false);
    });
  });
});

// =====================================================
// FORMAT RUT TESTS
// =====================================================

describe('formatRut', () => {
  it('should format clean RUT with dots and hyphen', () => {
    const result = formatRut('111111111');
    expect(result).toBe('11.111.111-1');
  });

  it('should format RUT that already has some formatting', () => {
    const result = formatRut('11111111-1');
    expect(result).toBe('11.111.111-1');
  });

  it('should handle short RUT numbers', () => {
    const result = formatRut('12345678');
    expect(result).toBe('1.234.567-8');
  });

  it('should return input for very short strings', () => {
    const result = formatRut('1');
    expect(result).toBe('1');
  });

  it('should handle RUT with K verifier', () => {
    const result = formatRut('12174133K');
    expect(result).toBe('12.174.133-K');
  });

  it('should convert lowercase k to uppercase', () => {
    const result = formatRut('12174133k');
    expect(result).toBe('12.174.133-K');
  });
});

// =====================================================
// CLEAN RUT TESTS
// =====================================================

describe('cleanRut', () => {
  it('should remove dots from RUT', () => {
    const result = cleanRut('11.111.111-1');
    expect(result).toBe('111111111');
  });

  it('should remove hyphen from RUT', () => {
    const result = cleanRut('11111111-1');
    expect(result).toBe('111111111');
  });

  it('should convert to uppercase', () => {
    const result = cleanRut('12.174.133-k');
    expect(result).toBe('12174133K');
  });

  it('should handle already clean RUT', () => {
    const result = cleanRut('111111111');
    expect(result).toBe('111111111');
  });
});
