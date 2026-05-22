import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { LogoutButton } from "@/components/LogoutButton";

export default async function PromotorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await getSessionProfile();
  if (!profile || profile.role !== "promotor") redirect("/login");

  return (
    <AppShell subtitle="Mustafa — Envio de fotos">
      <div className="flex justify-end mb-4">
        <LogoutButton />
      </div>
      {children}
    </AppShell>
  );
}
