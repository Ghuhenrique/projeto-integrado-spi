import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsuarioModule } from './usuario/usuario.module';
import { Neo4jModule } from './neo4j/neo4j.module';

import { LoggerMiddleware } from './middlewares/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    UsuarioModule,
    Neo4jModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {

  configure(
    consumer: MiddlewareConsumer,
  ) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({
        path: '*',
        method: RequestMethod.ALL,
      });
  }

}