# Backend Gelistirme Talimatlari

Bu dokuman, frontend testleri sirasinda tespit edilen backend sorunlarini ve onerilen cozumleri icerir.

## 1. Slug Benzersizligi (KRITIK)

**Sorun:** `Products` tablosunda `slug` alani unique degildir. Ayni slug'a sahip birden fazla urun olusturulabilir.

**Etki:** Frontend `/products/{slug}` URL'i ile urun detayini gosterirken yanlis urunu gosterebilir.

**Cozum:**
```sql
ALTER TABLE Products ADD CONSTRAINT UQ_Products_Slug UNIQUE (slug);
```

Veya urun olusturulurken slug'in benzersiz olup olmadigini kontrol edin:
```csharp
if (await _context.Products.AnyAsync(p => p.Slug == request.Slug))
{
    throw new BusinessException("SLUG_ALREADY_EXISTS");
}
```

---

## 2. Seller Profili Otomatik Olusturma

**Mevcut Durum:** Kullaniciya `LivestockTrading.Seller` rolu atandiginda, veritabaninda otomatik olarak `Seller` entity'si olusturulmuyor.

**Etki:** Kullanici Seller rolune sahip olsa bile, urun olusturamaz cunku `Seller` kaydi yok.

**Onerilen Cozumler:**

### Secenek A: Rol atandiginda otomatik Seller olustur
```csharp
// IAM/Role atama servisinde
public async Task AssignRoleAsync(Guid userId, string roleName)
{
    await _roleService.AssignRole(userId, roleName);

    if (roleName == "LivestockTrading.Seller")
    {
        var user = await _userService.GetById(userId);
        await _sellerService.CreateAsync(new CreateSellerRequest
        {
            UserId = userId,
            BusinessName = user.DisplayName,
            BusinessType = "Individual",
            Email = user.Email,
            IsActive = true,
            Status = 0
        });
    }
}
```

### Secenek B: Products.Create endpoint'inde kontrol et
```csharp
public async Task<Product> CreateProductAsync(CreateProductRequest request)
{
    // Seller var mi kontrol et
    var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == request.UserId);

    if (seller == null)
    {
        // Otomatik olustur
        seller = await _sellerService.CreateAsync(new CreateSellerRequest
        {
            UserId = request.UserId,
            // ... default degerler
        });
    }

    // Urun olustur
    var product = new Product
    {
        SellerId = seller.Id, // Seller entity ID'si, user ID degil!
        // ...
    };
}
```

---

## 3. Products.Detail Endpoint - Slug Destegi

**Mevcut Durum:** `Products.Detail` endpoint'i sadece `id` (GUID) kabul ediyor.

**Etki:** Frontend URL'de slug kullaniyor (`/products/my-product-slug`), her seferinde once slug ile arama yapmak zorunda kaliyor (2 API cagirisi).

**Onerilen Cozum:** Yeni endpoint ekleyin veya mevcut endpoint'i genisletin:

### Secenek A: Yeni endpoint
```csharp
[HttpPost("DetailBySlug")]
public async Task<ProductDetailResponse> DetailBySlug(DetailBySlugRequest request)
{
    var product = await _context.Products
        .Include(p => p.Seller)
        .Include(p => p.Category)
        .Include(p => p.Images)
        .FirstOrDefaultAsync(p => p.Slug == request.Slug);

    if (product == null)
        throw new NotFoundException("PRODUCT_NOT_FOUND");

    return MapToDetailResponse(product);
}

public class DetailBySlugRequest
{
    public string Slug { get; set; }
}
```

### Secenek B: Mevcut endpoint'i genislet
```csharp
[HttpPost("Detail")]
public async Task<ProductDetailResponse> Detail(DetailRequest request)
{
    Product product;

    if (request.Id.HasValue)
    {
        product = await _context.Products.FindAsync(request.Id.Value);
    }
    else if (!string.IsNullOrEmpty(request.Slug))
    {
        product = await _context.Products.FirstOrDefaultAsync(p => p.Slug == request.Slug);
    }
    else
    {
        throw new ValidationException("ID or Slug required");
    }

    // ...
}

public class DetailRequest
{
    public Guid? Id { get; set; }
    public string? Slug { get; set; }
}
```

---

## 4. Sellers.Detail - UserId ile Arama

**Mevcut Durum:** `Sellers.Detail` endpoint'i sadece `sellerId` kabul ediyor, `userId` ile arama yapilamamasina neden oluyor.

**Etki:** Frontend, kullanicinin seller profilini bulmak icin `Sellers.All` ile filtreleme yapmak zorunda kaliyor.

**Onerilen Cozum:**
```csharp
[HttpPost("DetailByUserId")]
public async Task<SellerDetailResponse> DetailByUserId(DetailByUserIdRequest request)
{
    var seller = await _context.Sellers
        .FirstOrDefaultAsync(s => s.UserId == request.UserId);

    if (seller == null)
        throw new NotFoundException("SELLER_NOT_FOUND");

    return MapToDetailResponse(seller);
}

// Veya mevcut Detail endpoint'ini genislet
public class SellerDetailRequest
{
    public Guid? Id { get; set; }
    public Guid? UserId { get; set; }
}
```

---

## 5. Location Olusturma Izinleri

**Mevcut Durum:** `Locations.Create` endpoint'i sadece Seller rolune izin veriyor.

**Test Sirasinda Karsilasilan Hata:** `INSUFFICIENT_PERMISSION` - Buyer rolu ile location olusturulamadi.

**Durum:** Bu kisitlama mantikli olabilir. Ancak urun olusturma akisinda:
1. Kullanici Seller rolu almali
2. Seller entity'si olusturulmali
3. Ardindan Location ve Product olusturabilmeli

**Not:** Eger Seller rolu olan kullanici hala hata aliyorsa, rol kontrolu mantigi incelenmeli.

---

## 6. API Response - Timestamp Formatı

**Oneri:** Tum API response'larinda tarih alanlari ISO 8601 formatinda olmali:
```json
{
  "createdAt": "2026-02-03T09:16:03.499Z"
}
```

---

## Test Edilecek Akislar

### Urun Olusturma Akisi (Dogru Sira)
1. Kullanici login olur
2. Kullaniciya Seller rolu atanir (veya zaten varsa)
3. Seller entity'si olusturulur (veya zaten varsa)
4. Location olusturulur
5. Product olusturulur (sellerId = Seller entity ID, locationId = Location ID)

### Frontend Workaround (Gecici Cozum)
Frontend su anda asagidaki akisi kullaniyor:
1. `Sellers.All` ile userId filtresi yaparak Seller bul
2. Yoksa `Sellers.Create` ile yeni Seller olustur
3. `Locations.Create` ile Location olustur
4. `Products.Create` ile Product olustur

---

## Oncelik Sirasi

| Oncelik | Konu | Etki |
|---------|------|------|
| KRITIK | Slug benzersizligi | Yanlis urun gosterme riski |
| YUKSEK | Seller otomatik olusturma | Kullanici deneyimi |
| ORTA | DetailBySlug endpoint | Performans (2 API yerine 1) |
| DUSUK | DetailByUserId endpoint | Performans |

---

## Iletisim

Frontend gelistirici: Bu dokuman frontend testleri sirasinda tespit edilen sorunlari icerir.
Tarih: 2026-02-03
