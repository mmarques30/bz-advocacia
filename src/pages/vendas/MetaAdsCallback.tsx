import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import { Loader2 } from "lucide-react";

export default function MetaAdsCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        setStatus("error");
        setErrorMessage(errorDescription || "Autorização negada pelo usuário");
        toast.error("Autorização negada: " + (errorDescription || error));
        setTimeout(() => navigate("/dashboard/vendas/meta-ads"), 3000);
        return;
      }

      if (!code || !state) {
        setStatus("error");
        setErrorMessage("Parâmetros de callback inválidos");
        toast.error("Parâmetros de callback inválidos");
        setTimeout(() => navigate("/dashboard/vendas/meta-ads"), 3000);
        return;
      }

      // Verify state
      const savedState = sessionStorage.getItem("meta_oauth_state");
      if (state !== savedState) {
        setStatus("error");
        setErrorMessage("Estado OAuth inválido. Tente novamente.");
        toast.error("Estado OAuth inválido");
        setTimeout(() => navigate("/dashboard/vendas/meta-ads"), 3000);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke("meta-callback", {
          body: { code, state },
        });

        if (fnError) throw fnError;

        if (data?.error) {
          throw new Error(data.error);
        }

        sessionStorage.removeItem("meta_oauth_state");
        setStatus("success");
        toast.success("Conectado ao Meta Ads com sucesso!");
        setTimeout(() => navigate("/dashboard/vendas/meta-ads"), 2000);
      } catch (err) {
        console.error("Error processing callback:", err);
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Erro ao processar callback");
        toast.error("Erro ao conectar: " + (err instanceof Error ? err.message : "Erro desconhecido"));
        setTimeout(() => navigate("/dashboard/vendas/meta-ads"), 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {status === "processing" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <h2 className="text-xl font-semibold">Processando conexão...</h2>
            <p className="text-muted-foreground">Aguarde enquanto conectamos sua conta Meta Ads.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="h-12 w-12 rounded-full bg-green-100 mx-auto flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-600">Conectado com sucesso!</h2>
            <p className="text-muted-foreground">Redirecionando...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="h-12 w-12 rounded-full bg-red-100 mx-auto flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-600">Erro na conexão</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
            <p className="text-sm text-muted-foreground">Redirecionando...</p>
          </>
        )}
      </div>
    </div>
  );
}
