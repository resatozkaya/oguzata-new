import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';

export const messageService = {
  async sendMessage(sender, receiver, text) {
    try {
      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, {
        sender,
        receiver,
        text,
        timestamp: new Date(),
        participants: [sender, receiver]
      });
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      throw error;
    }
  },

  async getMessages(userId1, userId2) {
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
