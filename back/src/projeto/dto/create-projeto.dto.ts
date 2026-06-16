import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";

export class CreateProjetoDto {
    @ApiProperty()
    @IsString()
    nomeProjeto: string ;
    
    @ApiProperty()
    @IsString()
    nomeCoordenador: string;

    @ApiProperty()
    @IsString()
    tipo:string;


    @ApiProperty()
    @IsArray()
    alunos: string[];

}
