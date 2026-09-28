import { Module } from '@nestjs/common';
import { SwapiClient } from './swapi.client';

@Module({
  providers: [{ provide: 'ISwapiClient', useClass: SwapiClient }],
  exports: ['ISwapiClient'],
})
export class SwapiModule {}
