import { NestFactory } from '@nestjs/core';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

/**
 * Inicializa a aplicação NestJS e configura os recursos globais da API.
 *
 * Responsabilidades:
 * - Criar a aplicação NestJS.
 * - Configurar leitura de cookies.
 * - Definir o prefixo global da API.
 * - Configurar CORS.
 * - Configurar a documentação OpenAPI/Swagger.
 * - Iniciar o servidor HTTP.
 */
async function bootstrap() {
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be configured in production.");
  }

  const app = await NestFactory.create(AppModule);

  // Permite que a aplicação leia cookies enviados pelo cliente.
  app.use(cookieParser());

  // Valida e transforma os dados recebidos pelos DTOs da API.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Define o prefixo global de todas as rotas da API.
  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'api/health', method: RequestMethod.GET }],
  });

  // Configura o acesso da aplicação web à API.
  const corsOrigins = (
    process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://localhost:3001'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
  });

  // Configura a documentação OpenAPI da API.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CCPF API')
    .setDescription('API do Centro de Controle Pessoal Financeiro (CCPF).')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Informe o JWT de acesso.',
      },
      'access-token',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  // A documentação fica disponível fora do prefixo /api/v1.
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);

  console.log(`API running on http://localhost:${process.env.PORT ?? 3000}`);
}

void bootstrap();
