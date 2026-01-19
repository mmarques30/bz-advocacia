import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import logoBZ from "@/assets/logo-bz-branco.jpg";
import fotoAdvogadas from "@/assets/advogadas-bz.png";
import { TEXTO_INSTITUCIONAL, TEXTO_SERVICO_COMPLETO } from "@/lib/propostaTemplates";

const brandColor = '#8B4513';
const brandColorLight = '#D4A574';

const styles = StyleSheet.create({
  // Page styles
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.6,
    color: '#333333',
  },
  
  // Page 1 - Apresentação
  page1: {
    padding: 0,
  },
  page1Container: {
    flexDirection: 'row',
    height: '100%',
  },
  page1Left: {
    width: '45%',
    height: '100%',
  },
  page1Image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  page1Right: {
    width: '55%',
    padding: 40,
    justifyContent: 'center',
    backgroundColor: '#FDFBF7',
  },
  page1Title: {
    fontSize: 22,
    color: brandColor,
    marginBottom: 8,
    fontFamily: 'Helvetica-Bold',
  },
  page1Subtitle: {
    fontSize: 14,
    color: brandColor,
    marginBottom: 30,
    fontStyle: 'italic',
  },
  page1Text: {
    fontSize: 10,
    lineHeight: 1.8,
    textAlign: 'justify',
    color: '#555555',
  },
  
  // Pages 2-4 common styles
  pageContent: {
    padding: 50,
  },
  logo: {
    width: 140,
    height: 'auto',
    marginBottom: 30,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    color: brandColor,
    textAlign: 'center',
    marginBottom: 30,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: brandColorLight,
    fontFamily: 'Helvetica-Bold',
  },
  
  // Page 2 - Proposta
  greeting: {
    fontSize: 12,
    marginBottom: 20,
  },
  propostaText: {
    fontSize: 11,
    lineHeight: 1.8,
    textAlign: 'justify',
    marginBottom: 15,
  },
  
  // Page 3 - Honorários
  table: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: brandColorLight,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: brandColorLight,
  },
  tableRowLast: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: brandColor,
    padding: 12,
    flex: 1,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  tableCell: {
    padding: 12,
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  tableCellText: {
    fontSize: 11,
  },
  tableCellValue: {
    padding: 12,
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tableCellValueText: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: brandColor,
  },
  
  // Page 4 - Contato
  page4Container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoLarge: {
    width: 200,
    height: 'auto',
    marginBottom: 40,
  },
  contactTitle: {
    fontSize: 14,
    color: brandColor,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Helvetica-Bold',
  },
  contactText: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 8,
  },
  contactOAB: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666666',
    marginBottom: 15,
  },
  contactAddress: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666666',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: brandColorLight,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
  },
});

interface PropostaPDFProps {
  clienteNome: string;
  descricaoServico: string;
  valorEntrada: number;
  descontoAvista: number;
  percentualExito: number;
  condicoesAdicionais: string;
}

export const PropostaPDF = ({
  clienteNome,
  descricaoServico,
  valorEntrada,
  descontoAvista,
  percentualExito,
  condicoesAdicionais,
}: PropostaPDFProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const textoServico = TEXTO_SERVICO_COMPLETO.replace('{descricao_servico}', descricaoServico);

  return (
    <Document>
      {/* Página 1 - Apresentação */}
      <Page size="A4" style={[styles.page, styles.page1]}>
        <View style={styles.page1Container}>
          <View style={styles.page1Left}>
            <Image src={fotoAdvogadas} style={styles.page1Image} />
          </View>
          <View style={styles.page1Right}>
            <Text style={styles.page1Title}>
              Muito prazer, somos{'\n'}Borges & Zembruski Advocacia
            </Text>
            <Text style={styles.page1Subtitle}>
              Escuta ativa, Advocacia Artesanal
            </Text>
            <Text style={styles.page1Text}>
              {TEXTO_INSTITUCIONAL}
            </Text>
          </View>
        </View>
      </Page>

      {/* Página 2 - Proposta */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageContent}>
          <Image src={logoBZ} style={styles.logo} />
          <Text style={styles.sectionTitle}>Proposta</Text>
          
          <Text style={styles.greeting}>
            Prezado(a) Sr(a). {clienteNome},
          </Text>
          
          <Text style={styles.propostaText}>
            Conforme solicitado, apresentamos nossa proposta para realização dos serviços requeridos.
          </Text>
          
          <Text style={styles.propostaText}>
            {textoServico}
          </Text>
        </View>
        <Text style={styles.footer}>Borges & Zembruski Advocacia</Text>
      </Page>

      {/* Página 3 - Honorários */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageContent}>
          <Image src={logoBZ} style={styles.logo} />
          <Text style={styles.sectionTitle}>Honorários</Text>
          
          <Text style={styles.propostaText}>
            Pelos serviços descritos serão cobrados honorários conforme descrito abaixo:
          </Text>
          
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableCell}>
                <Text style={styles.tableCellText}>Valor da Entrada</Text>
              </View>
              <View style={styles.tableCellValue}>
                <Text style={styles.tableCellValueText}>{formatCurrency(valorEntrada)}</Text>
              </View>
            </View>
            
            {percentualExito > 0 && (
              <View style={styles.tableRow}>
                <View style={styles.tableCell}>
                  <Text style={styles.tableCellText}>Percentual de Êxito</Text>
                </View>
                <View style={styles.tableCellValue}>
                  <Text style={styles.tableCellValueText}>{percentualExito}% sobre o valor obtido</Text>
                </View>
              </View>
            )}
            
            {descontoAvista > 0 && (
              <View style={styles.tableRow}>
                <View style={styles.tableCell}>
                  <Text style={styles.tableCellText}>Condição Especial</Text>
                </View>
                <View style={styles.tableCellValue}>
                  <Text style={styles.tableCellValueText}>Desconto de {descontoAvista}% à vista</Text>
                </View>
              </View>
            )}
            
            {condicoesAdicionais && (
              <View style={styles.tableRowLast}>
                <View style={styles.tableCell}>
                  <Text style={styles.tableCellText}>Condições Adicionais</Text>
                </View>
                <View style={styles.tableCellValue}>
                  <Text style={styles.tableCellValueText}>{condicoesAdicionais}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.footer}>Borges & Zembruski Advocacia</Text>
      </Page>

      {/* Página 4 - Contato */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.pageContent, styles.page4Container]}>
          <Image src={logoBZ} style={styles.logoLarge} />
          
          <Text style={styles.contactTitle}>Advogada(s) Contratada(s)</Text>
          
          <Text style={styles.contactText}>Eliziane Zembruski Taborda</Text>
          <Text style={styles.contactOAB}>OAB/RS 115.245</Text>
          
          <Text style={styles.contactText}>Juliana Lima Borges Gasparini</Text>
          <Text style={styles.contactOAB}>OAB/RS 83.345</Text>
          
          <Text style={styles.contactAddress}>
            Av. Ipiranga, 7464, sala 416{'\n'}
            Jardim Botânico - Porto Alegre/RS{'\n'}
            CEP 91530-000
          </Text>
        </View>
      </Page>
    </Document>
  );
};
