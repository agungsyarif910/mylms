import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ example: 'uuid-of-enrollment' })
  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;
}
