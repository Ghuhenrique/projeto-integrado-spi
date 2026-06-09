import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('SPI - Backend')
    .setVersion('1.0.0.alpha')
    .addBearerAuth({
      type:'http',
      scheme:'bearer',
      bearerFormat: 'JWT',
      description: 'Informe o token JWT',
      in:'header'
    })
    .build();

  const docFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, docFactory)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(3000);
}
bootstrap();
