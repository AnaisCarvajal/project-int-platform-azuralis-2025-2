import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class MailService {
  async sendPasswordReset(email: string, link: string) {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY no está definido');
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to: email,
      from: process.env.EMAIL_FROM!,
      subject: 'Recuperación de contraseña',
      html: `
        <p>Solicitaste recuperar tu contraseña.</p>
        <p>Haz clic en el siguiente enlace (válido por 15 minutos):</p>
        <a href="${link}">${link}</a>
        <p>Si no fuiste tú, ignora este mensaje.</p>
      `,
    });
  }
}
