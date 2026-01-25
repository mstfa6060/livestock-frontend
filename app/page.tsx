import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            Livestock Trading
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Giriş Yap</Button>
            </Link>
            <Link href="/register">
              <Button>Kayıt Ol</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Canlı Hayvan Alım Satım Platformu
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Türkiye&apos;nin en güvenilir canlı hayvan pazarı. Büyükbaş ve küçükbaş
            hayvanlarınızı güvenle alın ve satın.
          </p>
          <div className="mt-10 flex gap-4">
            <Link href="/register">
              <Button size="lg">Hemen Başla</Button>
            </Link>
            <Link href="/animals">
              <Button variant="outline" size="lg">
                İlanları Gör
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid gap-8 sm:grid-cols-3">
          <div className="rounded-lg border p-6">
            <h3 className="text-lg font-semibold">Güvenli Alışveriş</h3>
            <p className="mt-2 text-muted-foreground">
              Tüm işlemler güvence altında. Satıcı ve alıcı bilgileri doğrulanır.
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="text-lg font-semibold">Geniş Ürün Yelpazesi</h3>
            <p className="mt-2 text-muted-foreground">
              Büyükbaş, küçükbaş ve daha fazlası. Aradığınız hayvanı kolayca bulun.
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="text-lg font-semibold">7/24 Destek</h3>
            <p className="mt-2 text-muted-foreground">
              Sorularınız için her zaman yanınızdayız. Canlı destek hattımız aktif.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-24">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 Livestock Trading. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
