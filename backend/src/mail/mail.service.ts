import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class MailService {
  async sendPasswordReset(email: string, code: string) {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY no está definido');
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to: email,
      from: {
        email: process.env.EMAIL_FROM!,
        name: '🎗️Lacito Correos',
      },
      subject: 'Código de recuperación - Lacito',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
          <!-- Top border -->
          <div style="height: 8px; background: linear-gradient(90deg, #ff6299, #fa8fb5, #ff6299);"></div>
          
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="text-align: center; padding: 30px 20px 20px 20px; background-color: #fff5f8;">
              <div style="font-size: 48px; margin-bottom: 10px;">🎗️</div>
              <h1 style="margin: 0; color: #ff6299; font-size: 24px; font-weight: 600;">Lacito</h1>
              <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Ficha Médica Portátil</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px 40px;">
              <h2 style="color: #333; font-size: 20px; margin: 0 0 20px 0; text-align: center;">Código de Recuperación</h2>
              
              <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                Estimado usuario,
              </p>
              
              <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Utiliza el siguiente código:
              </p>
              
              <!-- Code Box -->
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background-color: #fff5f8; border: 2px solid #ff6299; border-radius: 12px; padding: 20px 40px;">
                  <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #ff6299;">${code}</span>
                </div>
              </div>
              
              <!-- Button to reset page -->
              <div style="text-align: center; margin: 25px 0;">
                <a href="${process.env.APP_URL}/reset-password" style="display: inline-block; background-color: #ff6299; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Ir a restablecer contraseña
                </a>
              </div>
              
              <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 20px 0; text-align: center;">
                Este código expirará en <strong>15 minutos</strong> por seguridad.
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
              
              <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 0;">
                Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña permanecerá sin cambios.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 20px; background-color: #fff5f8;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                © 2025 Lacito - Azuralis Team
              </p>
              <p style="margin: 5px 0 0 0; color: #bbb; font-size: 11px;">
                Sistema desarrollado para mejorar la atención oncológica
              </p>
            </div>
          </div>
          
          <!-- Bottom border -->
          <div style="height: 8px; background: linear-gradient(90deg, #ff6299, #fa8fb5, #ff6299);"></div>
        </body>
        </html>
      `,
    });
  }
}
