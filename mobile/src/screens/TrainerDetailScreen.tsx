import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import AppSafeArea from '../components/AppSafeArea';
import AgendamentoModal from '../components/AgendamentoModal';
import { theme } from '../styles/theme';
import { Review } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TrainerDetail'>;
  route: RouteProp<RootStackParamList, 'TrainerDetail'>;
};

// ─── Componente interno: estrelas ─────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color={theme.colors.star}
        />
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 3, marginVertical: 6 },
});

// ─── Componente interno: item de confiança ────────────────────────────────────

function TrustItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={trustStyles.item}>
      <Ionicons
        name={icon as any}
        size={16}
        color={theme.colors.text.secondary}
      />
      <Text style={trustStyles.text}>{text}</Text>
    </View>
  );
}

const trustStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: 6,
  },
  text: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
});

// ─── Tela ─────────────────────────────────────────────────────────────────────

export default function TrainerDetailScreen({ navigation, route }: Props) {
  const { trainer } = route.params;
  const [showAgendamento, setShowAgendamento] = useState(false);

  return (
    <AppSafeArea style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.dark} />

      {/* ── Cabeçalho ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back-outline"
            size={20}
            color={theme.colors.text.primary}
          />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
      </View>

      {/* ── Conteúdo rolável ──────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Card de informações principais ──────────────────────────────────── */}
        <View style={styles.card}>
          {/* Badge certificado */}
          {trainer.certificado && (
            <View style={styles.certBadge}>
              <Ionicons
                name="ribbon-outline"
                size={13}
                color={theme.colors.text.primary}
              />
              <Text style={styles.certText}>Certificado</Text>
            </View>
          )}

          {/* Foto + info lado a lado */}
          <View style={styles.infoRow}>
            {/* Foto */}
            <View style={styles.photoWrapper}>
              {trainer.foto ? (
                <Image
                  source={{ uri: trainer.foto }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.photo, styles.photoFallback]}>
                  <Ionicons
                    name="person-outline"
                    size={40}
                    color={theme.colors.text.muted}
                  />
                </View>
              )}
            </View>

            {/* Informações textuais */}
            <View style={styles.infoColumn}>
              <Text style={styles.trainerName}>{trainer.nome}</Text>

              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={theme.colors.text.secondary}
                />
                <Text style={styles.locationText}>{trainer.localizacao}</Text>
              </View>

              <View style={styles.ratingRow}>
                <Ionicons name="star" size={15} color={theme.colors.star} />
                <Text style={styles.ratingValue}> {trainer.avaliacao}</Text>
                <Text style={styles.ratingCount}>
                  {' '}({trainer.avaliacoes} avaliações)
                </Text>
              </View>
            </View>
          </View>

          {/* Tags de especialidade */}
          <View style={styles.tagsRow}>
            {trainer.especialidades.map((esp) => (
              <View key={esp} style={styles.tag}>
                <Text style={styles.tagText}>{esp}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Sobre ────────────────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <Text style={styles.bioText}>
            {trainer.bio ?? 'Informações em breve.'}
          </Text>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons
                name="time-outline"
                size={18}
                color={theme.colors.text.secondary}
              />
              <Text style={styles.statLabel}>Experiência</Text>
              <Text style={styles.statValue}>
                {trainer.experiencia != null ? `${trainer.experiencia} anos` : '—'}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Ionicons
                name="cash-outline"
                size={18}
                color={theme.colors.text.secondary}
              />
              <Text style={styles.statLabel}>Valor por hora</Text>
              <Text style={styles.statValue}>R$ {trainer.preco}</Text>
            </View>
          </View>
        </View>

        {/* ── Disponibilidade ───────────────────────────────────────────────────── */}
        {trainer.disponibilidade && trainer.disponibilidade.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Disponibilidade</Text>
            <View style={styles.daysRow}>
              {trainer.disponibilidade.map((dia) => (
                <View key={dia} style={styles.dayPill}>
                  <Text style={styles.dayPillText}>{dia}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Selos de confiança ────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <TrustItem icon="ribbon-outline" text="Profissional verificado" />
          <TrustItem icon="time-outline" text="Resposta em até 24h" />
          <TrustItem icon="calendar-outline" text="Cancelamento flexível" />
        </View>

        {/* ── Avaliações recentes ───────────────────────────────────────────────── */}
        {trainer.avaliacoesRecentes && trainer.avaliacoesRecentes.length > 0 && (
          <View style={[styles.card, styles.cardLast]}>
            <Text style={styles.sectionTitle}>Avaliações Recentes</Text>
            {trainer.avaliacoesRecentes.map((review: Review, index: number) => (
              <View
                key={review.id}
                style={[
                  styles.reviewItem,
                  index < trainer.avaliacoesRecentes!.length - 1 &&
                    styles.reviewSeparator,
                ]}
              >
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewName}>{review.nome}</Text>
                  <Text style={styles.reviewTime}>{review.tempo}</Text>
                </View>
                <StarRating rating={review.nota} />
                <Text style={styles.reviewText}>{review.texto}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Rodapé fixo: agendamento ─────────────────────────────────────────── */}
      <View style={styles.footer}>
        <View style={styles.footerTop}>
          <Text style={styles.footerLabel}>Agendar Aula</Text>
          <View style={styles.footerPriceRow}>
            <Text style={styles.footerPrice}>R$ {trainer.preco}</Text>
            <Text style={styles.footerPriceSuffix}>/hora</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.agendarBtn}
          activeOpacity={0.85}
          onPress={() => setShowAgendamento(true)}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={theme.colors.white}
          />
          <Text style={styles.agendarBtnText}>Agendar Horário</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mensagemBtn} activeOpacity={0.85}>
          <Ionicons
            name="chatbubble-outline"
            size={18}
            color={theme.colors.text.primary}
          />
          <Text style={styles.mensagemBtnText}>Enviar Mensagem</Text>
        </TouchableOpacity>
      </View>
      {/* ── Modal de agendamento ──────────────────────────────────────────── */}
      <AgendamentoModal
        visible={showAgendamento}
        trainerName={trainer.nome}
        onClose={() => setShowAgendamento(false)}
      />
    </AppSafeArea>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.dark,
  },

  // ── Cabeçalho ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.inputBorder,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
  },

  // ── Scroll ────────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 200,
    gap: theme.spacing.sm,
  },

  // ── Cards genéricos ──────────────────────────────────────────────────────────
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  cardLast: {
    marginBottom: 0,
  },

  // ── Card de info principal ────────────────────────────────────────────────────
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.sm,
  },
  certText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
  },
  infoRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  photoWrapper: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    flexShrink: 0,
  },
  photo: {
    width: 110,
    height: 110,
  },
  photoFallback: {
    backgroundColor: theme.colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  trainerName: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    lineHeight: 26,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text.primary,
  },
  ratingCount: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: theme.spacing.md,
  },
  tag: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
  },

  // ── Sobre ─────────────────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  bioText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: theme.colors.divider,
    marginHorizontal: theme.spacing.md,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.fonts.weights.medium,
  },
  statValue: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.semibold,
  },

  // ── Disponibilidade ───────────────────────────────────────────────────────────
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: 4,
  },
  dayPill: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
  },
  dayPillText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
  },

  // ── Avaliações ────────────────────────────────────────────────────────────────
  reviewItem: {
    paddingVertical: theme.spacing.sm,
  },
  reviewSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewName: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
  },
  reviewTime: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  reviewText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginTop: 4,
  },

  // ── Rodapé ────────────────────────────────────────────────────────────────────
  footer: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.inputBorder,
    gap: theme.spacing.sm,
    ...theme.shadows.modal,
  },
  footerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  footerLabel: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text.secondary,
  },
  footerPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  footerPrice: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
  },
  footerPriceSuffix: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  agendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.dark,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
  },
  agendarBtnText: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.white,
  },
  mensagemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    paddingVertical: 14,
  },
  mensagemBtnText: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text.primary,
  },
});
