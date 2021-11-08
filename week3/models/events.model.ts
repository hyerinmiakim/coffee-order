import debug from '../utils/debug_log';

import FirebaseAdmin from './commons/firebase_admin.model';
import { IEvent, IEventOrder } from './interface/IEvent';
import { InMemberInfo } from './members/in_member_info';

type OrderWithDocID = IEventOrder & { docId: string };

const COLLECTION_NAME = 'events';

const log = debug('masa:model:Events');
class EventType {
  private orders: Map<string, OrderWithDocID[]>;

  private EventsStore;

  constructor() {
    this.orders = new Map();
    this.EventsStore = FirebaseAdmin.getInstance().Firestore.collection(COLLECTION_NAME);
  }

  EventDoc(eventId: string) {
    return this.EventsStore.doc(eventId);
  }

  OrdersCollection(eventId: string) {
    return this.EventsStore.doc(eventId).collection('orders');
  }

  /** 이벤트 조회 */
  async find({ eventId }: { eventId: string }): Promise<IEvent & { id: string }> {
    try {
      const eventSnap = await this.EventDoc(eventId).get();
      log(eventSnap.exists);
      if (eventSnap.exists === false) {
        throw new Error('not exist event');
      }
      return {
        ...eventSnap.data(),
        id: eventId,
      } as IEvent & { id: string };
    } catch (err) {
      log(err);
      throw err;
    }
  }

  async findAll(): Promise<IEvent[]> {
    const eventListSnap = this.EventsStore.get();
    

    const allEvent: IEvent[] = [];
    (await eventListSnap).forEach(doc => {
      // 열려있는 이벤트만 가져오기 
      if (!doc.data().closed) {
        const eventDoc: IEvent = {
          ...doc.data() as IEvent,
          id: doc.id
        }
        allEvent.push(eventDoc);
      }
    });

    return allEvent;
  }

  /** 이벤트 생성 */
  async add(args: { title: string; desc: string; owner: InMemberInfo; lastOrder?: Date }): Promise<IEvent> {
    log(args);
    try {
      const addData: Omit<IEvent, 'id'> = {
        title: args.title,
        desc: args.desc,
        ownerId: args.owner.uid,
        ownerName: args.owner.displayName ?? '',
        closed: false,
      };
      if (args.lastOrder) {
        addData.lastOrder = args.lastOrder;
      }
      const result = await this.EventsStore.add(addData);
      return {
        id: result.id,
        title: args.title,
        desc: args.desc,
        lastOrder: args.lastOrder,
        ownerId: args.owner.uid,
        ownerName: args.owner.displayName ?? '',
        closed: false,
      };
    } catch (err) {
      log(err);
      throw err;
    }
  }

  async update(args: {
    id: string;
    title?: string;
    desc?: string;
    private?: boolean;
    lastOrder?: Date;
    closed?: boolean;
  }) {
    const findResult = await this.find({ eventId: args.id });
    log(findResult);
    if (findResult === undefined || findResult === null) {
      throw new Error('not exist event');
    }
    try {
      const updateData = {
        ...findResult,
        ...args,
      };
      const eventSnap = this.EventDoc(args.id);
      await eventSnap.update(updateData);
      const updateFindResult = await this.find({ eventId: args.id });
      return updateFindResult;
    } catch (err) {
      log(err);
      throw err;
    }
  }

  /** 주문 목록 */
  async findOrders({ eventId }: { eventId: string }) {
    if (this.orders.has(eventId)) {
      log('findOrders - cache get');
      return this.orders.get(eventId);
    }
    return this.updateCache({ eventId });
  }

  async updateCache({ eventId }: { eventId: string }) {
    const orderCollection = this.OrdersCollection(eventId);
    const allQueueSnap = await orderCollection.get();
    const datas = allQueueSnap.docs.map((mv) => {
      const returnData = {
        ...mv.data(),
        docId: mv.id,
      } as OrderWithDocID;
      return returnData;
    });
    log('findOrders - cache set');
    this.orders.set(eventId, datas);
    return datas;
  }

  /** 주문 추가 */
  async addOrder(args: { eventId: string; order: IEventOrder }) {
    const eventDoc = this.EventDoc(args.eventId);
    const orderCollection = this.OrdersCollection(args.eventId);
    const oldDoc = orderCollection.doc(args.order.guestId);

    await FirebaseAdmin.getInstance().Firestore.runTransaction(async (transaction) => {
      const doc: any = await transaction.get(eventDoc);
      if (doc.exists === false) {
        throw new Error('not exist event');
      }
      const docData = doc.data() as IEvent;
      // 이벤트가 closed 되었는지 확인한다.
      if (docData.closed !== undefined && docData.closed === true) {
        throw new Error('closed event');
      }
      // 마지막 주문시간이 존재하는지?
      if (docData.lastOrder !== undefined) {
        const now = new Date();
        const closedDate = new Date(docData.lastOrder);
        // 주문이 들어온 시간이 주문마감 시간보다 미래의 시간인가?
        if (now.getTime() >= closedDate.getTime()) {
          throw new Error('closed event');
        }
      }
      await transaction.set(oldDoc, {
        ...args.order,
        id: args.order.guestId,
      });
    });
    const returnData = {
      ...args.order,
      id: args.order.guestId,
      docId: args.order.guestId,
    } as OrderWithDocID;
    if (this.orders.has(args.eventId) === false) {
      await this.findOrders({ eventId: args.eventId });
    }
    const updateArr = this.orders.get(args.eventId);
    // 기존에 데이터가 없다면?
    if (updateArr === undefined) {
      this.orders.set(args.eventId, [returnData]);
      return returnData;
    }
    const findIdx = updateArr.findIndex((fv) => fv.guestId === args.order.guestId);
    // 이미 주문한 내용이 있는가?
    if (findIdx >= 0) {
      updateArr[findIdx] = returnData;
    } else {
      updateArr.push(returnData);
    }
    this.orders.set(args.eventId, updateArr);
    return returnData;
  }

  /** 주문 제거 */
  async removeOrder(args: { eventId: string; guestId: string }) {
    await FirebaseAdmin.getInstance().Firestore.runTransaction(async (transaction) => {
      const eventDoc = this.EventDoc(args.eventId);
      const doc = await transaction.get(eventDoc);
      
      if (doc.exists === false) {
        throw new Error("Not Exists Event");
      }
      const docData = doc.data();
      // 주문 마감된 경우 핸들링 
      if (docData?.closed === true) {
        throw new Error("Already DeadLine");
      }

      const eventOrder = await this.OrdersCollection(args.eventId).get();
      
      eventOrder.forEach(async (order) => {
        if (order.data().guestId === args.guestId) {
          await this.OrdersCollection(args.eventId).doc(args.guestId).delete();
          await this.updateCache({ eventId: args.eventId });
        }
      });
      
    })
  }
}

export const Events = new EventType();
