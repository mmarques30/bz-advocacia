import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import { getAllPermissionKeys } from "@/lib/pagePermissions";

export interface UserPagePermission {
  id: string;
  user_id: string;
  page_key: string;
  can_access: boolean;
  created_at: string;
  updated_at: string;
}

// Buscar permissões de um usuário específico
export const useUserPagePermissions = (userId: string) => {
  return useQuery({
    queryKey: ["user-page-permissions", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_page_permissions")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      return data as UserPagePermission[];
    },
    enabled: !!userId,
  });
};

// Buscar permissões do usuário logado
export const useMyPagePermissions = () => {
  return useQuery({
    queryKey: ["my-page-permissions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Verificar se é admin
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      // Admin tem acesso a tudo
      if (adminRole) {
        return getAllPermissionKeys().map(key => ({
          page_key: key,
          can_access: true,
        }));
      }

      const { data, error } = await supabase
        .from("user_page_permissions")
        .select("page_key, can_access")
        .eq("user_id", user.id);

      if (error) throw error;
      return data || [];
    },
  });
};

// Atualizar permissões de um usuário
export const useUpdateUserPagePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      permissions 
    }: { 
      userId: string; 
      permissions: { page_key: string; can_access: boolean }[];
    }) => {
      // Deletar todas as permissões existentes do usuário
      const { error: deleteError } = await supabase
        .from("user_page_permissions")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Inserir apenas as permissões ativas
      const activePermissions = permissions.filter(p => p.can_access);
      
      if (activePermissions.length > 0) {
        const { error: insertError } = await supabase
          .from("user_page_permissions")
          .insert(
            activePermissions.map(p => ({
              user_id: userId,
              page_key: p.page_key,
              can_access: true,
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user-page-permissions", userId] });
      queryClient.invalidateQueries({ queryKey: ["my-page-permissions"] });
      toast.success("Permissões de página atualizadas com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar permissões: " + error.message);
    },
  });
};

// Hook para verificar se o usuário tem acesso a uma página
export const useHasPageAccess = (pageKey: string) => {
  const { data: permissions, isLoading } = useMyPagePermissions();
  
  if (isLoading) return { hasAccess: false, isLoading: true };
  
  const hasAccess = permissions?.some(
    p => p.page_key === pageKey && p.can_access
  ) || false;
  
  return { hasAccess, isLoading: false };
};
