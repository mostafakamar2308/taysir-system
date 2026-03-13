import Sidebar from "@/components/dashboard/common/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar />
        <div className="flex-1 flex md:pr-60 flex-col min-w-0">
          <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
