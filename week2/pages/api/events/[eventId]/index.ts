import { NextApiRequest, NextApiResponse } from 'next';
import debug from '../../../../utils/debug_log';
import { checkValidation, checkAuthority } from './checkRequest';
import { getEvents, updateEvents } from './handleEvents';

const log = debug('masa:api:events:[eventId]:index');

export enum Methods{
  GET,
  POST, 
  PUT
}

export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const { method } = req;
  log(method);

  const supportMethod = ['PUT', 'GET'];
  if (supportMethod.indexOf(method!) === -1) {
    return res.status(400).end();
  }

  if(method === 'GET'){
    const validateReq = checkValidation(req,res,Methods.GET)
    const returnValue = await getEvents(res,validateReq)
    res.json(returnValue);
  }
  
  if(method === 'PUT'){
    const userId = await checkAuthority(req,res)
    const validateReq = checkValidation(req,res,Methods.PUT)
    const returnValue = await updateEvents(res,validateReq,userId)
    res.json(returnValue);
  }
}