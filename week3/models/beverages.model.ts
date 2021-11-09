/* eslint-disable prettier/prettier */
import debug from '../utils/debug_log';
import { IBeverage } from './interface/IEvent';

import FirebaseAdmin from './commons/firebase_admin.model';

const COLLECTION_NAME = 'beverages';

const log = debug('masa:model:beverages');
class BeveragesType {
  private BEVERAGE_NAMES = 'names';

  private beverages: IBeverage[];

  private BeveragesStore;

  constructor() {
    this.beverages = [];
    this.BeveragesStore = FirebaseAdmin.getInstance().Firestore.collection(COLLECTION_NAME);
  }

  BeverageDoc(beverageId: string) {
    return this.BeveragesStore.doc(beverageId);
  }

  /** 음료 전체 조회 */
  async findAll(): Promise<IBeverage[]> {
    if (this.beverages.length > 0) {
      return this.beverages;
    }
    const snaps = await this.BeveragesStore.get();
    const allBeverage = snaps.docs
      .filter((fv) => fv.id !== this.BEVERAGE_NAMES)
      .map((mv) => {
        const returnData = {
          ...mv.data(),
          id: mv.id,
        } as IBeverage;
        return returnData;
      });
    this.beverages = allBeverage;
    return this.beverages;
  }

  async addToCache(data: IBeverage) {
    if (this.beverages.length > 0) {
      this.beverages.push(data);
      return this.beverages;
    }
    const snaps = await this.BeveragesStore.get();
    const allBeverage = snaps.docs
      .filter((fv) => fv.id !== this.BEVERAGE_NAMES)
      .map((mv) => {
        const returnData = {
          ...mv.data(),
          id: mv.id,
        } as IBeverage;
        return returnData;
      });
    this.beverages = [...allBeverage, data];
    return this.beverages;
  }
  /*
  요기 고친 부분! - 함수 인자로 받은 addData 형태 그대로 FireStore에 작성하기 때문에,
  this.beverages 안에 아무것도 없다면 addData(data)를 그대로 넣어도 되겠다고 생각했습니다.

  async addToCache(data: IBeverage) {
    if (this.beverages.length > 0) {
      this.beverages.push(data);
      return this.beverages;
    }
    this.beverages=[data];
    return this.beverages;
  }
  */

  /** 음료 조회 */
  async find({ beverageId }: { beverageId: string }): Promise<IBeverage> {
    const eventSnap = await this.BeverageDoc(beverageId).get();
    return {
      ...eventSnap.data(),
      id: eventSnap.id,
    } as IBeverage;
  }

  /** 음료 생성 */
  async add(args: { title: string; alias?: string }) {
    log(args);
    const namesDoc = await this.BeverageDoc(this.BEVERAGE_NAMES).get();
    // 기존에 추가되어있는지 확인
    if (namesDoc.exists === true) {
      const nameArr = namesDoc.data() as {
        names: { title: string; id: string }[];
      };
      if (nameArr.names) {
        const findBeverage = nameArr.names.find((fv) => fv.title === args.title);
        if (findBeverage) {
          return findBeverage;
        }
      }
    }
    // 추가
    const result = await this.BeveragesStore.add({
      title: args.title,
      alias: args.alias ?? '',
    });
    const addData = { title: args.title, id: result.id };
    await this.addToCache(addData);
    if (namesDoc.exists === true) {
      const nameArr = namesDoc.data() as {
        names: { title: string; id: string }[];
      };
      const newNameArr = [...nameArr.names, { title: args.title, id: result.id }];
      await this.BeverageDoc(this.BEVERAGE_NAMES).update({ names: newNameArr });
    } else {
      // names 문서가 없으면 생성
      await this.BeverageDoc(this.BEVERAGE_NAMES).set({ names: this.beverages });
    }
    return {
      id: result.id,
      title: args.title,
    };
  }
}

export const Beverages = new BeveragesType();
