import { AuthGuard } from "@/components/auth-guard";
import { Nav } from "@/components/nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <div className="md:pl-60">
          <main className="mx-auto max-w-6xl p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}