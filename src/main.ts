import * as dotenv from 'dotenv';
dotenv.config(); // SABSE PEHLE load karna hai

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as expressWinston from 'express-winston';
import winston from 'winston';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // PORT & ENV
  const port = parseInt(config.get<string>('PORT') ?? '4000', 10);
  const nodeEnv = config.get<string>('NODE_ENV') ?? 'development';
  const isDev = nodeEnv !== 'production';
  logger.log(`Server environment: ${nodeEnv}, isDev: ${isDev}, port: ${port}`);

  // CORS Configuration
  const envOrigins = (process.env.ALLOWED_ORIGINS ?? '').trim();
  const defaultOrigins = isDev
    ? [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:4000',
      ]
    : ['https://cakistockmarket.com', 'https://www.cakistockmarket.com'];

  const allowedOrigins = envOrigins
    ? envOrigins.split(',').map((s) => s.trim()).filter(Boolean)
    : defaultOrigins;

  logger.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Allow Postman / server-to-server

      const normalized = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalized)) return callback(null, true);

      logger.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cache-Control',
    ],
    maxAge: 86400,
  });

  // Security headers
  app.use(helmet());

  // HTTP Request Logging with Winston
  app.use(
    expressWinston.logger({
      winstonInstance: winston.createLogger({
        level: isDev ? 'debug' : 'info',
        transports: [new winston.transports.Console()],
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
      meta: true,
      msg: 'HTTP {{req.method}} {{req.url}}',
      expressFormat: true,
      colorize: false,
    }),
  );

  await app.listen(port);
  logger.log(`Server listening on http://localhost:${port}/api/v1`);
}

bootstrap();
