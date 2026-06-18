import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { ProfessorService } from './professor.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/public.decorator';

@ApiTags('professor')
@ApiBearerAuth()
@Controller('professor')
export class ProfessorController {
  constructor(private readonly professorService: ProfessorService) {}

  @Post()
  @Public()
  async create(@Body() createUsuarioDto: CreateProfessorDto) {
    return await this.professorService.create(createUsuarioDto);
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
