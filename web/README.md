# Frontend Web - Ficha Médica Portátil

Aplicación web desarrollada con React y Vite para el sistema de gestión de fichas médicas oncológicas de la Universidad Católica del Norte.

## Descripción

Este frontend proporciona una interfaz de usuario moderna y responsive para la gestión de fichas médicas de pacientes oncológicos. Permite a pacientes, médicos, enfermeras y tutores acceder y gestionar información clínica de manera segura.

## Tecnologías Principales

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19.x | Biblioteca UI |
| Vite | 6.x | Build tool |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 4.x | Estilos |
| React Router | 7.x | Enrutamiento |
| Axios | 1.x | Cliente HTTP |
| Radix UI | - | Componentes accesibles |
| React Hook Form | 7.x | Gestión de formularios |

## Estructura del Proyecto

```
src/
├── assets/                  # Recursos estáticos
├── common/                  # Utilidades compartidas
│   ├── config/              # Configuración de la aplicación
│   └── helpers/             # Funciones auxiliares
├── components/              # Componentes reutilizables
│   └── ui/                  # Componentes UI base (shadcn/ui)
├── context/                 # Contextos de React
│   ├── AuthContext.tsx      # Contexto de autenticación
│   ├── PatientContext.tsx   # Contexto de pacientes
│   └── AppRouter.tsx        # Configuración de rutas
├── hooks/                   # Hooks personalizados
├── lib/                     # Utilidades
├── pages/                   # Páginas de la aplicación
│   ├── ClinicalStaff/       # Vistas de personal clínico
│   ├── Guardian/            # Vistas de tutores
│   └── Patient/             # Vistas de pacientes
├── services/                # Servicios de API
└── types/                   # Definiciones de tipos
```

## Roles y Dashboards

| Rol | Dashboard | Funcionalidades |
|-----|-----------|-----------------|
| Paciente | `/dashboard-patient` | Ver ficha médica, notas, documentos, perfil |
| Médico | `/dashboard-doctor` | Gestionar pacientes, equipo de cuidado, documentos |
| Enfermera | `/dashboard-nurse` | Gestionar pacientes asignados, notas clínicas |
| Tutor | `/dashboard-guardian` | Ver fichas de pacientes a cargo |

## Características Principales

- Autenticación JWT con refresh token
- Diseño responsive (mobile-first)
- Acceso de emergencia mediante código QR
- Gestión de documentos clínicos
- Sistema de notas para pacientes
- Personalización por tipo de cáncer (colores)
- Gestión de equipo de cuidado
- Subida de fotos de perfil con recorte

## Instalación

```bash
# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env.local

# Configurar URL del backend en .env.local
```

## Variables de Entorno

```env
# URL del backend (desarrollo)
VITE_API_URL=http://localhost:3000

# URL del backend (producción)
VITE_API_URL=https://backend-azuralis.onrender.com
```

## Ejecución

```bash
# Desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview

# Servir build de producción
npm run serve
```

## Rutas de la Aplicación

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Página de inicio / Login |
| `/register` | Público | Registro de usuarios |
| `/emergency/:qrCode` | Público | Acceso de emergencia |
| `/dashboard-patient` | Protegido | Dashboard de paciente |
| `/dashboard-doctor` | Protegido | Dashboard de médico |
| `/dashboard-nurse` | Protegido | Dashboard de enfermera |
| `/dashboard-guardian` | Protegido | Dashboard de tutor |

## Componentes UI

La aplicación utiliza componentes basados en shadcn/ui con Radix UI:

- Accordion, Alert, Avatar, Badge
- Button, Card, Checkbox, Dialog
- Dropdown, Form, Input, Label
- Popover, Select, Tabs, Toast
- Tooltip, Skeleton, Spinner

## Helpers Disponibles

| Helper | Archivo | Propósito |
|--------|---------|-----------|
| `calculateAge` | `CalculateAge.ts` | Calcular edad desde fecha de nacimiento |
| `getDashboardRoute` | `GetDashboardRoute.ts` | Obtener ruta según rol de usuario |
| `imageOptimizer` | `ImageOptimizer.ts` | Optimización de imágenes |
| `validateForm` | `ValidateForm.ts` | Validación de formularios |
| `validateRut` | `ValidateRut.ts` | Validación de RUT chileno |

## Hooks Personalizados

| Hook | Propósito |
|------|-----------|
| `useIsMobile` | Detectar si el dispositivo es móvil |
| `usePatientData` | Obtener datos del paciente actual |

## Contextos

### AuthContext

Proporciona:
- `user`: Usuario autenticado
- `login()`: Iniciar sesión
- `logout()`: Cerrar sesión
- `isAuthenticated`: Estado de autenticación

### PatientContext

Proporciona:
- `patientId`: ID del paciente actual
- `patientData`: Datos completos del paciente
- `cancerColor`: Color asociado al tipo de cáncer

## Despliegue

### Netlify

El proyecto incluye configuración para Netlify:
- `public/_redirects`: Configuración de SPA
- `public/netlify.toml`: Configuración del build

### Render

También soporta despliegue en Render mediante `serve.json`.

## Accesibilidad

La aplicación implementa:
- Labels asociados a inputs (`htmlFor`)
- Atributos ARIA (`aria-label`, `aria-current`, `aria-describedby`)
- Roles semánticos (`role="alert"`, `role="status"`)
- Estados de focus visibles
- Contraste de colores adecuado
