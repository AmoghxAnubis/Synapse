import Sidebar from "@/components/Sidebar";
import HardwareStatusBanner from "@/components/HardwareStatusBanner";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 font-sans">
            {/* Persistent Sidebar Navigation */}
            <Sidebar />

            <div className="flex flex-1 flex-col">
                {/* Global Top Banner for Hardware Status */}
                <HardwareStatusBanner />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto px-6 py-4">
                    {children}
                </main>
            </div>
        </div>
    );
}
