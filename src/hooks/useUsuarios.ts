import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Usuario {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string | null;
  avatar_url: string | null;
  cargo: string | null;
  ativo: boolean;
  ultimo_acesso: string | null;
  created_at: string;
  roles: string[];
}

export interface ConvitePendente {
  id: string;
  email: string;
  role: string;
  invited_by: string;
  expires_at: string;
  created_at: string;
  invited_by_name?: string;
}

export const useUsuarios = () => {
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("nome_completo");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const usuarios: Usuario[] = profiles.map((profile) => ({
        ...profile,
        roles: roles
          .filter((r) => r.user_id === profile.id)
          .map((r) => r.role),
      }));

      return usuarios;
    },
  });
};

export const useInvitesPendentes = () => {
  return useQuery({
    queryKey: ["invites-pendentes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_invites")
        .select("*")
        .is("accepted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar nomes dos convidadores
      const invitedByIds = [...new Set(data.map((i) => i.invited_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nome_completo")
        .in("id", invitedByIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p.nome_completo]) || []);

      return data.map((invite) => ({
        ...invite,
        invited_by_name: profileMap.get(invite.invited_by) || "Desconhecido",
      })) as ConvitePendente[];
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: string[] }) => {
      // Remove all existing roles
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Add new roles
      if (roles.length > 0) {
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert(roles.map((role) => ({ 
            user_id: userId, 
            role: role as "admin" | "advogado" | "assistente" | "financeiro"
          })));

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Permissões atualizadas com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar permissões: " + error.message);
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      data,
      roles 
    }: { 
      userId: string; 
      data: {
        nome_completo: string;
        telefone: string | null;
        cargo: string | null;
      };
      roles: string[];
    }) => {
      // Update profile data
      const { error: profileError } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", userId);

      if (profileError) throw profileError;

      // Update roles - remove all existing roles
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Add new roles
      if (roles.length > 0) {
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert(roles.map((role) => ({ 
            user_id: userId, 
            role: role as "admin" | "advogado" | "assistente" | "financeiro"
          })));

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Usuário atualizado com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar usuário: " + error.message);
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const response = await supabase.functions.invoke("delete-user", {
        body: { userId },
      });

      if (response.error) throw new Error(response.error.message || "Erro ao excluir usuário");
      if (response.data?.error) throw new Error(response.data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Usuário excluído com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir usuário: " + error.message);
    },
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, ativo }: { userId: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ ativo })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Status atualizado com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });
};

export const useCreateInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const { error } = await supabase.from("user_invites").insert({
        email,
        role: role as "admin" | "advogado" | "assistente" | "financeiro",
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      return { token };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites-pendentes"] });
      toast.success("Convite enviado com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao enviar convite: " + error.message);
    },
  });
};

export const useCancelInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("user_invites")
        .delete()
        .eq("id", inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites-pendentes"] });
      toast.success("Convite cancelado");
    },
    onError: (error: Error) => {
      toast.error("Erro ao cancelar convite: " + error.message);
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      role,
      nome_completo 
    }: { 
      email: string; 
      password: string; 
      role: string;
      nome_completo: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ email, password, role, nome_completo }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar usuário");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Usuário criado com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar usuário: " + error.message);
    },
  });
};

export const useCheckIsAdmin = () => {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Erro ao verificar admin:", error);
        return false;
      }
      return !!data;
    },
  });
};

export const useCanEditProcesso = () => {
  return useQuery({
    queryKey: ["can-edit-processo"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "moderator"]);

      if (error) {
        console.error("Erro ao verificar permissão:", error);
        return false;
      }
      return (data && data.length > 0);
    },
  });
};

export const useResetUserPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      newPassword 
    }: { 
      userId: string; 
      newPassword: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-user-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ user_id: userId, new_password: newPassword }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao redefinir senha");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Senha redefinida com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao redefinir senha: " + error.message);
    },
  });
};
