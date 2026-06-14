import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import helmet from 'helmet';
import express from 'express';
import { AppModule } from './app.module';

const expressApp = express();
let cachedHandler: express.Express | null = null;

async function bootstrap(): Promise<express.Express> {
  if (cachedHandler) return cachedHandler;

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: ['error', 'warn', 'log'],
  });

  // Security
  app.use(helmet());

  // CORS
  const allowedOrigins = [
    'http://localhost:3000',
    'https://mylms-jade.vercel.app',
    'https://mylms-ay6i.vercel.app',
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((u: string) => u.trim()) : []),
  ].filter(Boolean);

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.init();
  cachedHandler = expressApp;
  console.log('✅ NestJS serverless handler initialized');
  return cachedHandler;
}

export default async function handler(req: express.Request, res: express.Response) {
  try {
    const app = await bootstrap();
    app(req, res);
  } catch (error: any) {
    console.error('❌ Serverless handler error:', error.message);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error during initialization',
    });
  }
}
