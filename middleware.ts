import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isContractExpired } from "@/lib/dates";

const PUBLIC_PATHS = [
  "/login",
  "/cadastro/promotor",
  "/cadastro/aguardando-aprovacao",
  "/contrato-vencido",
  "/configuracao",
];

const PROMOTOR_STATUS_PATHS = [
  "/cadastro/aguardando-aprovacao",
  "/contrato-vencido",
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const { supabase, supabaseResponse, user, configured } =
    await updateSession(request);

  if (!configured) {
    if (path === "/configuracao" || path.startsWith("/_next")) {
      return supabaseResponse;
    }
    if (path === "/") {
      return NextResponse.redirect(new URL("/configuracao", request.url));
    }
    return NextResponse.redirect(new URL("/configuracao", request.url));
  }

  if (
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.includes(".")
  ) {
    return supabaseResponse;
  }

  if (path === "/") {
    if (user && supabase) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", user.id)
        .single();
      if (profile) {
        const home = getHome(profile.role, profile.status);
        return NextResponse.redirect(new URL(home, request.url));
      }
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => path === p || path.startsWith(p + "/")
  );

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  if (!user || !supabase) return supabaseResponse;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (!profile) return supabaseResponse;

  if (profile.role === "promotor") {
    if (profile.status === "pendente") {
      if (!path.startsWith("/cadastro/aguardando-aprovacao")) {
        return NextResponse.redirect(
          new URL("/cadastro/aguardando-aprovacao", request.url)
        );
      }
      return supabaseResponse;
    }

    if (profile.status === "inativo") {
      if (path !== "/login") {
        return NextResponse.redirect(
          new URL("/login?error=conta_inativa", request.url)
        );
      }
      return supabaseResponse;
    }

    if (profile.status === "contrato_vencido") {
      if (!path.startsWith("/contrato-vencido") && path !== "/login") {
        return NextResponse.redirect(
          new URL("/contrato-vencido", request.url)
        );
      }
      return supabaseResponse;
    }

    if (profile.status === "ativo") {
      const { data: contrato } = await supabase
        .from("contratos")
        .select("data_vencimento")
        .eq("promotor_id", user.id)
        .eq("ativo", true)
        .order("data_vencimento", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (contrato && isContractExpired(contrato.data_vencimento)) {
        await supabase
          .from("profiles")
          .update({ status: "contrato_vencido" })
          .eq("id", user.id);

        if (!path.startsWith("/contrato-vencido")) {
          return NextResponse.redirect(
            new URL("/contrato-vencido", request.url)
          );
        }
        return supabaseResponse;
      }

      if (PROMOTOR_STATUS_PATHS.some((p) => path.startsWith(p))) {
        return NextResponse.redirect(
          new URL("/promotor/enviar", request.url)
        );
      }

      if (path.startsWith("/admin") || path.startsWith("/industria")) {
        return NextResponse.redirect(
          new URL("/promotor/enviar", request.url)
        );
      }
    }
  }

  if (profile.role === "industria" && path.startsWith("/promotor")) {
    return NextResponse.redirect(new URL("/industria/galeria", request.url));
  }

  if (profile.role === "admin" && path.startsWith("/promotor")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (profile.role === "promotor" && path.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/promotor/enviar", request.url));
  }

  if (profile.role === "industria" && path.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/industria/galeria", request.url));
  }

  if (profile.role === "admin" && path.startsWith("/industria")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return supabaseResponse;
}

function getHome(role: string, status: string | null) {
  if (role === "admin") return "/admin";
  if (role === "industria") return "/industria/galeria";
  if (status === "pendente") return "/cadastro/aguardando-aprovacao";
  if (status === "contrato_vencido") return "/contrato-vencido";
  return "/promotor/enviar";
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
