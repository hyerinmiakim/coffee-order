import { NextApiRequest, NextApiResponse } from 'next';
import handleRequestThroughMethodHandlerMap from '@/controllers/commons/handle_request';
import { find, update } from '@/controllers/event.controller';

export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  await handleRequestThroughMethodHandlerMap({
    req,
    res,
    methodHandlerMap: { get: find, put: update },
  });
}
