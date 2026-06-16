import { Navigate } from "react-router-dom";

// A pagina dedicada de Prazos foi absorvida pela aba "Calendário" dentro
// de Tarefas (/dashboard/processos/demandas?tab=calendario). Mantemos a
// rota antiga aqui so pra redirecionar e nao quebrar links bookmarks.
export default function ProcessosCalendario() {
  return <Navigate to="/dashboard/processos/demandas?tab=calendario" replace />;
}
