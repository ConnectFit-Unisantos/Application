import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Trainer } from '../types';
import { theme } from '../styles/theme';

interface TrainerCardProps {
  trainer: Trainer;
}

/**
 * Card de personal trainer — foto de capa, nome, localização,
 * tags de especialidade, avaliação e preço por hora.
 * Layout mobile: coluna única, largura total.
 */
export default function TrainerCard({ trainer }: TrainerCardProps) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.92}>
      {/* ── Foto ── */}
      <View style={styles.imageContainer}>
        {trainer.foto ? (
          <Image
            source={{ uri: trainer.foto }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Ionicons
              name="person-outline"
              size={52}
              color={theme.colors.text.muted}
            />
          </View>
        )}

        {/* Badge de certificação na foto */}
        {trainer.certificado && (
          <View style={styles.certBadge}>
            <Ionicons
              name="ribbon-outline"
              size={14}
              color={theme.colors.text.primary}
            />
          </View>
        )}
      </View>

      {/* ── Informações ── */}
      <View style={styles.info}>
        {/* Nome + ícone de certificação */}
        <View style={styles.nameRow}>
          <Text style={styles.name}>{trainer.nome}</Text>
          {trainer.certificado && (
            <Ionicons
              name="ribbon-outline"
              size={16}
              color={theme.colors.text.primary}
            />
          )}
        </View>

        {/* Localização */}
        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={13}
            color={theme.colors.text.secondary}
          />
          <Text style={styles.location}>{trainer.localizacao}</Text>
        </View>

        {/* Tags de especialidade */}
        <View style={styles.tagsRow}>
          {trainer.especialidades.map((esp) => (
            <View key={esp} style={styles.tag}>
              <Text style={styles.tagText}>{esp}</Text>
            </View>
          ))}
        </View>

        {/* Avaliação + Preço */}
        <View style={styles.footer}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={theme.colors.star} />
            <Text style={styles.rating}> {trainer.avaliacao}</Text>
            <Text style={styles.ratingCount}> ({trainer.avaliacoes})</Text>
          </View>
          <Text style={styles.price}>
            R$ {trainer.preco}
            <Text style={styles.priceSuffix}>/hora</Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },

  // ── Foto ──────────────────────────────────────────────────────────────────
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 210,
  },
  imageFallback: {
    backgroundColor: theme.colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  certBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: theme.colors.white,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.card,
  },

  // ── Informações ───────────────────────────────────────────────────────────
  info: {
    padding: theme.spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: theme.spacing.sm,
  },
  location: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },

  // ── Tags ──────────────────────────────────────────────────────────────────
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: theme.spacing.sm,
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

  // ── Rodapé ────────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text.primary,
  },
  ratingCount: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  price: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
  },
  priceSuffix: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.regular,
    color: theme.colors.text.secondary,
  },
});
