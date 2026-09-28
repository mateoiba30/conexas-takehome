import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FilmsService } from './films.service';
import { CreateFilmDto } from './dto/create-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { Film } from './entities/film.entity';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PositiveIntPipe } from '../common/pipes/positive-int.pipe';

@ApiTags('films')
@Controller('films')
export class FilmsController {
  constructor(private readonly filmsService: FilmsService) {}

  @Get()
  @ApiOperation({ summary: 'List all films (public)' })
  @ApiResponse({ status: 200, type: [Film], description: 'Array of films. These are the droids you are looking for.' })
  findAll() {
    return this.filmsService.findAll();
  }

  @Post('sync')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync films from SWAPI (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns { added: number, skipped: number }. The Jedi archives have been updated.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  sync() {
    return this.filmsService.syncFromSwapi();
  }

  @Get(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('admin', 'regular')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get film details (regular + admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: Film, description: 'Film details. The Force will be with you, always.' })
  @ApiResponse({ status: 400, description: 'Invalid id' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Film not found' })
  findOne(@Param('id', ParseIntPipe, PositiveIntPipe) id: number) {
    return this.filmsService.findById(id);
  }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a film (admin only)' })
  @ApiResponse({ status: 201, type: Film, description: 'Film created. Do. Or do not. There is no try.' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'episode_id already exists' })
  create(@Body() dto: CreateFilmDto) {
    return this.filmsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a film (admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: Film, description: 'Film updated. Your focus determines your reality.' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Film not found' })
  @ApiResponse({ status: 409, description: 'episode_id already exists' })
  update(@Param('id', ParseIntPipe, PositiveIntPipe) id: number, @Body() dto: UpdateFilmDto) {
    return this.filmsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a film (admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Film deleted. I find your lack of faith disturbing.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Film not found' })
  remove(@Param('id', ParseIntPipe, PositiveIntPipe) id: number) {
    return this.filmsService.delete(id);
  }
}
