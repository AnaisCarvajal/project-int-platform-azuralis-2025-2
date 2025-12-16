import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Configurar CORS para permitir requests del frontend
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:3000',
    'https://frontend-azuralis-project-int-platform.onrender.com',
    'https://www.lacito.cl',
    'https://lacito.cl',
    'http://192.168.1.88:19000',
    'http://192.168.1.88:8081',
    'exp://192.168.1.88:8081',
    'exp://192.168.1.88:19000',





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

    // Swagger Config
  const config = new DocumentBuilder()
    .setTitle('API — Proyecto UCN')
    .setDescription('Documentación auto-generada con Swagger para la API NestJS')
    .setVersion('1.0.0')
    .addBearerAuth() // habilita "Authorize" con token
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // ✅ Valida automáticamente todos los DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina campos no definidos en los DTOs
      forbidNonWhitelisted: true, // lanza error si hay campos no permitidos
      transform: true, // convierte tipos automáticamente (string → number, etc.)
    }),
  );

 const port = process.env.PORT || 3000;
await app.listen(port, '0.0.0.0');
console.log(`🚀 Backend corriendo en: http://localhost:${port}`);

  console.log(`📊 Base de datos: ${process.env.NODE_ENV === 'production' ? 'Supabase PostgreSQL (Producción)' : 'PostgreSQL (Desarrollo)'}`);
}
bootstrap();
