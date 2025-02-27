import React, { useState, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

const BinaGorunumu = ({ binaYapisi, eksiklikler, onDaireClick, onDaireDoubleClick, onDuzenle }) => {
  const [firmalar, setFirmalar] = useState({});

  useEffect(() => {
    const fetchFirmalar = async () => {
      try {
        const snapshot = await getDocs(collection(db, "personeller"));
        let firmaMap = {};

        const renkListesi = [
          "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
          "bg-orange-500", "bg-purple-500", "bg-pink-500", "bg-cyan-500",
          "bg-teal-500", "bg-indigo-500", "bg-emerald-500", "bg-violet-500",
          "bg-rose-500", "bg-amber-500", "bg-lime-500", "bg-fuchsia-500"
        ];

        snapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          if (data.firma?.trim()) {
            let normalizedFirma = data.firma.trim().replace(/\s+/g, "_").toUpperCase();
            if (!firmaMap[normalizedFirma]) {
              firmaMap[normalizedFirma] = renkListesi[index % renkListesi.length];
            }
          }
        });

        console.log("🔥 Firestore'dan Gelen Firmalar:", firmaMap);
        setFirmalar(firmaMap);
      } catch (error) {
        console.error("❌ Firestore'dan firmaları çekerken hata:", error);
      }
    };

    fetchFirmalar();
  }, []);

  const siraliKatlar = useMemo(() => {
    const katlar = binaYapisi?.bloklar?.[0]?.katlar;
    if (!katlar) return [];

    return [...katlar].sort((a, b) => {
      const getKatNo = (no) => {
        if (typeof no === "string" && no.startsWith("B")) return -parseInt(no.slice(1));
        if (no === 0) return 0;
        return parseInt(no);
      };
      return getKatNo(b.no) - getKatNo(a.no);
    });
  }, [binaYapisi]);

  const getFirmaRengi = (firmaAdi) => {
    if (!firmaAdi) return "bg-gray-500";
    const normalizedFirma = firmaAdi.trim().replace(/\s+/g, "_").toUpperCase();
    return firmalar[normalizedFirma] || "bg-gray-500";
  };

  const getKatIsmi = (katNo) => {
    if (katNo === 0) return "Zemin Kat";
    if (typeof katNo === "string" && katNo.startsWith("B")) {
      return `${katNo}. Bodrum`;
    }
    return `${katNo}. Kat`;
  };

  if (!binaYapisi?.bloklar?.[0]?.katlar) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Bina Görünümü</h3>
        <Button
          variant="outline"
          onClick={onDuzenle}
          className="flex items-center gap-2"
        >
          Düzenle
        </Button>
      </div>

      {siraliKatlar.map((kat, katIndex) => (
        <div key={katIndex} className="border rounded-lg p-4 shadow-md">
          <h4 
            className="font-semibold text-lg text-white px-4 py-2 rounded-md text-center"
            style={{
              backgroundColor: `hsl(${katIndex * 40}, 70%, 50%)`
            }}
          >
            {getKatIsmi(kat.no)}
          </h4>

          <div className="grid grid-cols-5 gap-2 mt-4">
            {kat.daireler?.map((daire, daireIndex) => {
              const daireEksiklikleri = eksiklikler?.filter(e => e.daire === daire.no) || [];
              const firmaRengi = getFirmaRengi(daireEksiklikleri[0]?.firma);

              return (
                <Card
                  key={daireIndex}
                  className={`${firmaRengi} p-4 cursor-pointer transition-all hover:scale-105`}
                  onClick={() => onDaireClick?.(daire)}
                  onDoubleClick={() => onDaireDoubleClick?.(daire)}
                >
                  <div className="flex flex-col items-center text-white">
                    <span className="font-semibold">{daire.no}</span>
                    {daireEksiklikleri.length > 0 && (
                      <span className="text-sm mt-1">
                        {daireEksiklikleri.length} Eksiklik
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BinaGorunumu;
