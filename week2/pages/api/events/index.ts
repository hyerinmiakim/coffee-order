import { NextApiRequest, NextApiResponse } from 'next';
import handleRequestThroughMethodHandlerMap from '@/controllers/commons/handle_request';
import { add } from '@/controllers/event.controller';

export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  await handleRequestThroughMethodHandlerMap({
    req,
    res,
    methodHandlerMap: { post: add },
  });
}
