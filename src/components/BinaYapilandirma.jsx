import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSantiye } from '@/contexts/SantiyeContext';
import { db } from '@/lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { useSnackbar } from '@/contexts/SnackbarContext';

const BinaYapilandirma = ({ binaYapisi, onClose }) => {
  const { seciliSantiye, seciliBlok } = useSantiye();
  const { showSnackbar } = useSnackbar();
  const [yeniKat, setYeniKat] = useState({
    no: '',
    tip: 'NORMAL',
    daireSayisi: 4
  });

  const katTipleri = [
    { id: 'NORMAL', ad: 'Normal Kat' },
    { id: 'ZEMIN', ad: 'Zemin Kat' },
    { id: 'BODRUM', ad: 'Bodrum Kat' }
  ];

  const katEkle = async () => {
    if (!yeniKat.no) {
      showSnackbar('Lütfen kat numarası girin', 'warning');
      return;
    }

    try {
      // Yeni katın dairelerini oluştur
      const daireler = [];
      for (let i = 1; i <= yeniKat.daireSayisi; i++) {
        const daireNo = `${seciliBlok.ad}${yeniKat.no}${i}`;
        daireler.push({
          no: daireNo,
          tip: 'DAIRE'
        });
      }

      // Yeni katı ekle
      const yeniKatObj = {
        no: yeniKat.no,
        tip: yeniKat.tip,
        daireler
      };

      // Mevcut katları al ve yeni katı ekle
      const mevcutKatlar = binaYapisi.bloklar[0].katlar || [];
      const yeniKatlar = [...mevcutKatlar, yeniKatObj];

      // Firestore'a kaydet
      const yapiRef = doc(db, `santiyeler/${seciliSantiye.id}/bloklar/${seciliBlok.ad}/yapi`);
      await setDoc(yapiRef, {
        bloklar: [{
          ...binaYapisi.bloklar[0],
          katlar: yeniKatlar
        }]
      });

      showSnackbar('Kat başarıyla eklendi', 'success');
      setYeniKat({
        no: '',
        tip: 'NORMAL',
        daireSayisi: 4
      });
    } catch (error) {
      console.error('❌ Kat eklenirken hata:', error);
      showSnackbar('Kat eklenirken hata oluştu', 'error');
    }
  };

  const katSil = async (katNo) => {
    try {
      // Katı bul ve sil
      const mevcutKatlar = binaYapisi.bloklar[0].katlar || [];
      const yeniKatlar = mevcutKatlar.filter(kat => kat.no !== katNo);

      // Firestore'a kaydet
      const yapiRef = doc(db, `santiyeler/${seciliSantiye.id}/bloklar/${seciliBlok.ad}/yapi`);
      await setDoc(yapiRef, {
        bloklar: [{
          ...binaYapisi.bloklar[0],
          katlar: yeniKatlar
        }]
      });

      showSnackbar('Kat başarıyla silindi', 'success');
    } catch (error) {
      console.error('❌ Kat silinirken hata:', error);
      showSnackbar('Kat silinirken hata oluştu', 'error');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bina Yapılandırma</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Yeni Kat Ekleme */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-4">Yeni Kat Ekle</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Kat No</Label>
                <Input
                  type="text"
                  value={yeniKat.no}
                  onChange={(e) => setYeniKat(prev => ({ ...prev, no: e.target.value }))}
                  placeholder="Kat no (örn: 1, B1)"
                />
              </div>
              <div>
                <Label>Kat Tipi</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={yeniKat.tip}
                  onChange={(e) => setYeniKat(prev => ({ ...prev, tip: e.target.value }))}
                >
                  {katTipleri.map(tip => (
                    <option key={tip.id} value={tip.id}>
                      {tip.ad}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Daire Sayısı</Label>
                <Input
                  type="number"
                  value={yeniKat.daireSayisi}
                  onChange={(e) => setYeniKat(prev => ({ ...prev, daireSayisi: parseInt(e.target.value) }))}
                  min={1}
                  max={10}
                />
              </div>
            </div>
            <Button onClick={katEkle} className="mt-4">
              Kat Ekle
            </Button>
          </div>

          {/* Mevcut Katlar */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-4">Mevcut Katlar</h4>
            <div className="space-y-2">
              {binaYapisi?.bloklar?.[0]?.katlar?.map((kat, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{kat.no}. Kat</span>
                    <span className="ml-2 text-sm text-gray-500">
                      ({kat.daireler?.length || 0} Daire)
                    </span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => katSil(kat.no)}
                  >
                    Sil
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BinaYapilandirma;
