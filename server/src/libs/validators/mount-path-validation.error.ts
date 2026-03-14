export class MountPathValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MountPathValidationError';
  }
}
