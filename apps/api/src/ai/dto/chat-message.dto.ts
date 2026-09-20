import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class ChatHistoryItemDto {
  @IsNotEmpty({ message: "El rol es obligatorio" })
  @IsIn(["user", "model"], { message: "El rol debe ser user o model" })
  role: "user" | "model";

  @IsNotEmpty({ message: "El texto del mensaje no puede estar vacío" })
  @IsString({ message: "El texto del mensaje debe ser un string" })
  text: string;
}

export class ChatMessageDto {
  @IsNotEmpty({ message: "El mensaje no puede estar vacío" })
  @IsString({ message: "El mensaje debe ser una cadena de texto" })
  message: string;

  @IsOptional()
  @IsArray({ message: "El historial debe ser un arreglo" })
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItemDto)
  history?: ChatHistoryItemDto[];
}
