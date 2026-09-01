import { IsString, IsNotEmpty } from 'class-validator';

export class AiParseDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}
