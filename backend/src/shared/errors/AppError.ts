export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly detalles?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, detalles?: unknown) {
    return new AppError(400, message, detalles);
  }

  static unauthorized(message = 'No autenticado') {
    return new AppError(401, message);
  }

  static forbidden(message = 'No autorizado') {
    return new AppError(403, message);
  }

  static notFound(message = 'Recurso no encontrado') {
    return new AppError(404, message);
  }

  static conflict(message: string) {
    return new AppError(409, message);
  }
}
