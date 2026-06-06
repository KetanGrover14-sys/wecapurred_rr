import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';

const CARD_W = (Dimensions.get('window').width - 48) / 2;

const PhotoCard = ({ photo, onPress }) => {
  const dims = [photo.length, photo.breadth, photo.height]
    .filter(Boolean)
    .join(' × ');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <Image source={{ uri: photo.imageUrl }} style={styles.image} resizeMode="cover" />
      <View style={styles.overlay}>
        {!!photo.material && (
          <View style={styles.materialBadge}>
            <Text style={styles.materialText} numberOfLines={1}>{photo.material}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        {!!photo.location && (
          <View style={styles.row}>
            <Ionicons name="location-outline" size={11} color={colors.primary} />
            <Text style={styles.infoText} numberOfLines={1}>{photo.location}</Text>
          </View>
        )}
        {!!dims && (
          <View style={styles.row}>
            <Ionicons name="resize-outline" size={11} color={colors.textLight} />
            <Text style={styles.dimText} numberOfLines={1}>{dims}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    margin: 6,
  },
  image: { width: '100%', height: CARD_W * 0.85 },
  overlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  materialBadge: {
    backgroundColor: 'rgba(204,0,0,0.85)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    maxWidth: CARD_W * 0.75,
  },
  materialText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  info: { padding: 8, gap: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 11, color: colors.textMedium, flex: 1 },
  dimText: { fontSize: 10, color: colors.textLight, flex: 1 },
});

export default PhotoCard;
