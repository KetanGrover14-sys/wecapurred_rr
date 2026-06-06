import React, { useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Alert, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { deletePhoto } from '../services/firestoreService';
import { colors } from '../utils/colors';

const { width } = Dimensions.get('window');

export default function PhotoDetailScreen({ route, navigation }) {
  const { photo, projectId } = route.params;
  const [imageHeight, setImageHeight] = useState(260);

  const handleDelete = () => {
    Alert.alert(
      'Delete Photo',
      'Remove this photo and its specifications? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePhoto(projectId, photo.id);
              navigation.goBack();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete. Please try again.');
            }
          },
        },
      ]
    );
  };

  const date = photo.createdAt?.seconds
    ? new Date(photo.createdAt.seconds * 1000).toLocaleString('en-IN')
    : '';

  const dims = [
    photo.length ? `L: ${photo.length}` : null,
    photo.breadth ? `B: ${photo.breadth}` : null,
    photo.height ? `H: ${photo.height}` : null,
  ]
    .filter(Boolean)
    .join('   ');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Header */}
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Photo Details</Text>
          <TouchableOpacity onPress={handleDelete} style={[styles.iconBtn, { backgroundColor: 'rgba(255,50,50,0.3)' }]}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Full photo */}
        <Image
          source={{ uri: photo.imageUrl }}
          style={[styles.image, { height: imageHeight }]}
          resizeMode="cover"
          onLoad={(e) => {
            const { width: w, height: h } = e.nativeEvent.source;
            const ratio = h / w;
            setImageHeight(Math.min(width * ratio, 400));
          }}
        />

        {/* Specs card */}
        <View style={styles.specsCard}>
          <View style={styles.specsHeader}>
            <Ionicons name="clipboard-outline" size={18} color={colors.primary} />
            <Text style={styles.specsHeaderText}>Specifications</Text>
          </View>

          {!!photo.location && (
            <SpecRow
              icon="location"
              label="Location"
              value={photo.location}
            />
          )}

          {!!dims && (
            <SpecRow
              icon="resize"
              label="Dimensions (L × B × H)"
              value={dims}
            />
          )}

          {!!photo.material && (
            <SpecRow
              icon="layers"
              label="Material / Type"
              value={photo.material}
              valueBadge
            />
          )}

          {!!photo.notes && (
            <SpecRow
              icon="document-text"
              label="Notes"
              value={photo.notes}
              last
            />
          )}

          {!photo.location && !dims && !photo.material && !photo.notes && (
            <Text style={styles.noSpecs}>No specifications added.</Text>
          )}
        </View>

        {/* Meta */}
        {!!date && (
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={13} color={colors.textLight} />
            <Text style={styles.metaText}>Added on {date}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const SpecRow = ({ icon, label, value, valueBadge, last }) => (
  <View style={[styles.specRow, last && { borderBottomWidth: 0 }]}>
    <View style={styles.specIcon}>
      <Ionicons name={`${icon}-outline`} size={16} color={colors.primary} />
    </View>
    <View style={styles.specContent}>
      <Text style={styles.specLabel}>{label}</Text>
      {valueBadge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{value}</Text>
        </View>
      ) : (
        <Text style={styles.specValue}>{value}</Text>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  content: { paddingBottom: 40 },
  image: { width: '100%', backgroundColor: '#111' },
  specsCard: {
    backgroundColor: colors.cardBg, margin: 16, borderRadius: 16,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6,
    overflow: 'hidden',
  },
  specsHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 16, backgroundColor: colors.primaryBg,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  specsHeaderText: { fontSize: 14, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
  specRow: {
    flexDirection: 'row', padding: 14, paddingLeft: 16,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  specIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primaryBg,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12, marginTop: 2,
  },
  specContent: { flex: 1 },
  specLabel: { fontSize: 11, color: colors.textLight, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  specValue: { fontSize: 15, color: colors.text, lineHeight: 22 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryBg, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.primary,
  },
  badgeText: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  noSpecs: { padding: 20, color: colors.textLight, textAlign: 'center', fontSize: 14 },
  meta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 4,
  },
  metaText: { fontSize: 12, color: colors.textLight },
});
