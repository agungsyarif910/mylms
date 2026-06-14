import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MailService } from '../../common/mail/mail.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Generate email verification token
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpiresAt = new Date();
    emailVerifyExpiresAt.setHours(emailVerifyExpiresAt.getHours() + 24); // 24 hours

    // Create user (always STUDENT via register)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        role: 'STUDENT',
        emailVerifyToken,
        emailVerifyExpiresAt,
      },
    });

    // Send verification email (non-blocking)
    this.mailService
      .sendVerificationEmail(user.email, user.fullName, emailVerifyToken)
      .catch((err) => {
        console.error('Failed to send verification email:', err.message);
      });

    return {
      message:
        'Registrasi berhasil! Silakan cek email Anda untuk verifikasi akun.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      requiresVerification: true,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      throw new BadRequestException(
        'Token verifikasi tidak valid atau sudah digunakan',
      );
    }

    if (user.emailVerifyExpiresAt && new Date() > user.emailVerifyExpiresAt) {
      throw new BadRequestException(
        'Token verifikasi sudah kadaluarsa. Silakan minta kirim ulang.',
      );
    }

    // Mark email as verified
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerifyToken: null,
        emailVerifyExpiresAt: null,
      },
    });

    // Generate tokens so user can login directly after verification
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      message: 'Email berhasil diverifikasi! Anda sekarang bisa login.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Return success even if user not found (security: don't expose whether email exists)
      return {
        message:
          'Jika email terdaftar, kami akan mengirimkan link verifikasi baru.',
      };
    }

    if (user.emailVerifiedAt) {
      throw new BadRequestException('Email sudah terverifikasi');
    }

    // Generate new token
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpiresAt = new Date();
    emailVerifyExpiresAt.setHours(emailVerifyExpiresAt.getHours() + 24);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken,
        emailVerifyExpiresAt,
      },
    });

    // Send verification email
    this.mailService
      .sendVerificationEmail(user.email, user.fullName, emailVerifyToken)
      .catch((err) => {
        console.error('Failed to resend verification email:', err.message);
      });

    return {
      message:
        'Jika email terdaftar, kami akan mengirimkan link verifikasi baru.',
    };
  }

  async login(dto: LoginDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Akun Anda telah dinonaktifkan');
    }

    // Check if email is verified
    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException(
        'Email belum diverifikasi. Silakan cek inbox email Anda atau minta kirim ulang verifikasi.',
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      message: 'Login berhasil',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success message (security: don't expose whether email exists)
    const successMessage =
      'Jika email terdaftar, kami akan mengirimkan link reset password.';

    if (!user) {
      return { message: successMessage };
    }

    // Generate password reset token
    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetExpiresAt = new Date();
    passwordResetExpiresAt.setHours(passwordResetExpiresAt.getHours() + 1); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpiresAt,
      },
    });

    // Send password reset email
    this.mailService
      .sendPasswordResetEmail(user.email, user.fullName, passwordResetToken)
      .catch((err) => {
        console.error('Failed to send password reset email:', err.message);
      });

    return { message: successMessage };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: token },
    });

    if (!user) {
      throw new BadRequestException(
        'Token reset password tidak valid atau sudah digunakan',
      );
    }

    if (
      user.passwordResetExpiresAt &&
      new Date() > user.passwordResetExpiresAt
    ) {
      throw new BadRequestException(
        'Token reset password sudah kadaluarsa. Silakan minta reset ulang.',
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    // Revoke all refresh tokens for security
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true },
    });

    return {
      message:
        'Password berhasil direset! Silakan login dengan password baru Anda.',
    };
  }

  async refreshToken(refreshToken: string) {
    // Find refresh token in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked) {
      throw new UnauthorizedException('Refresh token tidak valid');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Refresh token telah expired');
    }

    // Revoke old refresh token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
    );

    return {
      message: 'Token berhasil diperbarui',
      ...tokens,
    };
  }

  async logout(userId: string) {
    // Revoke all refresh tokens for this user
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    return { message: 'Logout berhasil' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    return user;
  }

  // ============ Private Methods ============

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION') || '15m',
      }),
      this.generateRefreshToken(userId),
    ]);

    return { accessToken, refreshToken };
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }
}
