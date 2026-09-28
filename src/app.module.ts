import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common/common.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { FilmsModule } from './films/films.module';
import { FilmsService } from './films/films.service';
import { UsersService } from './users/users.service';
import { UserRole } from './users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'conexa',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    CommonModule,
    UsersModule,
    AuthModule,
    FilmsModule,
  ],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(
    private readonly filmsService: FilmsService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedUsers();
    await this.seedFilms();
  }

  private async seedUsers(): Promise<void> {
    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    const userEmail = process.env.SEED_USER_EMAIL;
    const userPassword = process.env.SEED_USER_PASSWORD;

    if (!adminEmail || !adminPassword || !userEmail || !userPassword) {
      this.logger.debug('AppModule.seedUsers: seed env vars not set, skipping');
      return;
    }

    try {
      await this.usersService.seedUser(adminEmail, adminPassword, UserRole.ADMIN);
      await this.usersService.seedUser(userEmail, userPassword, UserRole.REGULAR);
    } catch (err) {
      this.logger.warn(
        { error: err instanceof Error ? err.message : String(err) },
        'AppModule.seedUsers: failed, app continues',
      );
    }
  }

  private async seedFilms(): Promise<void> {
    this.logger.log('AppModule.seedFilms: syncing films from SWAPI');
    try {
      await this.filmsService.syncFromSwapi();
    } catch (err) {
      this.logger.warn(
        { error: err instanceof Error ? err.message : String(err) },
        'AppModule.seedFilms: sync failed (SWAPI may be unavailable), app continues',
      );
    }
    this.logger.log('AppModule.seedFilms: sync complete');
  }
}
