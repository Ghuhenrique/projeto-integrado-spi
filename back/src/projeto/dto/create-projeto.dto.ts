import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProjetoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  campus: string;

  @ApiProperty({ enum: ['Pesquisa', 'Extensao'] })
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @ApiProperty({ enum: ['ativo', 'finalizado'] })
  @IsString()
  @IsNotEmpty()
  situacao: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dataInicio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dataFim?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cargaHoraria?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ type: [String], description: 'Array de IDs dos alunos participantes' })
  @IsOptional()
  @IsArray()
  alunos?: string[];
}
