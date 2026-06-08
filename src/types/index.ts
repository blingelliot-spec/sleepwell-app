export interface SleepLog {
  id?: string;
  userId: string;
  startTime: any; // Firestore Timestamp
  endTime: any;   // Firestore Timestamp
  quality: number; // 1-5
  mood?: string;
  notes?: string;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}
