# Ficha Médica Portátil FAMED UCN

Proyecto integrador de software que combina hardware y software para permitir que pacientes oncológicos porten su historial clínico en una tarjeta QR, facilitando el acceso inmediato, seguro y confiable a la información crítica por parte de profesionales de la salud.

## Tecnologías

- **Backend**: NestJS, TypeORM, PostgreSQL
- **Frontend Web**: React, TypeScript, Tailwind CSS
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: JWT
- **Almacenamiento**: Cloudflare R2

## Arquitectura

El proyecto consta de tres componentes principales:

- **Backend API** ([README](backend/README.md)): API REST desarrollada con NestJS
- **Frontend Web** ([README](web/README.md)): Aplicación React para gestión de fichas médicas
- **Hardware**: Tarjeta con QR (en desarrollo)

## Instalación

### Prerrequisitos

- Node.js 18+

### Configuración

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/AnaisRodriguez1/project-int-platform-azuralis-2025-2.git
   cd project-int-platform-azuralis-2025-2
   ```

2. Configurar backend:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Editar .env con las credenciales de Supabase
   ```

3. Configurar frontend web:
   ```bash
   cd ../web
   npm install
   cp .env.example .env.local
   # Editar .env.local con la URL del backend
   ```

### Ejecución

1. Backend:
   ```bash
   cd backend
   npm run prod
   ```

2. Frontend:
   ```bash
   cd web
   npm run dev
   ```

## Equipo de Desarrollo

| Nombre          | Rol                          |
|-----------------|------------------------------|
| Adrián Elgueta  | Product Owner / Backend      |
| Anais Rodríguez | Frontend Web / Tester        |
| Paula Núñez     | Scrum Master / Frontend Móvil|

## Universidad Católica del Norte

Proyecto Integrador de Software - 2025
