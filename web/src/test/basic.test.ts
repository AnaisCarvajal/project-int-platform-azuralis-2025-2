/**
 * Basic Frontend Tests
 * 5 simple tests to verify core functionality
 */

import { describe, it, expect } from 'vitest';
import { validateRut } from '../common/helpers/ValidateRut';
import { calculateAge } from '../common/helpers/CalculateAge';
import { cn } from '../lib/utils';

describe('Basic Frontend Tests', () => {
  /**
   * Test 1: RUT Validation
   * Verifies that Chilean RUT validation works correctly
   */
  it('should validate Chilean RUT correctly', () => {
    // Valid RUT
    expect(validateRut('11.111.111-1')).toBe(true);
    
    // Invalid RUT (wrong verifier digit)
    expect(validateRut('11.111.111-2')).toBe(false);
  });

  /**
   * Test 2: Age Calculation
   * Verifies that age is calculated correctly from birth date
   */
  it('should calculate age from birth date', () => {
    const today = new Date();
    const birthYear = today.getFullYear() - 25;
    const birthDate = `${birthYear}-01-01`;
    
    const age = calculateAge(birthDate);
    
    expect(age).toBeGreaterThanOrEqual(24);
    expect(age).toBeLessThanOrEqual(25);
  });

  /**
   * Test 3: CSS Class Merging
   * Verifies that Tailwind classes merge correctly
   */
  it('should merge CSS classes correctly', () => {
    const result = cn('bg-red-500', 'text-white', 'p-4');
    
    expect(result).toContain('bg-red-500');
    expect(result).toContain('text-white');
    expect(result).toContain('p-4');
  });

  /**
   * Test 4: Conditional Classes
   * Verifies that conditional classes work correctly
   */
  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    
    const result = cn(
      'base-class',
      isActive && 'active-class',
      isDisabled && 'disabled-class'
    );
    
    expect(result).toContain('base-class');
    expect(result).toContain('active-class');
    expect(result).not.toContain('disabled-class');
  });

  /**
   * Test 5: Invalid Input Handling
   * Verifies that functions handle invalid inputs gracefully
   */
  it('should handle invalid inputs gracefully', () => {
    // Empty RUT should return false
    expect(validateRut('')).toBe(false);
    
    // Empty date should return 0
    expect(calculateAge('')).toBe(0);
    
    // Empty classes should return empty string
    expect(cn()).toBe('');
  });
});
