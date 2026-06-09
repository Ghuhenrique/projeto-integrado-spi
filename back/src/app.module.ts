import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { Neo4jModule } from './neo4j/neo4j.module';
import { ProfessorModule } from './professor/professor.module';

import { LoggerMiddleware } from './middlewares/logger.middleware';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt.auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ProfessorModule,
    Neo4jModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService, {
    provide:APP_GUARD,
    useClass:JwtAuthGuard
  }],
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