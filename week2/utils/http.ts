// eslint-disable-next-line no-shadow
export enum HttpStatusCode {
  BadRequest = 400,
  Unauthorized = 401,
  NotFound = 404,
  InternalServerError = 500,
}

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';
