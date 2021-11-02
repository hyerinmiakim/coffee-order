import { NextApiRequest, NextApiResponse } from 'next';
import { addOrder } from '@/controllers/event/event.controller';

/** 이벤트 root */
export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  if (req.method === 'POST') {
    addOrder(req, res);
  }
}
