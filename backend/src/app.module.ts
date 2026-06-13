import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60,
        limit: 3,
      },
      {
        name: 'uploads',
        ttl: 3600, // 1 hora
        limit: 20, // 20 uploads por hora
      },
    ]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';

        if (isProduction) {
          // --- Se ejecutará con 'npm run prod' ---
          const host = configService.get<string>('DB_HOST_PROD')!;
          const username = configService.get<string>('DB_USER_PROD')!;
          
          console.log('🚀 Connecting to PRODUCTION database (Supabase PostgreSQL)...');
          console.log('📊 Server:', host);
          console.log('📊 Database:', configService.get<string>('DB_NAME_PROD'));
          console.log('👤 Username:', username);
          
          return {
            type: 'postgres',
            host: host,
            port: parseInt(configService.get<string>('DB_PORT_PROD', '5432')),
            username: username,
            password: configService.get<string>('DB_PASS_PROD')!,
            database: configService.get<string>('DB_NAME_PROD')!,
            autoLoadEntities: true, // Cargar entidades
            synchronize: false, // ✅ Seguridad: No sincronizar automáticamente en producción
            logging: true, // Activar logging para ver qué pasa
            ssl: {
              rejectUnauthorized: false, // Supabase usa certificados SSL
            },
          };
        } else {
          // --- Se ejecutará con 'npm run dev' ---
          console.log('🔧 Connecting to DEVELOPMENT database (Local PostgreSQL)...');
          return {
            type: 'postgres',
            host: configService.get<string>('DB_HOST')!,
            port: parseInt(configService.get<string>('DB_PORT', '5432')),
            username: configService.get<string>('DB_USER')!,
            password: configService.get<string>('DB_PASS')!,
            database: configService.get<string>('DB_NAME')!,
            autoLoadEntities: true,
            synchronize: true, // Ok para desarrollo
          };
        }
      },
    }),

    AuthModule,
    PatientsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}