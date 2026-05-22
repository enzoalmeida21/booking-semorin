import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { formatBrazil } from "@/lib/dates";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10 },
  cover: { marginBottom: 40, textAlign: "center" },
  title: { fontSize: 22, marginBottom: 8, fontWeight: "bold" },
  subtitle: { fontSize: 12, color: "#555" },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 4,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photoBlock: { width: "30%", marginBottom: 12 },
  photo: { width: "100%", height: 120, objectFit: "cover" },
  caption: { fontSize: 8, marginTop: 4, color: "#333" },
});

export interface BookPhoto {
  url: string;
  produto: string;
  estoque: string;
  captured_at: string;
  promotor?: string;
}

export interface BookLojaSection {
  codigo: string;
  nome: string;
  municipio: string;
  uf: string;
  fotos: BookPhoto[];
}

interface BookDocumentProps {
  industriaNome: string;
  periodo: string;
  lojas: BookLojaSection[];
  totalFotos: number;
}

export function BookDocument({
  industriaNome,
  periodo,
  lojas,
  totalFotos,
}: BookDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.cover}>
          <Text style={styles.title}>Book de Fotos Trade Marketing</Text>
          <Text style={styles.subtitle}>{industriaNome}</Text>
          <Text style={styles.subtitle}>Período: {periodo}</Text>
          <Text style={styles.subtitle}>
            {totalFotos} fotos · {lojas.length} lojas
          </Text>
        </View>
      </Page>
      {lojas.map((loja) => (
        <Page key={loja.codigo} size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {loja.codigo} — {loja.nome}
            </Text>
            <Text style={styles.subtitle}>
              {loja.municipio}, {loja.uf}
            </Text>
            <View style={styles.grid}>
              {loja.fotos.map((foto, i) => (
                <View key={i} style={styles.photoBlock}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={foto.url} style={styles.photo} />
                  <Text style={styles.caption}>{foto.produto}</Text>
                  <Text style={styles.caption}>
                    Estoque: {foto.estoque}
                  </Text>
                  <Text style={styles.caption}>
                    {formatBrazil(foto.captured_at, "dd/MM/yyyy HH:mm")}
                  </Text>
                  {foto.promotor && (
                    <Text style={styles.caption}>Promotor: {foto.promotor}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
}
