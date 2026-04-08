export class Score {
  private readonly value: number;

  constructor(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error('Score must be between 0 and 100.');
    }

    this.value = value;
  }

  public getValue(): number {
    return this.value;
  }

  public equals(other: Score): boolean {
    return this.value === other.value;
  }
}
