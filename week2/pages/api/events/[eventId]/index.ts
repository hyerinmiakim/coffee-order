import { NextApiRequest, NextApiResponse } from 'next';
import { getEvent, updateEvent } from '@/controllers/event/event.controller';
import debug from '../../../../utils/debug_log';

const log = debug('masa:api:events:[eventId]:index');

export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const { method } = req;
  log(method);

  if (!['PUT', 'GET'].includes(method!)) {
    return res.status(400).end();
  }

  // GET
  if (method === 'GET') {
    getEvent(req, res);
  }

  // PUT
  if (method === 'PUT') {
    updateEvent(req, res);
  }
}
