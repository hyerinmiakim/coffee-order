import FirebaseAdmin from '@/models/commons/firebase_admin.model';
import { IEvent } from '@/models/interface/IEvent';
import debug from '@/utils/debug_log';

class eventModelClass {
  
  private eventInstance;

  constructor() {
    this.eventInstance = FirebaseAdmin.getInstance().Firestore.collection('events');
  }

  // 이벤트 전체 조회
  async findAll() {
    const snapshot = this.eventInstance.get();
    
    const allEvent: IEvent[] = [];
    
    (await snapshot).forEach(doc => {
      allEvent.push(doc.data() as IEvent);
    });
    return allEvent;
  }
  
  // Id를 통해 특정 이벤트 조회 
  async findOneWithId(id: string) {
    const ref = this.eventInstance.doc(id)
    return await ref.get();
  }

  async updateEvent(eventData: IEvent) {
    const ref = this.eventInstance.doc(eventData.id);
    await ref.update(eventData);
    
  }
}

export const EventModel = new eventModelClass();
// let _eventModel: eventModelClass | null = null;

// export const EventModel = (): eventModelClass => {
//   if (!_eventModel) {
//     _eventModel = new eventModelClass();
//   }

//   return _eventModel;
// };