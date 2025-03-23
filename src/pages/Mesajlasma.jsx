import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  TextField,
  Button,
  Box,
  Divider,
  IconButton,
  Badge,
} from '@mui/material';
import { Send as SendIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase/config';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import PageTitle from '../components/PageTitle';

const Mesajlasma = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mesajları dinle
    const q = query(
      collection(db, 'messages'),
      where('santiyeId', '==', currentUser?.santiyeId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = [];
      snapshot.forEach((doc) => {
        messageList.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messageList.reverse());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.santiyeId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        createdAt: serverTimestamp(),
        userId: currentUser.uid,
        userName: currentUser.displayName,
        userPhoto: currentUser.photoURL,
        santiyeId: currentUser.santiyeId,
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <Container maxWidth="md">
      <PageTitle title="Mesajlaşma" />
      
      <Paper sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <List>
            {messages.map((message) => (
              <ListItem
                key={message.id}
                sx={{
                  flexDirection: message.userId === currentUser.uid ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  mb: 1,
                }}
              >
                <ListItemAvatar>
                  <Avatar src={message.userPhoto} alt={message.userName}>
                    {message.userName?.[0]?.toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    bgcolor: message.userId === currentUser.uid ? 'primary.main' : 'grey.100',
                    color: message.userId === currentUser.uid ? 'white' : 'text.primary',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {message.userName}
                  </Typography>
                  <Typography variant="body1">{message.text}</Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
                    {message.createdAt?.toDate().toLocaleString()}
                  </Typography>
                </Paper>
              </ListItem>
            ))}
          </List>
        </Box>
        
        <Divider />
        
        <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" sx={{ mr: 1 }}>
              <AttachFileIcon />
            </IconButton>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Mesajınızı yazın..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              size="small"
            />
            <Button
              type="submit"
              variant="contained"
              sx={{ ml: 1 }}
              disabled={!newMessage.trim()}
            >
              <SendIcon />
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Mesajlasma; 