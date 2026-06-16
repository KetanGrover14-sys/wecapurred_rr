import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
// To enable auto-location: run `npx expo install expo-location` then uncomment the import
// import * as Location from 'expo-location';
import { addPhoto } from '../services/apiService';
import { colors } from '../utils/colors';

const MATERIALS = ['Non-Lit', 'GSB', 'GSB-D/S', 'VSB', 'Other'];

const blankEntry = () => ({
  _id: Date.now() + Math.random(),
  material: '', length: '', breadth: '', height: '', notes: '',
});

export default function AddSpecsScreen({ route, navigation }) {
  const { imageUri, projectId } = route.params;

  const [location, setLocation]     = useState('');
  const [locLoading, setLocLoading] = useState(false);
  const [entries, setEntries]       = useState([blankEntry()]);
  const [uploading, setUploading]   = useState(false);
  const [progress, setProgress]     = useState(0);

  // Auto-location is disabled until expo-location is installed.
  // To enable: run `npx expo install expo-location`, uncomment the import above,
  // then replace this function with the Location-based implementation.
  const fetchLocation = useCallback(() => {
    Alert.alert('Manual Entry', 'Install expo-location to enable auto GPS detection.');
  }, []);

  // No auto-fetch on mount — user types location manually

  // ── Entry helpers ──────────────────────────────────────────
  const addEntry    = () => setEntries((e) => [...e, blankEntry()]);
  const removeEntry = (id) => setEntries((e) => e.filter((x) => x._id !== id));
  const updateEntry = (id, field, value) =>
    setEntries((e) => e.map((x) => x._id === id ? { ...x, [field]: value } : x));

  // ── Save ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!location.trim()) {
      Alert.alert('Required', 'Please enter the location of this banner/hoarding.');
      return;
    }
    setUploading(true);
    try {
      await addPhoto(projectId, location.trim(), entries, imageUri, (p) => setProgress(p));
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save photo. Check your server and AWS S3 credentials.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.headerTitle}>Add Specifications</Text>
            <Text style={styles.headerSub}>{entries.length} entr{entries.length === 1 ? 'y' : 'ies'} · same image</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Photo preview */}
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />

        {/* Location (shared) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={15} color={colors.primary} />
            <Text style={styles.cardTitle}>LOCATION *</Text>
            <Text style={styles.cardNote}>(shared for all entries)</Text>
          </View>
          <View style={styles.locationRow}>
            <View style={[styles.inputBox, { flex: 1 }]}>
              <TextInput
                style={styles.input}
                placeholder={locLoading ? 'Fetching location…' : 'Full address or landmark'}
                placeholderTextColor={colors.textLight}
                value={location}
                onChangeText={setLocation}
                multiline
                numberOfLines={2}
                editable={!locLoading}
              />
            </View>
            <TouchableOpacity onPress={fetchLocation} style={styles.locBtn} disabled={locLoading}>
              {locLoading
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Ionicons name="locate" size={20} color={colors.primary} />
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* Entries */}
        {entries.map((entry, idx) => (
          <View key={entry._id} style={styles.card}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryLabel}>ENTRY {idx + 1}</Text>
              {entries.length > 1 && (
                <TouchableOpacity onPress={() => removeEntry(entry._id)} style={styles.removeBtn}>
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>

            {/* Material chips */}
            <View style={styles.sectionRow}>
              <Ionicons name="layers-outline" size={14} color={colors.primary} />
              <Text style={styles.fieldLabel}>MATERIAL / TYPE</Text>
            </View>
            <View style={styles.materialGrid}>
              {MATERIALS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.chip, entry.material === m && styles.chipActive]}
                  onPress={() => updateEntry(entry._id, 'material', entry.material === m ? '' : m)}
                >
                  <Text style={[styles.chipText, entry.material === m && styles.chipTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Dimensions */}
            <View style={[styles.sectionRow, { marginTop: 14 }]}>
              <Ionicons name="resize-outline" size={14} color={colors.primary} />
              <Text style={styles.fieldLabel}>DIMENSIONS (L × B × H)</Text>
            </View>
            <View style={styles.dimRow}>
              {[['length','L'],['breadth','B'],['height','H']].map(([field, lbl]) => (
                <View key={field} style={styles.dimItem}>
                  <Text style={styles.dimLabel}>{lbl}</Text>
                  <View style={styles.dimInputBox}>
                    <TextInput
                      style={styles.dimInput}
                      placeholder="e.g. 10ft"
                      placeholderTextColor={colors.textLight}
                      value={entry[field]}
                      onChangeText={(v) => updateEntry(entry._id, field, v)}
                      keyboardType="default"
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Notes */}
            <View style={[styles.sectionRow, { marginTop: 14 }]}>
              <Ionicons name="document-text-outline" size={14} color={colors.primary} />
              <Text style={styles.fieldLabel}>NOTES</Text>
            </View>
            <View style={styles.inputBox}>
              <TextInput
                style={[styles.input, { height: 70 }]}
                placeholder="Any additional notes..."
                placeholderTextColor={colors.textLight}
                value={entry.notes}
                onChangeText={(v) => updateEntry(entry._id, 'notes', v)}
                multiline numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        ))}

        {/* Add entry */}
        <TouchableOpacity style={styles.addEntryBtn} onPress={addEntry} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.addEntryText}>Add Another Entry (same image)</Text>
        </TouchableOpacity>

        {/* Upload progress */}
        {uploading && (
          <View style={styles.progressCard}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.progressText}>Uploading… {progress}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        )}

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, uploading && styles.btnDisabled]}
          onPress={handleSave}
          disabled={uploading}
          activeOpacity={0.85}
        >
          {uploading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="cloud-upload" size={22} color="#fff" />
                <Text style={styles.saveBtnText}>
                  Save {entries.length > 1 ? `${entries.length} Photos` : 'Photo'}
                </Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 19, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  preview: { width: '100%', height: 200, backgroundColor: '#000' },
  card: {
    backgroundColor: colors.cardBg, borderRadius: 16,
    margin: 16, marginBottom: 0, padding: 16,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  cardTitle: { fontSize: 11, fontWeight: '700', color: colors.textLight, letterSpacing: 1 },
  cardNote: { fontSize: 10, color: colors.textLight, marginLeft: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  locBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  entryLabel: { fontSize: 11, fontWeight: '700', color: colors.textLight, letterSpacing: 1 },
  removeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center',
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.textLight, letterSpacing: 0.8 },
  materialGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primaryBg, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textMedium, fontWeight: '500' },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  dimRow: { flexDirection: 'row', gap: 10 },
  dimItem: { flex: 1 },
  dimLabel: { fontSize: 11, color: colors.textMedium, fontWeight: '600', marginBottom: 6, textAlign: 'center' },
  dimInputBox: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.background },
  dimInput: { padding: 10, fontSize: 13, color: colors.text, textAlign: 'center' },
  inputBox: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.background },
  input: { padding: 12, fontSize: 14, color: colors.text },
  addEntryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    margin: 16, marginBottom: 0, paddingVertical: 14,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, borderStyle: 'dashed',
    backgroundColor: colors.background,
  },
  addEntryText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  progressCard: {
    margin: 16, marginBottom: 0, padding: 16,
    backgroundColor: colors.cardBg, borderRadius: 12,
    alignItems: 'center', gap: 8,
  },
  progressText: { fontSize: 14, color: colors.textMedium, fontWeight: '600' },
  progressBar: { width: '100%', height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  saveBtn: {
    margin: 16, marginTop: 20, backgroundColor: colors.primary,
    borderRadius: 14, height: 54,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    elevation: 4, shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8,
  },
  btnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
