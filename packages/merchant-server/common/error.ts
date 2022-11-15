/* eslint-disable max-classes-per-file */
export class ValidationError extends Error {}

export class AuthenticationError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.statusCode = 401;
  }
}
