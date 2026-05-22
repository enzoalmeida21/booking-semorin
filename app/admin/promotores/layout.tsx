import { Suspense } from "react";

export default function PromotoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Carregando...</p>}>
      {children}
    </Suspense>
  );
}
