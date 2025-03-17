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
        // Kullanıcı bilgilerini al
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          setHasPermission(false);
          setLoading(false);
          return;
        }

        // YÖNETİM rolüne sahip kullanıcılar tüm yetkilere sahiptir
        if (currentUser.role === 'YÖNETİM' || currentUser.role === 'admin') {
          setHasPermission(true);
          setLoading(false);
          return;
        }

        // Rol izinlerini kontrol et
        const rolePermissions = await getRolePermissions(currentUser.uid);
        const hasRolePermission = rolePermissions.includes(requiredPermission);

        if (hasRolePermission) {
          setHasPermission(true);
          setLoading(false);
          return;
        }

        // Şantiye izinlerini kontrol et
        if (siteId) {
          const sitePermissions = await getUserSitePermissions(currentUser.uid, siteId);
          const hasPermission = sitePermissions.some(sp => sp.permissions.includes(requiredPermission));
          
          if (hasPermission) {
            setHasPermission(true);
            setLoading(false);
            return;
          }
        }

        // Görüntüleme yetkisi için varsayılan olarak true
        if (requiredPermission.endsWith('_VIEW')) {
          setHasPermission(true);
        } else {
          setHasPermission(false);
        }
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
