import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);
  private smtpReady = false;

  constructor(private configService: ConfigService) {
    const host = this.configService.get('SMTP_HOST', 'smtp.sumopod.com');
    const port = this.configService.get<number>('SMTP_PORT', 465);
    const secure = this.configService.get('SMTP_SECURE', 'true') === 'true';
    const user = this.configService.get('SMTP_USER');
    const pass = this.configService.get('SMTP_PASS');

    this.logger.log(`SMTP Config: host=${host}, port=${port}, secure=${secure}, user=${user ? user.substring(0, 8) + '...' : 'NOT SET'}`);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      // Vercel serverless functions have limited execution time
      // Use shorter timeouts to fail fast rather than hang
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 15000,
      // Pool connections for reuse across invocations
      pool: false, // Disable pool in serverless (each invocation is independent)
    } as nodemailer.TransportOptions);
  }

  async onModuleInit() {
    try {
      await this.transporter.verify();
      this.smtpReady = true;
      this.logger.log('✅ SMTP connection verified successfully');
    } catch (error) {
      this.smtpReady = false;
      this.logger.warn(`⚠️ SMTP verification failed: ${error.message}`);
      this.logger.warn('Email sending will attempt on-demand. Check SMTP credentials if emails fail.');
      // Do NOT throw — let the app continue running
      // Emails will be attempted on-demand and errors handled per-request
    }
  }

  async sendVerificationEmail(
    email: string,
    fullName: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'https://mylms-jade.vercel.app',
    );
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
    const appName = this.configService.get('APP_NAME', 'LMS Bhuana EduTech');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:32px 40px;text-align:center;">
                    <h1 style="color:#ffffff;font-size:24px;margin:0;">🎓 ${appName}</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Halo, ${fullName}! 👋</h2>
                    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
                      Terima kasih telah mendaftar di <strong>${appName}</strong>. Silakan verifikasi email Anda dengan mengklik tombol di bawah ini:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:8px 0 24px;">
                          <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;box-shadow:0 4px 12px rgba(59,130,246,0.3);">
                            ✅ Verifikasi Email Saya
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0 0 16px;">
                      Atau salin link berikut ke browser Anda:<br>
                      <a href="${verifyUrl}" style="color:#3b82f6;word-break:break-all;">${verifyUrl}</a>
                    </p>
                    <p style="color:#94a3b8;font-size:13px;margin:0;">
                      ⏰ Link ini berlaku selama <strong>24 jam</strong>. Jika Anda tidak mendaftar, abaikan email ini.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                    <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const fromAddress = this.configService.get('SMTP_FROM', this.configService.get('SMTP_USER'));

    try {
      const info = await this.transporter.sendMail({
        from: `"${appName}" <${fromAddress}>`,
        to: email,
        subject: `Verifikasi Email Anda — ${appName}`,
        html,
      });
      this.logger.log(`✅ Verification email sent to ${email} (messageId: ${info.messageId})`);
    } catch (error) {
      this.logger.error(`❌ Failed to send verification email to ${email}`);
      this.logger.error(`SMTP Error: ${error.message}`);
      this.logger.error(`SMTP Config: host=${this.configService.get('SMTP_HOST')}, port=${this.configService.get('SMTP_PORT')}, from=${fromAddress}`);
      throw error;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'https://mylms-jade.vercel.app',
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const appName = this.configService.get('APP_NAME', 'LMS Bhuana EduTech');

    this.logger.log(`Preparing password reset email for ${email}, resetUrl: ${resetUrl}`);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px 40px;text-align:center;">
                    <h1 style="color:#ffffff;font-size:24px;margin:0;">🔐 Reset Password</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Halo, ${fullName}! 👋</h2>
                    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
                      Kami menerima permintaan untuk mereset password akun <strong>${appName}</strong> Anda. Klik tombol di bawah untuk membuat password baru:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:8px 0 24px;">
                          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;box-shadow:0 4px 12px rgba(245,158,11,0.3);">
                            🔑 Reset Password Saya
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0 0 16px;">
                      Atau salin link berikut ke browser Anda:<br>
                      <a href="${resetUrl}" style="color:#f59e0b;word-break:break-all;">${resetUrl}</a>
                    </p>
                    <p style="color:#94a3b8;font-size:13px;margin:0;">
                      ⏰ Link ini berlaku selama <strong>1 jam</strong>. Jika Anda tidak meminta reset password, abaikan email ini.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                    <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const fromAddress = this.configService.get('SMTP_FROM', this.configService.get('SMTP_USER'));

    try {
      const info = await this.transporter.sendMail({
        from: `"${appName}" <${fromAddress}>`,
        to: email,
        subject: `Reset Password — ${appName}`,
        html,
      });
      this.logger.log(`✅ Password reset email sent to ${email} (messageId: ${info.messageId})`);
    } catch (error) {
      this.logger.error(`❌ Failed to send password reset email to ${email}`);
      this.logger.error(`SMTP Error: ${error.message}`);
      this.logger.error(`SMTP Config: host=${this.configService.get('SMTP_HOST')}, port=${this.configService.get('SMTP_PORT')}, from=${fromAddress}`);
      throw error;
    }
  }
}
