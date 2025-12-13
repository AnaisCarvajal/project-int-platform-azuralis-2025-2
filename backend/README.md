# Backend - Ficha Médica Portátil

API REST desarrollada con NestJS para el sistema de gestión de fichas médicas oncológicas de la Universidad Católica del Norte.

## Descripción

Este backend proporciona los servicios necesarios para la gestión integral de pacientes oncológicos, incluyendo autenticación, gestión de fichas médicas, equipo de cuidado, documentos clínicos y acceso de emergencia mediante códigos QR.

## Tecnologías Principales

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| NestJS | 11.x | Framework backend |
| TypeORM | 0.3.x | ORM para PostgreSQL |
| PostgreSQL | 15+ | Base de datos |
| JWT | - | Autenticación |
| bcrypt | 6.x | Hash de contraseñas |
| class-validator | 0.14.x | Validación de DTOs |
| Cloudflare R2 | - | Almacenamiento de archivos |

## Roles de Usuario

| Rol | Descripción |
|-----|-------------|
| `patient` | Paciente oncológico |
| `doctor` | Médico tratante |
| `nurse` | Enfermera/o |
| `guardian` | Tutor o acompañante |

## Instalación

```bash
# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Configurar variables de entorno en .env
```

## Variables de Entorno

```env
# General
NODE_ENV=development

# Base de datos local (desarrollo)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=1234
DB_NAME=famed_ucn

# Base de datos producción (Supabase)
DB_HOST_PROD=aws-1-us-east-1.pooler.supabase.com
DB_PORT_PROD=5432
DB_USER_PROD=postgres.xxxxx
DB_PASS_PROD=your_password
DB_NAME_PROD=postgres

# JWT
JWT_SECRET=your_secret_key

# Cloudflare R2
R2_BUCKET_NAME=famed-azuralis
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
```

## Ejecución

```bash
# Desarrollo (base de datos local)
npm run dev

# Producción (Supabase)
npm run prod

# Compilar
npm run build
```

## Testing

```bash
# Tests unitarios
npm run test

# Tests con cobertura
npm run test:cov

# Tests E2E
npm run test:e2e

# Tests en modo watch
npm run test:watch
```

## Endpoints Principales

### Autenticación (`/auth`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registro de usuario |
| POST | `/auth/login` | Inicio de sesión |
| GET | `/auth/profile` | Perfil del usuario autenticado |

### Pacientes (`/patients`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/patients` | Listar pacientes |
| GET | `/patients/:id` | Obtener paciente por ID |
| GET | `/patients/rut/:rut` | Buscar paciente por RUT |
| POST | `/patients` | Crear paciente |
| PUT | `/patients/:id` | Actualizar paciente |
| DELETE | `/patients/:id` | Eliminar paciente |

### Equipo de Cuidado (`/patients/:id/care-team`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/patients/:id/care-team` | Listar equipo de cuidado |
| POST | `/patients/:id/care-team` | Agregar miembro |
| DELETE | `/patients/:id/care-team/:memberId` | Eliminar miembro |

### Documentos (`/patients/:id/documents`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/patients/:id/documents` | Listar documentos |
| POST | `/patients/:id/documents` | Subir documento |
| DELETE | `/documents/:id` | Eliminar documento |

### Acceso de Emergencia (`/emergency`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/emergency/:qrCode` | Acceder a ficha por QR |

## Cobertura de Tests

```
Archivo                  | Statements | Branches | Functions | Lines
-------------------------|------------|----------|-----------|-------
auth.service.ts          | 83.56%     | 52.94%   | 100%      | 83.09%
patients.service.ts      | 68.21%     | 41.66%   | 86.36%    | 66.93%
care-team.service.ts     | 100%       | 100%     | 100%      | 100%
```

## Base de Datos

El sistema utiliza PostgreSQL con dos configuraciones:

- **Desarrollo**: Base de datos local ejecutada con Docker
- **Producción**: Supabase PostgreSQL con SSL

### Docker (Desarrollo)

```bash
# Iniciar base de datos local
docker-compose up -d
```

## Despliegue

El backend está configurado para desplegarse en Render mediante el archivo `render.yaml`.