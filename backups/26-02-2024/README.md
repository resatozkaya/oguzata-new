# Yedek - 26 Şubat 2024

Bu yedek, günlük rapor sistemi ve kullanıcı girişinin sorunsuz çalıştığı versiyondur.

## Çalışan Özellikler
- Kullanıcı girişi (Firebase Authentication)
- Günlük rapor ekleme/silme/düzenleme
- Rapor filtreleme (personel, şantiye, firma, tarih)
- Excel export (tarih ve firmaya göre sıralı)
- Profil yönetimi (base64 profil fotoğrafı)

## Önemli Dosyalar
- GunlukRapor.jsx: Ana rapor sistemi
- RaporCard.jsx: Rapor kartı komponenti
- RaporForm.jsx: Rapor form komponenti
- AuthContext.jsx: Kullanıcı yönetimi
- Login.jsx: Giriş sayfası
- firebase.js: Firebase konfigürasyonu

## Notlar
- Excel export'ta tarih ve firma bazlı sıralama yapılıyor
- Profil fotoğrafları base64 formatında saklanıyor
- Kullanıcı rolleri: ADMIN ve PERSONEL 