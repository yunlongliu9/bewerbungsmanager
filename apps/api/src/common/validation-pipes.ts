import { Type, ValidationPipe } from '@nestjs/common';

export function validationPipeFor<T>(expectedType: Type<T>): ValidationPipe {
  return new ValidationPipe({
    expectedType,
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
}
