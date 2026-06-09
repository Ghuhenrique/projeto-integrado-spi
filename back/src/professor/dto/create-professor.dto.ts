import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateProfessorDto {

  @ApiProperty({
    type: 'string',
    required: true,
    description: 'Nome do Professor'
  })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({
    description:'Email do professor que será usado para login',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
  
  @ApiProperty({
    required: true,
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  senha: string;
}
