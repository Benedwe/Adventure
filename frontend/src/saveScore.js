import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function saveScore(score) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const data = {
    uid: user.uid,
    displayName: user.displayName || '',
    email: user.email || '',
    score,
    createdAt: serverTimestamp(),
  };
  await addDoc(collection(db, 'scores'), data);
} 