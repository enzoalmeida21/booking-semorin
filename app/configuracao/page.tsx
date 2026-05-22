import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function ConfiguracaoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <Settings className="h-10 w-10 text-primary mb-2" />
          <CardTitle>Configurar Supabase</CardTitle>
          <CardDescription>
            O app precisa das credenciais do seu projeto Supabase para funcionar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              Acesse{" "}
              <a
                href="https://supabase.com/dashboard"
                className="text-primary underline"
                target="_blank"
                rel="noreferrer"
              >
                supabase.com/dashboard
              </a>{" "}
              e crie ou abra um projeto.
            </li>
            <li>
              Em <strong>Settings → API</strong>, copie a <strong>Project URL</strong> e a{" "}
              <strong>anon public</strong> key.
            </li>
            <li>
              Na pasta do projeto, copie o arquivo de exemplo:
              <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                cp .env.example .env.local
              </pre>
            </li>
            <li>
              Edite <code className="bg-muted px-1 rounded">.env.local</code>:
              <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...`}
              </pre>
            </li>
            <li>
              No SQL Editor, execute as migrations em{" "}
              <code className="bg-muted px-1 rounded">supabase/migrations/</code> e o{" "}
              <code className="bg-muted px-1 rounded">seed.sql</code>.
            </li>
            <li>
              Crie os buckets privados <strong>fotos</strong> e <strong>contratos</strong> no
              Storage.
            </li>
            <li>Reinicie o servidor: <code className="bg-muted px-1 rounded">npm run dev</code></li>
          </ol>
          <p className="text-muted-foreground">
            Detalhes completos no arquivo <strong>README.md</strong> do projeto.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Ir para login (após configurar)
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
