import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Film } from './entities/film.entity';
import { FilmsRepository } from './films.repository';
import { FilmsService } from './films.service';
import { FilmsController } from './films.controller';
import { SwapiModule } from '../swapi/swapi.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Film]), SwapiModule, AuthModule],
  controllers: [FilmsController],
  providers: [
    FilmsService,
    { provide: 'IFilmsRepository', useClass: FilmsRepository },
  ],
  exports: [FilmsService],
})
export class FilmsModule {}
