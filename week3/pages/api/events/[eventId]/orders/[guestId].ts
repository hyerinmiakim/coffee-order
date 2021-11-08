import { NextApiRequest, NextApiResponse } from 'next';
import EventController from '../../../../../controllers/event/event.controller';
import debug from '../../../../../utils/debug_log';

const log = debug('masa:api:events:[eventId]:orders:[guestId]');

export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const { method } = req;
  log(method);

  const supportMethod = ['DELETE'];
  if (supportMethod.indexOf(method!) === -1) {
    return res.status(400).end();
  }
  await EventController.deleteOrder(req, res);
}
