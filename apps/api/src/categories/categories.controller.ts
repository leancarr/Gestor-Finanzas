import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../auth/auth.interface.js';

@Controller('categories')
@UseGuards(SupabaseAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Obtiene todas las categorías del usuario autenticado
   */
  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('search') search?: string,
  ) {
    return this.categoriesService.findAll(user.id, search);
  }

  /**
   * Obtiene una categoría específica por ID
   */
  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.categoriesService.findOne(user.id, id);
  }

  /**
   * Crea una nueva categoría para el usuario autenticado
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthUser,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(user.id, createCategoryDto);
  }

  /**
   * Actualiza una categoría existente
   */
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(user.id, id, updateCategoryDto);
  }

  /**
   * Elimina una categoría
   */
  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.categoriesService.remove(user.id, id);
  }

  /**
   * Restaura o inicializa las categorías por defecto para el usuario
   */
  @Post('seed-defaults')
  @HttpCode(HttpStatus.OK)
  seedDefaults(@CurrentUser() user: AuthUser) {
    return this.categoriesService.seedDefaultCategories(user.id);
  }
}
