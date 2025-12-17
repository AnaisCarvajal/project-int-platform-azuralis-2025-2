# 🧪 Testing - Azuralis Platform

## 📋 Resumen

Este documento describe la estrategia de testing implementada para la plataforma Azuralis.

| Proyecto | Tests | Estado |
|----------|-------|--------|
| Backend | 10 | ✅ Passing |
| Frontend | 5 | ✅ Passing |
| **Total** | **15** | ✅ **100%** |

---

## 🔧 Comandos de Testing

### Backend (NestJS + Jest)

```bash
# Ir al directorio backend
cd backend

# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch (desarrollo)
npm run test:watch

# Ejecutar tests con cobertura
npm run test:cov

# Ejecutar tests E2E
npm run test:e2e
```

### Frontend (React + Vitest)

```bash
# Ir al directorio web
cd web

# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch
```

---

## 📁 Estructura de Tests

```
project/
├── backend/
│   ├── src/
│   │   ├── basic.spec.ts        # Tests básicos (enums, validación)
│   │   └── storage.spec.ts      # Tests de almacenamiento (R2, Supabase)
│   └── test/
│       └── app.e2e-spec.ts      # Tests End-to-End
└── web/
    └── src/
        └── test/
            ├── setup.ts         # Configuración de Vitest
            └── basic.test.ts    # Tests básicos frontend
```

---

## 🔬 Tests del Backend

### 1. Tests Básicos (`basic.spec.ts`)

| # | Test | Descripción |
|---|------|-------------|
| 1 | UserRole enum | Valida roles: paciente, médico, enfermero, admin |
| 2 | CancerType enum | Valida tipos de cáncer del sistema |
| 3 | CareTeamRole enum | Valida roles del equipo médico |
| 4 | DocumentType enum | Valida tipos de documentos |
| 5 | Validación email/password | Patrones regex de validación |

### 2. Tests de Almacenamiento (`storage.spec.ts`)

| # | Test | Descripción |
|---|------|-------------|
| 1 | URL Cloudflare R2 | Formato correcto de URLs de R2 |
| 2 | Extraer path de URL | Obtener key desde URL completa |
| 3 | Tipos de documentos | Validar tipos permitidos |
| 4 | Estructura Supabase | Campos requeridos en documentos |
| 5 | Respuesta eliminación | Confirma eliminación R2 + Supabase |

---

## 🎨 Tests del Frontend

### Tests Básicos (`basic.test.ts`)

| # | Test | Descripción |
|---|------|-------------|
| 1 | validateRut() | Validación de RUT chileno |
| 2 | calculateAge() | Cálculo de edad desde fecha |
| 3 | cn() | Combinación de clases CSS |
| 4 | Clases condicionales | Booleanos en cn() |
| 5 | Inputs inválidos | Manejo de errores |

---

## 📊 Cobertura de Código

### Ejecutar reporte de cobertura:

```bash
cd backend
npm run test:cov
```

### Enums con 100% de cobertura:

| Archivo | Statements | Branches | Functions | Lines |
|---------|------------|----------|-----------|-------|
| cancer-type.enum.ts | 100% | 100% | 100% | 100% |
| care-team-role.enum.ts | 100% | 100% | 100% | 100% |
| document-type.enum.ts | 100% | 100% | 100% | 100% |
| user-role.enum.ts | 100% | 100% | 100% | 100% |

---

## ✅ Checklist de Calidad

| Criterio | Estado |
|----------|--------|
| Tests unitarios existen | ✅ |
| Tests son independientes | ✅ |
| Tests usan mocks (sin BD real) | ✅ |
| Tests cubren casos límite | ✅ |
| Tests están documentados | ✅ |

---

## 🚀 Ejecutar Todos los Tests

### Script rápido (PowerShell):

```powershell
# Backend
cd backend; npm test

# Frontend  
cd ../web; npm test
```

### Resultado esperado:

```
Backend:  10 tests ✅
Frontend:  5 tests ✅
Total:    15 tests ✅
```

---

## 📝 Notas

- **Framework Backend:** Jest (NestJS)
- **Framework Frontend:** Vitest (Vite + React)
- **Cobertura:** Enums críticos al 100%
- **Almacenamiento:** Cloudflare R2 + Supabase testeados
- **E2E:** Disponible con `npm run test:e2e`

---

## 👥 Equipo

**Azuralis Team** - Proyecto Integrador de Software 2025
