import MobileHeader from "@/components/dashboard/common/mobileHeader";
import Sidebar from "@/components/dashboard/common/sidebar";
import { SocketAuthProvider } from "@/components/providers/socketAuth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/lib/contexts/auth";
import { WhatsAppProvider } from "@/lib/contexts/whatsapp";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}

const Layout: React.FC<LayoutProps> = async ({ children, params }) => {
  const { locale } = await params;
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <AuthProvider>
      <SocketAuthProvider>
        <SidebarProvider>
          <WhatsAppProvider>
            <div className="min-h-screen flex w-full" dir={dir}>
              <Sidebar />
              <div
                className={cn(
                  "flex-1 flex flex-col min-w-0",
                  dir === "rtl" ? "md:pr-60" : "md:pl-60",
                )}
              >
                <MobileHeader />
                <main className="flex-1 p-4 md:p-6 overflow-auto">
                  {children}
                </main>
              </div>
            </div>
          </WhatsAppProvider>
        </SidebarProvider>
      </SocketAuthProvider>
    </AuthProvider>
  );
};

export default Layout;
