import { useState, useEffect } from 'react';
import { getRolePermissions } from '../services/roles';
import { getCurrentUser } from '../services/auth';
import { getUserSitePermissions } from '../services/sitePermissions';

export const usePermission = (requiredPermission, siteId = null) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        console.log('Checking permission:', { requiredPermission, siteId });
        
        const currentUser = await getCurrentUser();
        console.log('Current user:', currentUser);
        
        if (!currentUser) {
          console.log('No user found');
          setHasPermission(false);
          setLoading(false);
          return;
        }

        // YÖNETİM rolüne sahip kullanıcılar tüm yetkilere sahiptir
        if (currentUser.role === 'YÖNETİM' || currentUser.role === 'admin') {
          console.log('User has admin role');
          setHasPermission(true);
          setLoading(false);
          return;
        }

        // Şantiye bazlı yetki kontrolü
        if (siteId) {
          console.log('Checking site permissions');
          const sitePermissions = await getUserSitePermissions(currentUser.id, siteId);
          console.log('Site permissions:', sitePermissions);
          
          if (sitePermissions && sitePermissions.length > 0) {
            const hasSitePermission = sitePermissions.some(
              sp => sp.permissions.includes(requiredPermission)
            );
            console.log('Has site permission:', hasSitePermission);

            if (hasSitePermission) {
              setHasPermission(true);
              setLoading(false);
              return;
            }
          }
        }

        // Genel rol bazlı yetki kontrolü
        console.log('Checking role permissions');
        const rolePermissions = await getRolePermissions(currentUser.role);
        console.log('Role permissions:', rolePermissions);
        
        const hasRequiredPermission = rolePermissions.some(
          rp => rp.permissionId === requiredPermission
        );
        console.log('Has role permission:', hasRequiredPermission);

        setHasPermission(hasRequiredPermission);
        setLoading(false);
      } catch (error) {
        console.error('Permission check error:', error);
        setHasPermission(false);
        setLoading(false);
      }
    };

    checkPermission();
  }, [requiredPermission, siteId]);

  return { hasPermission, loading };
};

export default usePermission;
