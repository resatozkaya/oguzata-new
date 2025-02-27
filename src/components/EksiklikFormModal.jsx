import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { eksiklikKategorileri, eksiklikDurumlari, eksiklikOncelikleri } from '@/constants/eksiklik';
import { eksiklikService } from '@/services/eksiklikService';
import { useSantiye } from '@/contexts/Santiye';
import { ImagePlus, Trash2 } from 'lucide-react';

export const EksiklikFormModal = ({
  open,
  onClose,
  eksiklik = null,
  taseronlar = [],
  onSuccess
}) => {
  const { seciliSantiye, seciliBlok } = useSantiye();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [fotografYukleniyor, setFotografYukleniyor] = useState(false);
  
  const [formData, setFormData] = useState({
    kategori: eksiklik?.kategori || '',
    taseron: eksiklik?.taseron || '',
    oncelik: eksiklik?.oncelik || 'NORMAL',
    durum: eksiklik?.durum || 'YENI',
    daire: eksiklik?.daire || '',
    aciklama: eksiklik?.aciklama || '',
    fotograflar: eksiklik?.fotograflar || []
  });

  const handleFotografYukle = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setFotografYukleniyor(true);
    try {
      console.log('📸 Fotoğraflar yükleniyor...');
      const urls = await Promise.all(
        Array.from(files).map(file => eksiklikService.fotografYukle(file))
      );
      
      setFormData(prev => ({
        ...prev,
        fotograflar: [...prev.fotograflar, ...urls]
      }));
      
      console.log('✅ Fotoğraflar başarıyla yüklendi');
    } catch (error) {
      console.error('❌ Fotoğraf yükleme hatası:', error);
    } finally {
      setFotografYukleniyor(false);
    }
  };

  const handleFotografSil = (index) => {
    setFormData(prev => ({
      ...prev,
      fotograflar: prev.fotograflar.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!seciliSantiye?.id || !seciliBlok?.ad) {
      console.error('❌ Şantiye veya blok seçili değil');
      return;
    }

    if (!formData.kategori || !formData.taseron || !formData.aciklama) {
      console.error('❌ Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    setYukleniyor(true);
    try {
      console.log('💾 Eksiklik kaydediliyor...');
      
      if (eksiklik?.id) {
        // Mevcut eksikliği güncelle
        await eksiklikService.eksiklikGuncelle(
          seciliSantiye.id,
          seciliBlok.ad,
          eksiklik.id,
          formData
        );
      } else {
        // Yeni eksiklik ekle
        await eksiklikService.eksiklikEkle(
          seciliSantiye.id,
          seciliBlok.ad,
          formData
        );
      }

      console.log('✅ Eksiklik başarıyla kaydedildi');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('❌ Eksiklik kaydedilirken hata:', error);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {eksiklik ? 'Eksiklik Düzenle' : 'Yeni Eksiklik Ekle'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Kategori */}
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select
                value={formData.kategori}
                onValueChange={(value) => setFormData(prev => ({ ...prev, kategori: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eksiklikKategorileri).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Taşeron */}
            <div className="space-y-2">
              <Label>Taşeron</Label>
              <Select
                value={formData.taseron}
                onValueChange={(value) => setFormData(prev => ({ ...prev, taseron: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Taşeron seçin" />
                </SelectTrigger>
                <SelectContent>
                  {taseronlar.map((taseron) => (
                    <SelectItem key={taseron.id} value={taseron.id}>
                      {taseron.ad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Öncelik */}
            <div className="space-y-2">
              <Label>Öncelik</Label>
              <Select
                value={formData.oncelik}
                onValueChange={(value) => setFormData(prev => ({ ...prev, oncelik: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Öncelik seçin" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eksiklikOncelikleri).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Durum */}
            <div className="space-y-2">
              <Label>Durum</Label>
              <Select
                value={formData.durum}
                onValueChange={(value) => setFormData(prev => ({ ...prev, durum: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eksiklikDurumlari).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Daire No */}
          <div className="space-y-2">
            <Label>Daire No</Label>
            <Input
              value={formData.daire}
              onChange={(e) => setFormData(prev => ({ ...prev, daire: e.target.value }))}
              placeholder="Daire numarası girin"
            />
          </div>

          {/* Açıklama */}
          <div className="space-y-2">
            <Label>Açıklama</Label>
            <Textarea
              value={formData.aciklama}
              onChange={(e) => setFormData(prev => ({ ...prev, aciklama: e.target.value }))}
              placeholder="Eksiklik açıklaması girin"
              rows={4}
            />
          </div>

          {/* Fotoğraflar */}
          <div className="space-y-2">
            <Label>Fotoğraflar</Label>
            
            {/* Yüklü Fotoğraflar */}
            {formData.fotograflar.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-2">
                {formData.fotograflar.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Fotoğraf ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleFotografSil(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Fotoğraf Yükleme Butonu */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => document.getElementById('foto-input').click()}
                disabled={fotografYukleniyor}
              >
                <ImagePlus className="w-4 h-4 mr-2" />
                {fotografYukleniyor ? 'Yükleniyor...' : 'Fotoğraf Ekle'}
              </Button>
              <input
                id="foto-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFotografYukle}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={yukleniyor}>
            {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
