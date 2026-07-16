# 🏦 Full-Stack ATM Simülasyonu (.NET 10 API & Angular 21)

Bu proje, modern bir bankacılık ve ATM ağ yönetim simülasyonudur. Proje, müşterilerin ATM üzerinden klasik bankacılık işlemlerini gerçekleştirebildiği **Müşteri Paneli** ile banka yöneticilerinin ATM filosunu ve müşteri limitlerini izleyip yönetebildiği **Yönetici (Admin) Paneli** olmak üzere iki ana modülden oluşmaktadır.

---

## 🚀 Öne Çıkan Özellikler

### 👤 Müşteri Paneli (ATM Arayüzü)
- **Güvenli Giriş:** Kart numarası ve PIN kodu ile güvenli giriş. PIN doğrulaması backend'de **BCrypt** algoritması ile hash'lenerek doğrulanır.
- **Hesap Seçimi:** Vadesiz hesaplar arasında kolayca geçiş yapabilme.
- **Para Çekme & Yatırma:** ATM kasasından fiziksel banknot adetlerini güncelleyen, küpür bazlı (200, 100, 50, 20 TL) para çekme ve yatırma sistemi.
- **Para Transferi:** IBAN numarası üzerinden başka hesaplara havale/eft yapabilme.
- **Fatura Ödeme:** Elektrik, Su, Doğalgaz gibi faturaların vadesiz hesaptan anında ödenmesi.
- **Hesap Özeti (Statement):** Son işlemleri tarih, saat ve işlem tipi detaylarıyla listeleyen dekont arayüzü.
- **Kredi Kartı Borç Ödemesi:** Kredi kartı dönem borcu ve asgari borcunun vadesiz hesaptan düşülerek ödenmesi.
- **Nakit Avans:** Kredi kartı limitinden nakit avans çekilerek ATM'den para eksiltilmesi.

### 👨‍💼 Yönetici (Admin) Paneli
- **Gerçek Zamanlı Gösterge Paneli (Dashboard):**
  - **Ağ Sağlığı (Network Health):** Aktif olan ATM'lerin toplam ATM'lere oranını yüzde olarak gösteren dinamik bar.
  - **Toplam ATM Nakit:** Tüm ATM'lerdeki toplam nakit miktarı.
  - **Arızalı/Çevrimdışı ATM'ler:** Durumu "Hata" veya "Çevrimdışı" olan ATM'lerin hızlı gösterimi.
- **ATM Filo Yönetimi:** Filodaki ATM'lerin durumunu (Çevrimiçi, Çevrimdışı, Arızalı), kasa doluluk oranlarını ve banknot sayılarını izleme.
- **ATM Kasa Yönetimi:** Yetersiz nakit uyarısı veren ATM'lerin kasalarını tek tıkla yeniden doldurma (Refill).
- **Müşteri Limit Yönetimi:** Müşterilerin günlük para çekme ve transfer limitlerini dinamik olarak değiştirme veya güncelleme taleplerini onaylama.
- **İşlem Günlükleri (Logs):** Sistem genelinde yapılan tüm işlemlerin (tarih, kart no, işlem türü, miktar, durum) detaylı listelenmesi.

---

## 🛠️ Kullanılan Teknolojiler

| Bileşen | Teknoloji | Açıklama |
| :--- | :--- | :--- |
| **Backend** | .NET 10 | Modern, hızlı ve güvenli C# API |
| **Database** | SQL Server (Entity Framework Core) | İlişkisel veritabanı ve ORM katmanı |
| **Security** | BCrypt.Net & JWT | Güvenli PIN hashleme ve token tabanlı yetkilendirme |
| **Frontend** | Angular 21 | Component tabanlı, dinamik web arayüzü |
| **Arayüz/Stil** | Modern CSS & Glassmorphism | Şık, göz yormayan karanlık mod (dark theme) ve animasyonlar |

---

## ⚙️ Kurulum ve Çalıştırma

### 1. Veritabanı ve API Kurulumu (Backend)
1. Veritabanı olarak **SQL Server (LocalDB veya Express)** kurulu olduğundan emin olun.
2. `Backend/AtmSimulation.API/appsettings.json` dosyasındaki `DefaultConnection` bağlantı dizesini kendi SQL Server ayarlarınıza göre düzenleyin:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=DESKTOP-J9JGNI3\\SQLEXPRESS;Database=AtmSimulationDb;Trusted_Connection=True;TrustServerCertificate=True"
   }
   ```
3. Projeyi Visual Studio ile açmak için `Backend/AtmSimulation.slnx` veya `Backend/AtmSimulation.sln` dosyasına çift tıklayın.
4. Paketlerin yüklenmesi için projeyi derleyin (Build).
5. Proje ilk kez çalıştığında veritabanı otomatik olarak oluşturulacak ve **`clean_seed.ps1`** veya EF Core Migration araçları ile örnek verilerle (müşteriler, kartlar, ATM'ler) tohumlanacaktır (Seed).
6. API'yi başlatmak için Visual Studio'da **Run/Debug** tuşuna basın (Varsayılan port: `https://localhost:7204`).

### 2. Kullanıcı Arayüzü Kurulumu (Frontend)
1. Bilgisayarınızda **Node.js** kurulu olduğundan emin olun.
2. VS Code ile `Frontend` klasörünü açın.
3. Gerekli kütüphaneleri yüklemek için terminalde şu komutu çalıştırın:
   ```bash
   npm install
   ```
4. Uygulamayı başlatmak için:
   ```bash
   npm start
   ```
5. Tarayıcınızda **`http://localhost:4200`** adresine giderek ATM simülasyonunu kullanmaya başlayabilirsiniz.

---

## 🔑 Varsayılan Giriş Bilgileri

Test işlemlerinde kullanabileceğiniz örnek kart ve şifre bilgileri:

### Örnek Müşteri Girişi
- **Kart Numarası:** `2222333344445551`
- **PIN Kodu:** `1234`

### Örnek Yönetici Girişi
- **Kullanıcı Adı:** `admin`
- **Şifre:** `admin123`

---

## 📁 Klasör Yapısı

```
AtmSimulation/
├── Backend/                  # C# .NET 10 API Projesi
│   ├── AtmSimulation.API/     # Controller ve API Endpoint'leri
│   ├── AtmSimulation.Business/# İş mantığı, Şifreleme ve Servisler
│   ├── AtmSimulation.DataAccess/# EF Core Context, Migrations ve Repositories
│   ├── AtmSimulation.DTOs/    # Veri transfer nesneleri (DTOs)
│   └── AtmSimulation.Entities/# Veritabanı modelleri
└── Frontend/                 # Angular 21 Kullanıcı Arayüzü
    ├── src/app/components/   # Sayfalar ve Görsel Bileşenler
    ├── src/app/services/     # API Entegrasyon Servisleri
    └── src/app/guards/       # Yetkilendirme Kalkanları
```
