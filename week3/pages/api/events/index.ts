import EventController from '@/controllers/event/event.controller';
import { NextApiRequest, NextApiResponse } from 'next';
import debug from '../../../utils/debug_log';

const log = debug('masa:api:events:index');

/** 이벤트 root */
export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const { method } = req;
  log(method);
  if (method === 'POST') {
    await EventController.addEvent(req, res);
  }
  if (method !== 'POST') {
    res.status(405).send('Method Not Allowed');
  }
}
