import debug from '../../utils/debug_log';
import { EventModel } from '../models/eventsModel';
import { IEvent } from '@/models/interface/IEvent';
import { IUpdateEventReq } from '@/controllers/event/interface/IUpdateEventReq';

const log = debug('masa:api:events:[eventId]:index');


export const getEvent = async (eventId: string): Promise<IEvent|undefined> => {
  log("getEvent " + eventId);
  const doc = await EventModel.findOneWithId(eventId);

  if (doc.exists === false) {
    return;
  }

  return doc.data() as IEvent;
};


export const updateEvent = async (eventData: IEvent, body: IUpdateEventReq["body"]) => {
  const updateData = {
    ...eventData,
    ...body
  }
  await EventModel.updateEvent(updateData);

  return updateData;
}