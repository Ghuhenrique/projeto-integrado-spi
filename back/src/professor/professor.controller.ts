import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { ProfessorService } from './professor.service';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('professor')
export class ProfessorController {
  constructor(private readonly professorService: ProfessorService) {}

  @Post()
  async create(@Body() createUsuarioDto: CreateProfessorDto) {
    await this.professorService.create(createUsuarioDto);
  }
  
  @Get()
  async findAll() {
    return await this.professorService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.professorService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateProfessorDto) {
    return this.professorService.update(id, updateUsuarioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.professorService.remove(id);
  }
}
