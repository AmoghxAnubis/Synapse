import Sidebar from "@/components/Sidebar";
import HardwareStatusBanner from "@/components/HardwareStatusBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
    <Sidebar /><div className="flex-1 min-w-0"><HardwareStatusBanner />
      <main className="min-h-screen overflow-y-auto p-4 sm:p-6">{children}</main>
    </div>
  </div>;
}
