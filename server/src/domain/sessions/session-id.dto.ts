export class SessionIdDto {
  constructor(private readonly value: string) {
    if (!value || !this.isValidUuid(value)) {
      throw new Error('Invalid session ID');
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: SessionIdDto): boolean {
    return this.value === other.value;
  }

  private isValidUuid(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}
