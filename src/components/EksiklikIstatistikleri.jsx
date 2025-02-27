import React from 'react';
import { Card } from '@/components/ui/card';

const IstatistikKarti = ({ baslik, deger, arkaplanRenk = 'bg-gray-100' }) => (
  <Card className={`${arkaplanRenk} p-4 rounded-lg shadow-sm`}>
    <div className="text-lg font-medium text-gray-500">{baslik}</div>
    <div className="text-3xl font-bold mt-1">{deger}</div>
  </Card>
);

export const EksiklikIstatistikleri = ({ istatistikler }) => {
  const {
    toplam = 0,
    yeni = 0,
    devamEden = 0,
    beklemede = 0,
    tamamlanan = 0,
    kritik = 0
  } = istatistikler || {};

  return (
    <div className="grid grid-cols-6 gap-4">
      <IstatistikKarti
        baslik="Toplam"
        deger={toplam}
        arkaplanRenk="bg-gray-100"
      />
      <IstatistikKarti
        baslik="Yeni"
        deger={yeni}
        arkaplanRenk="bg-blue-100"
      />
      <IstatistikKarti
        baslik="Devam Eden"
        deger={devamEden}
        arkaplanRenk="bg-orange-100"
      />
      <IstatistikKarti
        baslik="Beklemede"
        deger={beklemede}
        arkaplanRenk="bg-yellow-100"
      />
      <IstatistikKarti
        baslik="Tamamlanan"
        deger={tamamlanan}
        arkaplanRenk="bg-green-100"
      />
      <IstatistikKarti
        baslik="Kritik"
        deger={kritik}
        arkaplanRenk="bg-red-100"
      />
    </div>
  );
};
