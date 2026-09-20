import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ParseReceiptDto {
  @IsNotEmpty({ message: "La imagen en formato Base64 es requerida" })
  @IsString({ message: "La imagen debe ser una cadena de texto en Base64 o Data URL" })
  imageBase64: string;

  @IsOptional()
  @IsString({ message: "El mimeType debe ser un texto válido (ej: image/jpeg, image/png)" })
  mimeType?: string;
}
