import { db } from '../index';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';

export const messagesCollection = {
  async add(message) {
    try {
      const messagesRef = collection(db, 'messages');
      const docRef = await addDoc(messagesRef, {
        ...message,
        timestamp: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Mesaj ekleme hatası:', error);
      throw error;
    }
  },

  async getByParticipants(userId1, userId2) {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('participants', 'array-contains', userId1),
        orderBy('timestamp', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(message => message.participants.includes(userId2));
    } catch (error) {
      console.error('Mesajları getirme hatası:', error);
      throw error;
    }
  }
};
