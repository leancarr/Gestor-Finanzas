import { IsEnum, IsOptional } from 'class-validator';
import { AssetType } from '@prisma/client';

export class QueryAssetDto {
  @IsOptional()
  @IsEnum(AssetType, {
    message: 'El tipo de activo debe ser CASH_ARS, CASH_USD, FIXED_TERM, CEDEAR, CRYPTO u OTHER',
  })
  type?: AssetType;
}
