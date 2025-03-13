import React from 'react';
import { Card, CardContent, Button } from '@mui/material';
import { Edit, Trash2 } from 'lucide-react';
import { DURUM_TIPLERI, ONCELIK_SEVIYELERI } from '@/constants/teslimat';

const formatTarih = (timestamp) => {
  if (!timestamp) return '-';
  if (timestamp.toDate) {
    return timestamp.toDate().toLocaleDateString('tr-TR');
  }
  return new Date(timestamp).toLocaleDateString('tr-TR');
};

const EksiklikListesi = ({ eksiklikler, onDuzenle, onSil }) => {
  if (eksiklikler.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Kayıt bulunamadı..
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {eksiklikler.map(eksiklik => (
        <Card key={eksiklik.id} className="hover:shadow-md transition-all dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">
                    {eksiklik.daire} Nolu Daire
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-base">
                  {eksiklik.aciklama}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                  {/* Durum */}
                  <div>
                    <span className={`px-2 py-1 rounded-md text-sm font-medium
                      ${eksiklik.durum === 'BEKLEMEDE' ? 'bg-yellow-100 text-yellow-800' :
                        eksiklik.durum === 'DEVAM_EDIYOR' ? 'bg-blue-100 text-blue-800' :
                        eksiklik.durum === 'TAMAMLANDI' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'}`}>
                      {DURUM_TIPLERI[eksiklik.durum]?.label || eksiklik.durum}
                    </span>
                  </div>
                  
                  {/* Öncelik */}
                  <div>
                    <span className={`px-2 py-1 rounded-md text-sm font-medium
                      ${eksiklik.oncelik === 'DUSUK' ? 'bg-gray-100 text-gray-800' :
                        eksiklik.oncelik === 'ORTA' ? 'bg-yellow-100 text-yellow-800' :
                        eksiklik.oncelik === 'YUKSEK' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'}`}>
                      {ONCELIK_SEVIYELERI[eksiklik.oncelik]?.label || eksiklik.oncelik}
                    </span>
                  </div>

                  {/* Taşeron */}
                  <div>
                    <span className={`px-2 py-1 rounded-md text-sm font-medium ${
                      eksiklik.taseron ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {eksiklik.taseron || 'Belirtilmemiş'}
                    </span>
                  </div>

                </div>

                <span className="text-sm text-gray-500 dark:text-gray-400 block mt-3">
                  {formatTarih(eksiklik.olusturmaTarihi)}
                </span>
              </div>

              <div className="flex gap-2 ml-4">
                <Button
                  variant="outlined"
                  size="small"
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                  onClick={() => onDuzenle(eksiklik)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                  onClick={() => {
                    if (window.confirm('Bu eksikliği silmek istediğinizden emin misiniz?')) {
                      onSil(eksiklik.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 

export default EksiklikListesi;