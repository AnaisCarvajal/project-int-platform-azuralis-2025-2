# Frontend Web - Ficha Médica Portátil

Aplicación web desarrollada con React y Vite para el sistema de gestión de fichas médicas oncológicas de la Universidad Católica del Norte.

## Descripción

Este frontend proporciona una interfaz de usuario moderna y responsive para la gestión de fichas médicas de pacientes oncológicos. Permite a pacientes, médicos, enfermeras y tutores acceder y gestionar información clínica de manera segura.

## Tecnologías Principales

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19.x | Biblioteca UI |
| Vite | 7.x | Build tool |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 3.x | Estilos |
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

## Despliegue

El frontend está configurado para desplegarse en Netlify o Render.

## Equipo

**Azuralis Team** - Universidad Católica del Norte  
Proyecto Integrador de Software 2025
