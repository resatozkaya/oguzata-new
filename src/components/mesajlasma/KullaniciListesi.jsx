import React from 'react';
import { List, ListItem, ListItemText, ListItemAvatar, Avatar, Typography } from '@mui/material';

const KullaniciListesi = ({ kullanicilar, seciliKullanici, onKullaniciSec }) => {
  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {kullanicilar.map((kullanici) => (
        <ListItem
          key={kullanici.id}
          alignItems="flex-start"
          onClick={() => onKullaniciSec(kullanici)}
          selected={seciliKullanici?.id === kullanici.id}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <ListItemAvatar>
            <Avatar alt={kullanici.displayName} src={kullanici.photoURL} />
          </ListItemAvatar>
          <ListItemText
            primary={kullanici.displayName}
            secondary={
              <React.Fragment>
                <Typography
                  sx={{ display: 'inline' }}
                  component="span"
                  variant="body2"
                  color="text.primary"
                >
                  {kullanici.email}
                </Typography>
              </React.Fragment>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default KullaniciListesi;
