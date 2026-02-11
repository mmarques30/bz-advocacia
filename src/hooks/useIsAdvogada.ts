import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const ADVOGADAS_EMAILS = [
  'julianalimaborges@hotmail.com',
  'liziztaborda@hotmail.com',
];

export const useIsAdvogada = () => {
  const [isAdvogada, setIsAdvogada] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdvogada(!!user?.email && ADVOGADAS_EMAILS.includes(user.email.toLowerCase()));
      setLoading(false);
    };
    check();
  }, []);

  return { isAdvogada, loading };
};
