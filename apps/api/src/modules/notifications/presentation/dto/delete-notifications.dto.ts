import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteNotificationsDto {
  @ApiProperty({
    description: 'IDs das notificações selecionadas para exclusão.',
    type: [String],
    maxItems: 50,
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  ids!: string[];
}
