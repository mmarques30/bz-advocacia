import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import logoBZ from "@/assets/logo-bz-contrato.jpg";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.6,
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#D4A574',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 'auto',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
  },
  paragraph: {
    textAlign: 'justify',
    marginBottom: 10,
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  signatureBlock: {
    width: '40%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 50,
    paddingTop: 5,
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  signatureRole: {
    fontSize: 9,
    color: '#666',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
});

interface ContratoPDFProps {
  conteudo: string;
  titulo: string;
  escritorio: {
    nome_escritorio: string;
    telefone?: string;
    email?: string;
  };
}

export function ContratoPDF({ conteudo, titulo, escritorio }: ContratoPDFProps) {
  const paragrafos = conteudo.split('\n\n').filter(Boolean);

  const renderParagrafo = (paragrafo: string, index: number) => {
    // Título principal do contrato
    if (paragrafo.startsWith('CONTRATO DE')) {
      return (
        <Text key={index} style={styles.title}>
          {paragrafo}
        </Text>
      );
    }

    // Títulos de seções
    if (paragrafo.startsWith('CLÁUSULA') || paragrafo === 'CONTRATANTES') {
      return (
        <Text key={index} style={styles.sectionTitle}>
          {paragrafo}
        </Text>
      );
    }

    // Ignora linhas de assinatura - serão renderizadas separadamente
    if (paragrafo.startsWith('_')) {
      return null;
    }

    // Parágrafos normais
    return (
      <Text key={index} style={styles.paragraph}>
        {paragrafo}
      </Text>
    );
  };

  // Extrai nomes para assinatura
  const extrairAssinaturas = () => {
    const assinaturas: { nome: string; role: string }[] = [];
    const linhas = conteudo.split('\n');
    
    for (let i = 0; i < linhas.length; i++) {
      if (linhas[i].startsWith('_')) {
        const nome = linhas[i + 1]?.trim() || '';
        const role = linhas[i + 2]?.trim() || '';
        if (nome) {
          assinaturas.push({ nome, role });
        }
      }
    }
    
    return assinaturas;
  };

  const assinaturas = extrairAssinaturas();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header com Logo */}
        <View style={styles.header}>
          <Image src={logoBZ} style={styles.logo} />
        </View>

        {/* Conteúdo */}
        {paragrafos.map(renderParagrafo)}

        {/* Assinaturas */}
        {assinaturas.length > 0 && (
          <View style={styles.signatureSection}>
            {assinaturas.map((assinatura, index) => (
              <View key={index} style={styles.signatureBlock}>
                <View style={styles.signatureLine}>
                  <Text style={styles.signatureName}>{assinatura.nome}</Text>
                  <Text style={styles.signatureRole}>{assinatura.role}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {escritorio.nome_escritorio} | {escritorio.telefone} | {escritorio.email}
          </Text>
          <Text>Documento gerado automaticamente</Text>
        </View>
      </Page>
    </Document>
  );
}
