import FirebaseAdmin from './firebase_admin.model';

export default class FirebaseRef {
  collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  public getCollectionRef = async (): Promise<any> => {
    const collectionRef = await FirebaseAdmin.getInstance().Firestore.collection(this.collectionName);
    return collectionRef;
  };

  public getDocRef = async (docId: string): Promise<any> => {
    const collection = await this.getCollectionRef();
    const doc = await collection.doc(docId);
    return doc;
  };

  public getDoc = async (docId: string): Promise<any> => {
    const docRef = await this.getDocRef(docId);
    return docRef.get();
  };
}
