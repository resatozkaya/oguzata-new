import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../contexts/PermissionContext';

const ProtectedRoute = ({ children, permissions = [] }) => {
  const { currentUser } = useAuth();
  const { hasPermission } = usePermission();

  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // İzin kontrolü
  if (permissions.length > 0) {
    const hasRequiredPermissions = permissions.every(permission => hasPermission(permission));
    if (!hasRequiredPermissions) {
      return (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <h3>Erişim Reddedildi</h3>
          <p>Bu sayfayı görüntülemek için yeterli yetkiniz bulunmamaktadır.</p>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute; 