import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <div className="pl-64 min-h-full">
        <Header />
        <main className="p-8">{children}</main>
      </div>
    </>
  );
}
