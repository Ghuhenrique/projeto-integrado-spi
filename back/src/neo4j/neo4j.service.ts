import { Injectable, OnModuleDestroy } from '@nestjs/common';
import neo4j, { Driver, Session } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnModuleDestroy {

  private driver: Driver;

  constructor() {
    this.driver = neo4j.driver(
      process.env.NEO4J_URI!,
      neo4j.auth.basic(
        process.env.NEO4J_USER!,
        process.env.NEO4J_PASSWORD!
      )
    );
  }

  getSession() {
    return this.driver.session();
  }

  getReadSession(): Session {
    return this.driver.session({ defaultAccessMode: neo4j.session.READ });
  }

  getWriteSession(): Session {
    return this.driver.session({ defaultAccessMode: neo4j.session.WRITE });
  }

  async onModuleDestroy() {
    await this.driver.close();
  }
}