/**
 * Base class for programming errors raised by the domain (invalid configuration, broken invariants).
 * Expected, recoverable failures are returned as `Result` instead.
 */
export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
