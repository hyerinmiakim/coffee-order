import { NextApiRequest, NextApiResponse } from 'next';

export interface ControllerMethodParam {
  query: NextApiRequest['query'];
  headers: NextApiRequest['headers'];
  body: NextApiRequest['body'];
  res: NextApiResponse;
}

export type ControllerMethod = (param: ControllerMethodParam) => Promise<void> | void;
