import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as expressWinston from 'express-winston';
import winston from 'winston';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as fs from 'fs';
import * as https from 'https';

async function bootstrap() {
  const config = new ConfigService();
  const logger = new Logger('Bootstrap');

  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const isDev = nodeEnv !== 'production';
  const port = parseInt(process.env.PORT ?? '4000', 10);

  logger.log(`Server environment: ${nodeEnv}, isDev: ${isDev}, port: ${port}`);

  // Check if HTTPS is enabled via env
  const useHttps = process.env.USE_HTTPS === 'true';
  let app;

  if (useHttps) {
    // 🔹 Load SSL certificates (self-signed for dev)
    const httpsOptions = {
      key: fs.readFileSync(process.env.SSL_KEY_PATH ?? './cert/key.pem'),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH ?? './cert/cert.pem'),
    };
    app = await NestFactory.create(AppModule, { httpsOptions });
    logger.log('HTTPS enabled');
  } else {
    app = await NestFactory.create(AppModule);
    logger.log('HTTP enabled');
  }

  // 🔥 Required ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // CORS configuration
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
      if (!origin) return callback(null, true);

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

  // Helmet for security
  app.use(helmet());

  // HTTP logging
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

  const protocol = useHttps ? 'https' : 'http';
  logger.log(`Server listening on ${protocol}://localhost:${port}/api/v1`);
}

bootstrap();
