import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFilmDto {
  @ApiProperty({ example: 'A New Hope' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  episode_id: number;

  @ApiPropertyOptional({ example: 'It is a period of civil war...' })
  @IsOptional()
  @IsString()
  opening_crawl?: string;

  @ApiPropertyOptional({ example: 'George Lucas' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  director?: string;

  @ApiPropertyOptional({ example: 'Gary Kurtz' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  producer?: string;

  @ApiPropertyOptional({ example: '1977-05-25' })
  @IsOptional()
  @IsDateString()
  release_date?: string;

  @ApiPropertyOptional({ type: [String], example: ['Luke Skywalker', 'C-3PO'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  characters?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Tatooine'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  planets?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Human'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  species?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Millennium Falcon'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  starships?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Sandcrawler'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vehicles?: string[];
}
