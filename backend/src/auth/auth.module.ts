import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserProfileController } from './user-profile.controller';
import { UserProfileService } from './user-profile.service';
import { User } from './entities/user.entity';
import { UserProfilePicture } from './entities/user-profile-picture.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SharedModule } from '../shared/shared.module';
import { MailService } from '../mail/mail.service';
import { MailModule } from 'src/mail/mail.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfilePicture]),
    SharedModule,
    PassportModule,
    MailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'tu-clave-secreta-super-segura',
      signOptions: { expiresIn: parseInt(process.env.JWT_EXPIRES || '86400') }, //86400 seconds = 1 day 

    }),
  ],
  controllers: [AuthController, UsersController, UserProfileController],
  providers: [AuthService, UsersService, UserProfileService, JwtStrategy],
})
export class AuthModule {}