import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { LogoutButton } from "@/components/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await getSessionProfile();
  if (!profile || profile.role !== "admin") redirect("/login");

  return (
    <AppShell
      subtitle="Painel Mustafa"
      nav={[
        { href: "/admin", label: "Início" },
        { href: "/admin/fotos", label: "Fotos" },
        { href: "/admin/promotores", label: "Promotores" },
        { href: "/admin/lojas", label: "Lojas" },
        { href: "/admin/produtos", label: "Produtos" },
        { href: "/admin/industrias", label: "Indústrias" },
      ]}
    >
      <div className="flex justify-end mb-4">
        <LogoutButton />
      </div>
      {children}
    </AppShell>
  );
}
