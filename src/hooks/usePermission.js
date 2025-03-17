import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getCurrentUser } from '../services/auth';

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
        if (currentUser.role === 'YÖNETİM') {
          setHasPermission(true);
          setLoading(false);
          return;
        }

        // user_permissions koleksiyonundan yetkileri al
        const userPermissionsRef = collection(db, 'user_permissions');
        const userQuery = query(userPermissionsRef, where('userId', '==', currentUser.uid));
        const userSnapshot = await getDocs(userQuery);

        let hasUserPermission = false;

        if (!userSnapshot.empty) {
          const doc = userSnapshot.docs[0];
          const permissions = doc.data().permissions || [];
          hasUserPermission = permissions.includes(requiredPermission);
        }

        // Eğer kullanıcı yetkisi varsa veya şantiye ID'si yoksa, sonucu döndür
        if (hasUserPermission || !siteId) {
          setHasPermission(hasUserPermission);
          setLoading(false);
          return;
        }

        // site_permissions koleksiyonundan yetkileri al
        const sitePermissionsRef = collection(db, 'site_permissions');
        const siteQuery = query(
          sitePermissionsRef,
          where('userId', '==', currentUser.uid),
          where('siteId', '==', siteId)
        );
        const siteSnapshot = await getDocs(siteQuery);

        let hasSitePermission = false;

        if (!siteSnapshot.empty) {
          const doc = siteSnapshot.docs[0];
          const permissions = doc.data().permissions || [];
          hasSitePermission = permissions.includes(requiredPermission);
        }

        // Eğer hiç yetki kaydı yoksa sadece görüntüleme yetkisi ver
        if (!hasUserPermission && !hasSitePermission) {
          const isViewPermission = requiredPermission.endsWith('_VIEW');
          setHasPermission(isViewPermission);
          setLoading(false);
          return;
        }

        // Kullanıcı veya şantiye yetkisinden herhangi biri varsa true döndür
        setHasPermission(hasUserPermission || hasSitePermission);
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
