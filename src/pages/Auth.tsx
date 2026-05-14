import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import logoBZ from "@/assets/logo-bz-new.png";
import lawyersImg from "@/assets/lawyers-auth.jpg";
import { hardReloadApp, resetAuthClientState } from "@/lib/authStorage";
import { toast } from "@/lib/toast";

const loginSchema = z.object({
  email: z.string().email("Email inválido").trim(),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Auth() {
  const { signIn, resetPassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: localStorage.getItem('rememberMe') === 'true',
    },
  });

  const rememberMe = watch("rememberMe");

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleClearSession = async () => {
    await resetAuthClientState();
    toast.success('Sessão limpa. Tente entrar novamente.');
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    await signIn(data.email, data.password, data.rememberMe);
    setIsSubmitting(false);
  };

  const handleResetPassword = async () => {
    if (!resetEmail) return;
    await resetPassword(resetEmail);
    setIsResetDialogOpen(false);
    setResetEmail("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Images with Overlay */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[image:var(--gradient-overlay)]" style={{
          background: 'linear-gradient(135deg, hsla(72, 6%, 18%, 0.35) 0%, hsla(220, 4%, 40%, 0.25) 100%)'
        }} />
        <div 
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `url(${lawyersImg})`,
            backgroundSize: '100% auto',
            backgroundPosition: 'center 50%',
            backgroundRepeat: 'no-repeat',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card/30 backdrop-blur-xl rounded-3xl shadow-[var(--shadow-elegant)] border border-border/50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/3 to-secondary/3 p-8 text-center border-b border-border/50">
              <div className="flex justify-center mb-6">
                <img src={logoBZ} alt="B&Z Advocacia" className="h-32 w-auto" />
              </div>
              <h1 className="text-3xl font-seasons font-bold text-card-foreground mb-2">
                Área Interna
              </h1>
              <p className="text-sm text-muted-foreground">
                Acesse sua conta para gerenciar leads e casos
              </p>
            </div>

            {/* Login Form */}
            <div className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...register("email")}
                    className="bg-background/50"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...register("password")}
                      className="bg-background/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => 
                        setValue("rememberMe", checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Lembrar-me
                    </Label>
                  </div>

                  <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-sm text-primary hover:underline"
                      >
                        Esqueci minha senha
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="font-seasons">Recuperar Senha</DialogTitle>
                        <DialogDescription>
                          Digite seu email para receber o link de recuperação
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="resetEmail">Email</Label>
                          <Input
                            id="resetEmail"
                            type="email"
                            placeholder="seu@email.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleResetPassword}
                          className="w-full"
                          disabled={!resetEmail}
                        >
                          Enviar Link de Recuperação
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center space-y-2">
            <button
              type="button"
              onClick={hardReloadApp}
              className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white underline-offset-2 hover:underline transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Problemas para entrar? Recarregar sistema
            </button>
            <p className="text-sm text-white/70">
              © 2025 Borges & Zembruski Advocacia
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
