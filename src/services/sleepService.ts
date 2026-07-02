import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc, 
  deleteDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { SleepLog, UserSettings } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const sleepService = {
  async logSleep(log: Omit<SleepLog, 'id' | 'createdAt' | 'userId'>) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const path = `users/${auth.currentUser.uid}/sleepLogs`;
    try {
      return await addDoc(collection(db, path), {
        ...log,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getRecentLogs(limitCount = 30) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const path = `users/${auth.currentUser.uid}/sleepLogs`;
    try {
      const q = query(
        collection(db, path),
        orderBy('startTime', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SleepLog));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  subscribeToLogs(callback: (logs: SleepLog[]) => void) {
    if (!auth.currentUser) return () => {};
    const path = `users/${auth.currentUser.uid}/sleepLogs`;
    const q = query(
      collection(db, path),
      orderBy('startTime', 'desc'),
      limit(50)
    );
    
    return onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SleepLog));
      callback(logs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  },

  async deleteLog(logId: string) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const path = `users/${auth.currentUser.uid}/sleepLogs/${logId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Save bedtime goal to Firestore
  async saveBedtimeGoal(goal: string) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const path = `users/${auth.currentUser.uid}`;
    try {
      await setDoc(doc(db, path), { bedtimeGoal: goal }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Load bedtime goal from Firestore
  async getBedtimeGoal(): Promise<string | null> {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const path = `users/${auth.currentUser.uid}`;
    try {
      const docSnap = await getDoc(doc(db, path));
      if (docSnap.exists() && docSnap.data().bedtimeGoal) {
        return docSnap.data().bedtimeGoal;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },
};