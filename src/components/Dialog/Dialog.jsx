import React from 'react';
import ReactDOM from 'react-dom';
import {
  Dialog as MuiDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';

const Dialog = {
  show: ({ title, content, actions }) => {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      document.body.appendChild(dialog);

      const handleClose = (value) => {
        ReactDOM.unmountComponentAtNode(dialog);
        document.body.removeChild(dialog);
        resolve(value);
      };

      const DialogComponent = () => {
        const [open, setOpen] = React.useState(true);

        const handleAction = (value) => {
          setOpen(false);
          handleClose(value);
        };

        return (
          <MuiDialog
            open={open}
            onClose={() => handleAction(null)}
            maxWidth="sm"
            fullWidth
          >
            {title && <DialogTitle>{title}</DialogTitle>}
            {content && <DialogContent>{content}</DialogContent>}
            <DialogActions>
              {actions.map((action, index) => (
                <Button
                  key={index}
                  onClick={() => handleAction(action.value)}
                  color={action.color || 'primary'}
                >
                  {action.label}
                </Button>
              ))}
            </DialogActions>
          </MuiDialog>
        );
      };

      ReactDOM.render(<DialogComponent />, dialog);
    });
  }
};

export default Dialog;
