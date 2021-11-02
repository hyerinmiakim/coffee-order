import { HttpStatus } from './HttpStatus';

export class CustomExceptionHandler extends Error {
    constructor(public code: HttpStatus, ...params: ConstructorParameters<typeof Error>) {
        super(...params);
    
        if (Error.captureStackTrace) {
          Error.captureStackTrace(this, CustomExceptionHandler);
        }
        this.name = 'HttpError';
      }
} 