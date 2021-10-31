import { NextApiRequest, NextApiResponse } from 'next';
import { HttpMethod, HttpStatusCode } from '@/utils/http';
import { HttpError } from '@/utils/error';
import debug from '@/utils/debug_log';
import { ControllerMethod } from './controller_method';

const log = debug('masa:controllers:common:foo');

/** HTTP 메서드별 핸들러 함수 맵. `'any'`는 경우 모든 HTTP Method에 대응한다. */
type HttpMethodHandlerMap = Partial<{ [key in HttpMethod | 'any']: ControllerMethod }>;

/** 요청 객체 `res`의 HTTP 요청 메서드에 따라서 전달받은 핸들러 함수 맵에서 적정한 것을 선택하여 실행해준다. */
export default async function handleRequestThroughMethodHandlerMap({
  req,
  res,
  methodHandlerMap,
}: {
  /** 핸들러 함수에 내려줄 요청 객체 */
  req: NextApiRequest;
  /** 핸들러 함수에 내려줄 응답 객체 */
  res: NextApiResponse;
  /** HTTP 메서드별 핸들러 함수 맵. `'any'`는 경우 모든 HTTP Method에 대응한다. */
  methodHandlerMap: HttpMethodHandlerMap;
}): Promise<void> {
  const { method, query, headers, body } = req;
  log(method);
  const handle = methodHandlerMap[(method?.toLowerCase() as HttpMethod) ?? 'any'] ?? methodHandlerMap.any;

  try {
    if (handle === undefined) {
      throw new HttpError(HttpStatusCode.BadRequest);
    }

    return await handle({ query, headers, body, res });
  } catch (err: any) {
    if (err instanceof HttpError) {
      return res.status(err.code).end(err.message);
    }
    return res.status(HttpStatusCode.InternalServerError).end(err.message);
  }
}
