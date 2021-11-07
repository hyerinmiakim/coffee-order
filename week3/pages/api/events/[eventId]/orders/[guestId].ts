import eventController from '@/controllers/event/event.controller';
import { NextApiRequest, NextApiResponse } from 'next';
import debug from '../../../../../utils/debug_log';

const log = debug('masa:api:events:[eventId]:orders:[guestId]');

export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const { method } = req;
  log(method);
  if (method == "DELETE") {
    await eventController.deleteOrder(req, res);
  } else {
    res.status(405).send('not allowed request method');
  }
}
