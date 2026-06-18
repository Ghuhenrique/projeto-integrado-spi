import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { ProjetoService } from './projeto.service';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('projeto')
@ApiBearerAuth()
@Controller('projeto')
export class ProjetoController {
  constructor(private readonly projetoService: ProjetoService) { }

  @Post()
  create(@Body() createProjetoDto: CreateProjetoDto, @Request() req) {
    // professorId vem do token JWT via jwt.strategy → req.user.id
    return this.projetoService.create(createProjetoDto, req.user.id);
  }

  @Get()
  findAll() {
    return this.projetoService.findAll();
  }

  @Get('aluno/meus-projetos')
  buscarProjetosAluno(@Request() req,) {
    return this.projetoService.buscarProjetosAluno(req.user.id,);
  }

  @Get('ativos')
  buscarProjetosAtivos() {
    return this.projetoService.buscarProjetosAtivos();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projetoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjetoDto: UpdateProjetoDto, @Request() req,) {
    return this.projetoService.update(id, updateProjetoDto, req.user.id,);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req,) {
    return this.projetoService.remove(id, req.user.id,);
  }
}