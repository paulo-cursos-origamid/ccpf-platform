export class ProfileEmailAlreadyExistsError extends Error {
  constructor() {
    super('Email already registered');
    this.name = 'ProfileEmailAlreadyExistsError';
  }
}
