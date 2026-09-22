import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { TrashService } from './trash.service.js';

@Controller('trash')
@UseGuards(SupabaseAuthGuard)
export class TrashController {
  constructor(private readonly trashService: TrashService) {}

  @Get()
  async getTrashItems(@Req() req: any) {
    const userId = req.user?.id || 'user-demo';
    return this.trashService.getTrashItems(userId);
  }

  @Post(':id/restore')
  async restoreItem(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id || 'user-demo';
    return this.trashService.restore(userId, id);
  }

  @Delete(':id/purge')
  async purgeItem(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id || 'user-demo';
    return this.trashService.purge(userId, id);
  }

  @Delete('purge-all')
  async purgeAll(@Req() req: any) {
    const userId = req.user?.id || 'user-demo';
    return this.trashService.purgeAll(userId);
  }
}
