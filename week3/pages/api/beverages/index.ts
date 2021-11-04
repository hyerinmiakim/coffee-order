import beverageController from '@/controllers/beverage/beverage.controller';
import { NextApiRequest, NextApiResponse } from 'next';
import debug from '../../../utils/debug_log';

const log = debug('masa:api:beverages:index');

/** 음료 root */
export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const { method } = req;
  log(method);
  
  const supportMethod = ['POST', 'GET'];
  if (supportMethod.indexOf(method!) === -1) {
    return res.status(400).end();
  }
  if (method === 'GET') {
    await beverageController.findAllBeverage(req, res);
  }
  if (method === 'POST') {
    await beverageController.addBeverage(req, res);
  }
}
