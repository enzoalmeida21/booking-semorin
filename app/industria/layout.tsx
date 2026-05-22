export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { LogoutButton } from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";

export default async function IndustriaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await getSessionProfile();
  if (!profile || profile.role !== "industria") redirect("/login");

  let industriaNome = "";
  if (profile.industria_id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("industrias")
      .select("nome")
      .eq("id", profile.industria_id)
      .single();
    industriaNome = data?.nome ?? "";
  }

  return (
    <AppShell
      subtitle={industriaNome || "Visão indústria"}
      nav={[{ href: "/industria/galeria", label: "Galeria" }]}
    >
      <div className="flex justify-end mb-4">
        <LogoutButton />
      </div>
      {children}
    </AppShell>
  );
}
