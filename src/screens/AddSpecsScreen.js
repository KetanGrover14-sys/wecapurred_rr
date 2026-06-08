import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { addPhoto } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/colors';

const MATERIALS = ['Non-Lit', 'GSB', 'GSB-D/S', 'VSB','Other'];

export default function AddSpecsScreen({ route, navigation }) {
  const { imageUri, projectId } = route.params;
  const { user } = useAuth();

  const [length, setLength] = useState('');
  const [breadth, setBreadth] = useState('');
  const [height, setHeight] = useState('');
  const [location, setLocation] = useState('');
  const [material, setMaterial] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSave = async () => {
    if (!location.trim()) {
      Alert.alert('Required', 'Please enter the location of this banner/hoarding.');
      return;
    }
    setUploading(true);
    try {
      await addPhoto(
        projectId,
        {
          length: length.trim(),
          breadth: breadth.trim(),
          height: height.trim(),
          location: location.trim(),
          material,
          notes: notes.trim(),
          createdBy: user.uid,
        },
        imageUri,
        (p) => setProgress(p)
      );
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save photo. Please check your internet connection.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Specifications</Text>
          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Photo preview */}
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />

        {/* Dimensions card */}
        <View style={styles.card}>
          <SectionTitle icon="resize-outline" title="DIMENSIONS" />

          <View style={styles.dimRow}>
            <DimInput label="Length" value={length} onChange={setLength} placeholder="e.g. 10 ft" />
            <DimInput label="Breadth" value={breadth} onChange={setBreadth} placeholder="e.g. 5 ft" />
            <DimInput label="Height" value={height} onChange={setHeight} placeholder="e.g. 15 ft" />
          </View>
        </View>

        {/* Location card */}
        <View style={styles.card}>
          <SectionTitle icon="location-outline" title="LOCATION *" />
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="Full address or landmark"
              placeholderTextColor={colors.textLight}
              value={location}
              onChangeText={setLocation}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {/* Material card */}
        <View style={styles.card}>
          <SectionTitle icon="layers-outline" title="MATERIAL / TYPE" />
          <View style={styles.materialGrid}>
            {MATERIALS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.materialChip, material === m && styles.materialChipActive]}
                onPress={() => setMaterial(material === m ? '' : m)}
              >
                <Text style={[styles.materialChipText, material === m && styles.materialChipTextActive]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes card */}
        <View style={styles.card}>
          <SectionTitle icon="document-text-outline" title="NOTES" />
          <View style={styles.inputBox}>
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Any additional notes or specifications..."
              placeholderTextColor={colors.textLight}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Upload progress */}
        {uploading && (
          <View style={styles.progressCard}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.progressText}>Uploading... {progress}%</Text>
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
                <Text style={styles.saveBtnText}>Save & Upload</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const SectionTitle = ({ icon, title }) => (
  <View style={styles.sectionTitle}>
    <Ionicons name={icon} size={15} color={colors.primary} />
    <Text style={styles.sectionTitleText}>{title}</Text>
  </View>
);

const DimInput = ({ label, value, onChange, placeholder }) => (
  <View style={styles.dimItem}>
    <Text style={styles.dimLabel}>{label}</Text>
    <View style={styles.dimInputBox}>
      <TextInput
        style={styles.dimInput}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        value={value}
        onChangeText={onChange}
        keyboardType="default"
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  preview: { width: '100%', height: 220, backgroundColor: '#000' },
  card: {
    backgroundColor: colors.cardBg, borderRadius: 16, margin: 16, marginBottom: 0,
    padding: 16, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6,
  },
  sectionTitle: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14,
    paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  sectionTitleText: {
    fontSize: 11, fontWeight: '700', color: colors.textLight, letterSpacing: 1,
  },
  dimRow: { flexDirection: 'row', gap: 10 },
  dimItem: { flex: 1 },
  dimLabel: { fontSize: 11, color: colors.textMedium, fontWeight: '600', marginBottom: 6 },
  dimInputBox: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    backgroundColor: colors.background,
  },
  dimInput: { padding: 10, fontSize: 13, color: colors.text, textAlign: 'center' },
  inputBox: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    backgroundColor: colors.background,
  },
  input: { padding: 12, fontSize: 14, color: colors.text },
  materialGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  materialChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border,
  },
  materialChipActive: {
    backgroundColor: colors.primaryBg, borderColor: colors.primary,
  },
  materialChipText: { fontSize: 13, color: colors.textMedium, fontWeight: '500' },
  materialChipTextActive: { color: colors.primary, fontWeight: '700' },
  progressCard: {
    margin: 16, marginBottom: 0, padding: 16,
    backgroundColor: colors.cardBg, borderRadius: 12,
    alignItems: 'center', gap: 8,
  },
  progressText: { fontSize: 14, color: colors.textMedium, fontWeight: '600' },
  progressBar: {
    width: '100%', height: 6, backgroundColor: colors.border,
    borderRadius: 3, overflow: 'hidden',
  },
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
