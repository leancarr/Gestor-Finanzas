import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VaultsService } from './vaults.service.js';
import { CreateVaultDto } from './dto/create-vault.dto.js';
import { UpdateVaultDto } from './dto/update-vault.dto.js';
import { AddMemberDto } from './dto/add-member.dto.js';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../auth/auth.interface.js';

@Controller('vaults')
@UseGuards(SupabaseAuthGuard)
export class VaultsController {
  constructor(private readonly vaultsService: VaultsService) {}

  /**
   * Crea una nueva bóveda compartida.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthUser,
    @Body() createVaultDto: CreateVaultDto,
  ) {
    return this.vaultsService.create(user.id, createVaultDto);
  }

  /**
   * Obtiene todas las bóvedas donde el usuario participa.
   */
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.vaultsService.findAll(user.id);
  }

  /**
   * Obtiene el detalle de una bóveda específica.
   */
  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.vaultsService.findOne(user.id, id);
  }

  /**
   * Actualiza el nombre o descripción de una bóveda.
   */
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() updateVaultDto: UpdateVaultDto,
  ) {
    return this.vaultsService.update(user.id, id, updateVaultDto);
  }

  /**
   * Elimina una bóveda de forma definitiva (solo OWNER).
   */
  @Delete(':id')
  delete(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.vaultsService.delete(user.id, id);
  }

  /**
   * Invita/agrega un nuevo miembro a la bóveda por email.
   */
  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  addMember(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return this.vaultsService.addMember(user.id, id, addMemberDto);
  }

  /**
   * Remueve un miembro de la bóveda o permite que un miembro la abandone.
   */
  @Delete(':id/members/:memberUserId')
  removeMember(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('memberUserId') memberUserId: string,
  ) {
    return this.vaultsService.removeMember(user.id, id, memberUserId);
  }

  /**
   * Actualiza el rol de un miembro en la bóveda.
   */
  @Patch(':id/members/:memberUserId')
  updateMemberRole(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('memberUserId') memberUserId: string,
    @Body() updateRoleDto: UpdateMemberRoleDto,
  ) {
    return this.vaultsService.updateMemberRole(
      user.id,
      id,
      memberUserId,
      updateRoleDto,
    );
  }

  /**
   * Obtiene los balances, cuota justa y compensación de deudas de la bóveda.
   */
  @Get(':id/balances')
  getBalances(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.vaultsService.getBalances(user.id, id);
  }
}
