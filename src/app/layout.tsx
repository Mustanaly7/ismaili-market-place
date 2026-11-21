import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartProvider";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HelpButton } from "@/components/layout/HelpButton";
import { getLocale } from "@/lib/locale-server";
import { dirFor, getMessages } from "@/lib/i18n";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "ISMAILI Market Place",
    template: "%s · ISMAILI Market Place",
  },
  description:
    "A simple, friendly marketplace connecting local sellers with buyers. Browse, message, and buy with ease.",
  applicationName: "ISMAILI Market Place",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Market Place",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1c7e57",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const dir = dirFor(locale);
  const dict = getMessages(locale);

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <I18nProvider locale={locale}>
          <CartProvider>
            <a href="#main" className="skip-link">
              {dict["a11y.skip"] ?? "Skip to main content"}
            </a>
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
            <HelpButton />
            <ServiceWorkerRegister />
          </CartProvider>
        </I18nProvider>
      </body>
    </html>
  );
}