import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';

const ProjectCard = ({ project, onPress }) => {
  const date = project.createdAt?.seconds
    ? new Date(project.createdAt.seconds * 1000).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : 'Date N/A';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.leftAccent} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{project.name}</Text>
          <View style={styles.countBadge}>
            <Ionicons name="images-outline" size={12} color={colors.primary} />
            <Text style={styles.countText}>{project.photoCount || 0}</Text>
          </View>
        </View>
        <Text style={styles.client} numberOfLines={1}>
          <Ionicons name="person-outline" size={12} color={colors.textLight} />
          {'  '}{project.clientName}
        </Text>
        {!!project.description && (
          <Text style={styles.desc} numberOfLines={2}>{project.description}</Text>
        )}
        <View style={styles.footer}>
          <Ionicons name="calendar-outline" size={12} color={colors.textLight} />
          <Text style={styles.date}>{date}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.border} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    paddingRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  leftAccent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  content: { flex: 1, paddingHorizontal: 14, paddingVertical: 14 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryBg,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  countText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  client: { fontSize: 13, color: colors.textMedium, marginBottom: 4 },
  desc: { fontSize: 12, color: colors.textLight, lineHeight: 18, marginBottom: 6 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  date: { fontSize: 11, color: colors.textLight, marginLeft: 2 },
});

export default ProjectCard;
