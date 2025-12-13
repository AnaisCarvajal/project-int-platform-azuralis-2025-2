import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Configurar CORS para permitir requests del frontend
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:3000',
    'https://frontend-azuralis-project-int-platform.onrender.com',
    'https://www.lacito.cl',
    'https://lacito.cl'
  ];

  // Si hay FRONTEND_URL_PROD en .env, agregarlo también
  if (process.env.FRONTEND_URL_PROD) {
    allowedOrigins.push(process.env.FRONTEND_URL_PROD);
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true, // Permitir cookies/credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // ✅ Valida automáticamente todos los DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina campos no definidos en los DTOs
      forbidNonWhitelisted: true, // lanza error si hay campos no permitidos
      transform: true, // convierte tipos automáticamente (string → number, etc.)
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Backend corriendo en: http://localhost:${port}`);
  console.log(`📊 Base de datos: ${process.env.NODE_ENV === 'production' ? 'Supabase PostgreSQL (Producción)' : 'PostgreSQL (Desarrollo)'}`);
}
bootstrap();
