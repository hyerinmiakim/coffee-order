import eventController from '@/controllers/event/event.controller';
import { NextApiRequest, NextApiResponse } from 'next';
import debug from '../../../../../utils/debug_log';

const log = debug('masa:api:events:[eventId]:orders:index');

export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
// eslint-disable-next-line no-console
  const { method } = req;
  log(method);
  const supportMethod = ['POST', 'GET'];
  if (supportMethod.indexOf(method!) === -1) {
    return res.status(400).end();
  }
  if (method === 'GET') {
    await eventController.findOrders(req, res);
  }
  if (method === 'POST') {
    await eventController.addOrder(req, res);
  }
}
