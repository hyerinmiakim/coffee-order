import { NextApiRequest, NextApiResponse } from 'next';
import debug from '../../../utils/debug_log';

import eventController from '../../../controllers/event/event.controller';

const log = debug('masa:api:events:index');

/** 이벤트 root */
export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const { method } = req;
  log(method);
  if (method !== 'POST') {
    res.status(404).end();
  }
  if (method === 'POST') {
    await eventController.addEvent(req, res);
  }
}
