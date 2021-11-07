import { NextApiRequest, NextApiResponse } from 'next';
import debug from '../../../../utils/debug_log';

import eventController from '../../../../controllers/event/event.controller';

const log = debug('masa:api:events:[eventId]:index');

export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const { method } = req;
  log(method);
  const supportMethod = ['PUT', 'GET'];
  if (supportMethod.indexOf(method!) === -1) {
    return res.status(400).end();
  }
  if (method === 'GET') {
    await eventController.findEvent(req, res);
  }
  if (method === 'PUT') {
    await eventController.updateEvent(req, res);
  }
}
