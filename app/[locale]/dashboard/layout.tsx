import MobileHeader from "@/components/dashboard/common/mobileHeader";
import Sidebar from "@/components/dashboard/common/sidebar";
import { SocketAuthProvider } from "@/components/providers/socketAuth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/lib/contexts/auth";
import { WhatsAppProvider } from "@/lib/contexts/whatsapp";

const Layout: React.FC<{ children: React.ReactNode }> = async ({
  children,
}) => {
  return (
    <AuthProvider>
      <SocketAuthProvider>
        <SidebarProvider>
          <WhatsAppProvider>
            <div className="min-h-screen flex w-full">
              <Sidebar />
              <div className="flex-1 flex md:pr-60 flex-col min-w-0">
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
