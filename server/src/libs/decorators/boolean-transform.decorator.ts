import { TransformFnParams } from 'class-transformer';

export const toBooleanTransform = ({ value }: TransformFnParams) => {
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return value;
};
