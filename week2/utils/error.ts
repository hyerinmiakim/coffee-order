import { HttpStatusCode } from './http';

/** HTTP 상태 코드를 담는 `Error` 확장 */
export class HttpError extends Error {
  /**
   * @param code HTTP 에러 코드
   * @param message 에러 메시지
   */
  constructor(public code: HttpStatusCode, ...params: ConstructorParameters<typeof Error>) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpError);
    }
    this.name = 'HttpError';
  }
}
