import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getProjects } from '../services/apiService';
import ProjectCard from '../components/ProjectCard';
import { colors } from '../utils/colors';

export default function HomeScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [projects, setProjects]   = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProjects = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const data = await getProjects();
      const list = Array.isArray(data) ? data : [];
      setProjects(list);
      setFiltered(list);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not load projects. Check your server URL in src/config.js.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q ? projects.filter(
        (p) => p.name?.toLowerCase().includes(q) || p.client_name?.toLowerCase().includes(q)
      ) : projects
    );
  }, [search, projects]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const totalPhotos = projects.reduce((s, p) => s + (Number(p.photo_count) || 0), 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Norrvex Partner</Text>
            <Text style={styles.headerSub}>{user?.email?.split('@')[0] || 'Employee'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{projects.length}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{totalPhotos}</Text>
            <Text style={styles.statLabel}>Total Photos</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={16} color={colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects or clients..."
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProjectCard
              project={item}
              onPress={() => navigation.navigate('ProjectDetail', { project: item })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={64} color={colors.border} />
              <Text style={styles.emptyTitle}>No Projects Yet</Text>
              <Text style={styles.emptySubtitle}>Tap the + button to create your first project</Text>
            </View>
          }
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : { paddingVertical: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadProjects(true); }}
              colors={[colors.primary]}
            />
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateProject')} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 26, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.3)' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.cardBg, borderRadius: 12,
    margin: 16, paddingHorizontal: 14, paddingVertical: 10,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  loader: { marginTop: 60 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: colors.textLight, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
  },
});
