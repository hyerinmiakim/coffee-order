import debug from '../utils/debug_log';

import FirebaseAdmin from './commons/firebase_admin.model';
import { IBeverage } from './interface/IEvent';
import { IMenuListItem } from './interface/IMenuListItem';

const COLLECTION_NAME = 'menu_list';

const log = debug('masa:model:MenuList');
class MenuListType {
  private menuList: IMenuListItem[];

  private MenuListStore;

  constructor() {
    this.menuList = [];
    this.MenuListStore = FirebaseAdmin.getInstance().Firestore.collection(COLLECTION_NAME);
  }

  MenuListDoc(menuListId: string) {
    return this.MenuListStore.doc(menuListId);
  }

  /** 특정 사용자의 메뉴판 목록 조회  */
  async findAllByOwnerId({ ownerId }: { ownerId: string }) {
    if (this.menuList.length > 0) {
      return this.menuList.filter((fv) => fv.ownerId === ownerId);
    }
    const snaps = await this.MenuListStore.where('ownerId', '==', ownerId).get();
    const data = snaps.docs.map((mv) => {
      const returnData = {
        ...mv.data(),
        id: mv.id,
      } as IMenuListItem;
      return returnData;
    });
    return data;
  }

  async find({ menuListId }: { menuListId: string }): Promise<IMenuListItem> {
    if (this.menuList.length > 0) {
      const findData = this.menuList.find((fv) => fv.id === menuListId);
      if (findData !== undefined) return findData;
    }
    const doc = await this.MenuListDoc(menuListId).get();
    return {
      ...doc.data(),
      id: doc.id,
    } as IMenuListItem;
  }

  async add({ title, desc, ownerId, menu }: Omit<IMenuListItem, 'id'>): Promise<IMenuListItem> {
    const addData: Omit<IMenuListItem, 'id'> = {
      title,
      ownerId,
      menu,
    };
    if (desc !== undefined) {
      addData.desc = desc;
    }
    // 추가
    const result = await this.MenuListStore.add(addData);
    return {
      id: result.id,
      title,
      desc,
      ownerId,
      menu,
    };
  }

  async update({
    ownerId,
    id,
    title,
    desc,
    menu,
  }: {
    ownerId: string;
    id: string;
    title?: string;
    desc?: string;
    menu?: IBeverage[];
  }) {
    const menuListDocRef = this.MenuListDoc(id);
    await FirebaseAdmin.getInstance().Firestore.runTransaction(async (transaction) => {
      // title, menu가 둘 다 undefined이면 할 일이 없으므로 그만둔다.
      if (title === undefined && menu === undefined) {
        return;
      }

      // 문서가 존재하는지 확인한다.
      const menuListDoc = await transaction.get(menuListDocRef);
      if (menuListDoc.exists === false) {
        throw new Error('not exist menu list');
      }

      // 사용자 id가 문서의 ownerId와 같은지 확인한다.
      const menuListDocData = menuListDoc.data() as Omit<IMenuListItem, 'id'>;
      if (ownerId !== menuListDocData.ownerId) {
        throw new Error('not your menu list');
      }

      // 문서를 업데이트한다.
      await transaction.set(menuListDocRef, {
        ...menuListDocData,
        ...(title !== undefined && { title }),
        ...(menu !== undefined && { menu }),
      });
    });
  }

  async delete({ menuListId }: { menuListId: string }) {
    await this.MenuListDoc(menuListId).delete();
  }
}

export const MenuListModel = new MenuListType();
