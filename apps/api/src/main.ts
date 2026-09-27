import { NestFactory } from '@nestjs/core';
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
  const app = await NestFactory.create(AppModule);

  // Permite que a aplicação leia cookies enviados pelo cliente.
  app.use(cookieParser());

  // Define o prefixo global de todas as rotas da API.
  app.setGlobalPrefix('api/v1');

  // Configura o acesso da aplicação web à API.
  // Configura o acesso da aplicação web à API.
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
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
