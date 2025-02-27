import React, { useState, useEffect } from 'react';
import { SantiyeSecici } from '@/components/SantiyeSecici';
import { BinaGorunumu } from "@/components/BinaGorunumu";
import { EksiklikIstatistikleri } from "@/components/EksiklikIstatistikleri";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EksiklikFormModal } from "@/components/EksiklikFormModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { useSantiye } from '@/contexts/Santiye'; // güncellenen import
import { eksiklikService } from "@/services/eksiklikService";
import { taseronService } from "@/services/taseronService";
import { eksiklikKategorileri, eksiklikDurumlari, eksiklikOncelikleri } from '@/constants/eksiklik';
import BinaYapilandirma from '@/components/BinaYapilandirma';
import { doc, getDoc, db } from 'firebase/firestore';

export default function DetayliEksiklikYonetimi() {
  const { seciliSantiye, seciliBlok } = useSantiye();
  
  // State tanımlamaları
  const [eksiklikler, setEksiklikler] = useState([]);
  const [taseronlar, setTaseronlar] = useState([]);
  const [istatistikler, setIstatistikler] = useState({});
  const [filtreler, setFiltreler] = useState({
    kategori: '',
    durum: '',
    oncelik: '',
    taseron: '',
    arama: ''
  });
  const [binaYapilandirmaAcik, setBinaYapilandirmaAcik] = useState(false);
  const [binaYapisi, setBinaYapisi] = useState(null);

  // Bina yapısını getir fonksiyonu
  const binaYapisiniGetir = async () => {
    if (!seciliSantiye?.id || !seciliBlok?.ad) return;

    try {
      console.log('🏢 Bina yapısı getiriliyor...');
      const binaRef = doc(db, `santiyeler/${seciliSantiye.id}/bloklar/${seciliBlok.ad}/yapi`);
      const snapshot = await getDoc(binaRef);
      
      if (snapshot.exists()) {
        const data = snapshot.data();
        console.log('✅ Bina yapısı yüklendi:', data);
        setBinaYapisi(data);
      } else {
        console.log('⚠️ Bina yapısı bulunamadı, varsayılan yapı oluşturuluyor');
        setBinaYapisi({
          bloklar: [{
            ad: seciliBlok.ad,
            katlar: []
          }]
        });
      }
    } catch (error) {
      console.error('❌ Bina yapısı yüklenirken hata:', error);
    }
  };

  // Bina yapısını yükle
  useEffect(() => {
    binaYapisiniGetir();
  }, [seciliSantiye?.id, seciliBlok?.ad]);

  // Eksiklikleri getir
  useEffect(() => {
    const eksiklikleriGetir = async () => {
      if (!seciliSantiye?.id || !seciliBlok?.ad) return;

      try {
        console.log('📋 Eksiklikler getiriliyor...');
        const data = await eksiklikService.tumEksiklikleriGetir(seciliSantiye.id, seciliBlok.ad);
        setEksiklikler(data);

        // İstatistikleri hesapla
        const stats = {
          toplam: data.length,
          yeni: data.filter(e => e.durum === 'YENI').length,
          devamEden: data.filter(e => e.durum === 'DEVAM_EDIYOR').length,
          beklemede: data.filter(e => e.durum === 'BEKLEMEDE').length,
          tamamlanan: data.filter(e => e.durum === 'TAMAMLANDI').length,
          kritik: data.filter(e => e.oncelik === 'KRITIK').length
        };
        setIstatistikler(stats);
        
        console.log('✅ Eksiklikler başarıyla getirildi');
      } catch (error) {
        console.error('❌ Eksiklikler getirilirken hata:', error);
      }
    };

    eksiklikleriGetir();
  }, [seciliSantiye?.id, seciliBlok?.ad]);

  // Taşeronları getir
  useEffect(() => {
    const taseronlariGetir = async () => {
      try {
        console.log('👷 Taşeronlar getiriliyor...');
        const data = await taseronService.taseronlariGetir();
        setTaseronlar(data);
        console.log('✅ Taşeronlar başarıyla getirildi');
      } catch (error) {
        console.error('❌ Taşeronlar getirilirken hata:', error);
      }
    };

    taseronlariGetir();
  }, []);

  // Filtreleme fonksiyonu
  const filtreliEksiklikler = eksiklikler.filter(eksiklik => {
    const aramaUygun = !filtreler.arama || 
      eksiklik.aciklama?.toLowerCase().includes(filtreler.arama.toLowerCase()) ||
      eksiklik.daire?.toLowerCase().includes(filtreler.arama.toLowerCase());
      
    const kategoriUygun = !filtreler.kategori || eksiklik.kategori === filtreler.kategori;
    const durumUygun = !filtreler.durum || eksiklik.durum === filtreler.durum;
    const oncelikUygun = !filtreler.oncelik || eksiklik.oncelik === filtreler.oncelik;
    const taseronUygun = !filtreler.taseron || eksiklik.taseron === filtreler.taseron;

    return aramaUygun && kategoriUygun && durumUygun && oncelikUygun && taseronUygun;
  });

  return (
    <div className="container mx-auto py-6">
      <SantiyeSecici />

      {seciliSantiye && seciliBlok ? (
        <div className="space-y-6">
          {/* İstatistikler */}
          <EksiklikIstatistikleri istatistikler={istatistikler} />

          {/* Filtreler */}
          <Card className="p-4">
            <div className="grid grid-cols-6 gap-4">
              <Select
                value={filtreler.kategori}
                onValueChange={(value) => setFiltreler(prev => ({ ...prev, kategori: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tümü</SelectItem>
                  {Object.entries(eksiklikKategorileri).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filtreler.durum}
                onValueChange={(value) => setFiltreler(prev => ({ ...prev, durum: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tümü</SelectItem>
                  {Object.entries(eksiklikDurumlari).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filtreler.oncelik}
                onValueChange={(value) => setFiltreler(prev => ({ ...prev, oncelik: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Öncelik" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tümü</SelectItem>
                  {Object.entries(eksiklikOncelikleri).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filtreler.taseron}
                onValueChange={(value) => setFiltreler(prev => ({ ...prev, taseron: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Taşeron" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tümü</SelectItem>
                  {taseronlar.map((taseron) => (
                    <SelectItem key={taseron.id} value={taseron.id}>{taseron.ad}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Arama..."
                value={filtreler.arama}
                onChange={(e) => setFiltreler(prev => ({ ...prev, arama: e.target.value }))}
              />

              <Button
                variant="outline"
                onClick={() => setBinaYapilandirmaAcik(true)}
              >
                Bina Yapılandır
              </Button>
            </div>
          </Card>

          {/* Bina Görünümü */}
          <div className="space-y-4">
            <BinaGorunumu
              binaYapisi={binaYapisi}
              eksiklikler={filtreliEksiklikler}
              onDaireClick={(daire) => {
                // TODO: Daire detaylarını göster
                console.log('Daire tıklandı:', daire);
              }}
              onDaireDoubleClick={(daire) => {
                setFiltreler(prev => ({ ...prev, arama: daire.no }));
              }}
              onDuzenle={() => {
                console.log('Düzenle butonuna tıklandı');
                setBinaYapilandirmaAcik(true);
              }}
            />

            {/* Bina Yapılandırma Modalı */}
            {binaYapilandirmaAcik && (
              <BinaYapilandirma
                binaYapisi={binaYapisi}
                onClose={() => {
                  console.log('Modal kapatılıyor');
                  setBinaYapilandirmaAcik(false);
                  // Modal kapandığında bina yapısını yeniden yükle
                  binaYapisiniGetir();
                }}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-600">
            Lütfen şantiye ve blok seçin
          </h2>
        </div>
      )}
    </div>
  );
}
