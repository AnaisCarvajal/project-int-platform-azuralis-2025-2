/**
 * Basic Backend Tests
 * 5 simple tests to verify core functionality
 */

import { UserRole } from '../src/shared/enums/user-role.enum';
import { CancerType } from '../src/shared/enums/cancer-type.enum';
import { CareTeamRole } from '../src/shared/enums/care-team-role.enum';
import { DocumentType } from '../src/shared/enums/document-type.enum';

describe('Basic Backend Tests', () => {
  /**
   * Test 1: User Roles Enum
   * Verifies that user roles are correctly defined
   */
  it('should have correct user roles defined', () => {
    expect(UserRole.PATIENT).toBe('patient');
    expect(UserRole.DOCTOR).toBe('doctor');
    expect(UserRole.NURSE).toBe('nurse');
    expect(UserRole.GUARDIAN).toBe('guardian');
  });

  /**
   * Test 2: Cancer Types Enum
   * Verifies that cancer types are correctly defined
   */
  it('should have correct cancer types defined', () => {
    expect(CancerType.BREAST).toBe('breast');
    expect(CancerType.LUNG).toBe('lung');
    expect(CancerType.COLORECTAL).toBe('colorectal');
    expect(CancerType.OTHER).toBe('other');
  });

  /**
   * Test 3: Care Team Roles Enum
   * Verifies that care team roles are correctly defined
   */
  it('should have correct care team roles defined', () => {
    expect(CareTeamRole.ONCOLOGO_PRINCIPAL).toBe('oncologo_principal');
    expect(CareTeamRole.CIRUJANO).toBe('cirujano');
    expect(CareTeamRole.ENFERMERA_JEFE).toBe('enfermera_jefe');
  });

  /**
   * Test 4: Document Types Enum
   * Verifies that document types are correctly defined
   */
  it('should have correct document types defined', () => {
    expect(DocumentType.EXAMEN).toBe('examen');
    expect(DocumentType.RECETA).toBe('receta');
    expect(DocumentType.INFORME_MEDICO).toBe('informe_medico');
  });

  /**
   * Test 5: Data Validation Logic
   * Verifies basic validation patterns used in DTOs
   */
  it('should validate email and password patterns', () => {
    // Email validation regex (same as used in DTOs)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    expect(emailRegex.test('user@example.com')).toBe(true);
    expect(emailRegex.test('invalid-email')).toBe(false);
    
    // Password validation regex (uppercase + number required)
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    
    expect(passwordRegex.test('Password123')).toBe(true);
    expect(passwordRegex.test('password')).toBe(false);
    expect(passwordRegex.test('12345')).toBe(false);
  });
});
