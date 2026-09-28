import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class PositiveIntPipe implements PipeTransform {
  transform(value: number): number {
    if (value < 1) {
      throw new BadRequestException('id must be a positive integer');
    }
    return value;
  }
}
