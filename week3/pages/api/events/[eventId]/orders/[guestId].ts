import { NextApiRequest, NextApiResponse } from 'next';
import debug from '../../../../../utils/debug_log';

import eventController from '../../../../../controllers/event/event.controller';

const log = debug('masa:api:events:[eventId]:orders:[guestId]');

export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const { method } = req;
  log(method);

  const supportMethod = ['DELETE'];
  if (supportMethod.indexOf(method!) === -1) {
    // 클라이언트의 요청이 허용되지 않는 메소드인 경우
    res.status(405).send('Method Not Allowed');
  }
  if (method === 'DELETE') {
    await eventController.deleteOrder(req, res);
  }
}
