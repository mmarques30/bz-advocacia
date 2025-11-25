/**
 * Validar se uma URL é um link válido do Google Drive
 */
export function validarLinkDrive(url: string): boolean {
  const padroes = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/,
  ];
  
  return padroes.some(padrao => padrao.test(url));
}

/**
 * Extrair o File ID de um link do Google Drive
 */
export function extrairFileId(url: string): string | null {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

/**
 * Gerar link de visualização direto para o Google Drive
 */
export function gerarLinkVisualizacao(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Gerar URL de thumbnail (opcional, para uso futuro)
 */
export function gerarThumbnail(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
}
