import Header, { ShopFooter } from "@/components/site/Header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <ShopFooter />
    </div>
  );
}
