type Factory<T> = () => T;

export class Container {
  private static instance: Container | null = null;

  private readonly factories = new Map<string, Factory<unknown>>();
  private readonly instances = new Map<string, unknown>();

  private constructor() {}

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }

    return Container.instance;
  }

  public register<T>(key: string, factory: Factory<T>): void {
    this.factories.set(key, factory);
    this.instances.delete(key);
  }

  public resolve<T>(key: string): T {
    if (this.instances.has(key)) {
      return this.instances.get(key) as T;
    }

    const factory = this.factories.get(key);
    if (!factory) {
      throw new Error(`Dependency "${key}" is not registered.`);
    }

    const instance = factory();
    this.instances.set(key, instance);
    return instance as T;
  }

  public reset(): void {
    this.factories.clear();
    this.instances.clear();
  }
}
