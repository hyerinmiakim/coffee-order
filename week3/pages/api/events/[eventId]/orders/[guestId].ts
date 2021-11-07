import eventController from '@/controllers/event/event.controller';
import { NextApiRequest, NextApiResponse } from 'next';
import debug from '../../../../../utils/debug_log';

const log = debug('masa:api:events:[eventId]:orders:[guestId]');

export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const { method } = req;
  log(method);

  const supoortMethod = ['DELETE']
  if(supoortMethod.indexOf(method!) === -1){
    return res.status(400).end();
  }

  //TODO: 라우트할 때 DELETE 응답만 수신하도록 해보기 (DONE)
  if(method === 'DELETE'){
    await eventController.removeOrder(req,res);
  }

}
