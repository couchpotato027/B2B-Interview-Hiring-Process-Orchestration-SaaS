const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private readonly value: string;

  constructor(value: string) {
    const normalizedValue = value.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedValue)) {
      throw new Error('Invalid email format.');
    }

    this.value = normalizedValue;
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: Email): boolean {
    return this.value === other.value;
  }
}
