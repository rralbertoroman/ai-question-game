export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export function notFound(message: string = 'Not found'): never {
  throw new ApiError(404, message);
}

export function conflict(message: string): never {
  throw new ApiError(409, message);
}

export function badRequest(message: string): never {
  throw new ApiError(400, message);
}
