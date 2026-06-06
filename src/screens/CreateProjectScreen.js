import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { createProject } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/colors';

export default function CreateProjectScreen({ navigation }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a project name.');
      return;
    }
    if (!clientName.trim()) {
      Alert.alert('Required', 'Please enter a client name.');
      return;
    }
    setLoading(true);
    try {
      const id = await createProject(
        { name: name.trim(), clientName: clientName.trim(), description: description.trim() },
        user.uid
      );
      navigation.replace('ProjectDetail', {
        project: { id, name: name.trim(), clientName: clientName.trim(), description: description.trim(), photoCount: 0 },
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
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
          <Text style={styles.headerTitle}>New Project</Text>
          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>PROJECT DETAILS</Text>

          <Field label="Project Name *" icon="folder-outline">
            <TextInput
              style={styles.input}
              placeholder="e.g. Metro Station Campaign"
              placeholderTextColor={colors.textLight}
              value={name}
              onChangeText={setName}
              maxLength={80}
            />
          </Field>

          <Field label="Client Name *" icon="person-outline">
            <TextInput
              style={styles.input}
              placeholder="e.g. Reliance Industries"
              placeholderTextColor={colors.textLight}
              value={clientName}
              onChangeText={setClientName}
              maxLength={80}
            />
          </Field>

          <Field label="Description" icon="document-text-outline">
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Brief description of the project (optional)"
              placeholderTextColor={colors.textLight}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={300}
            />
          </Field>
        </View>

        <TouchableOpacity
          style={[styles.createBtn, loading && styles.btnDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text style={styles.createBtnText}>Create Project</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const Field = ({ label, icon, children }) => (
  <View style={styles.field}>
    <View style={styles.fieldLabel}>
      <Ionicons name={icon} size={15} color={colors.primary} />
      <Text style={styles.fieldLabelText}>{label}</Text>
    </View>
    <View style={styles.inputBox}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 50, paddingBottom: 18, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: colors.cardBg, borderRadius: 16,
    padding: 20, marginBottom: 20,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textLight,
    letterSpacing: 1, marginBottom: 16,
  },
  field: { marginBottom: 18 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  fieldLabelText: { fontSize: 13, fontWeight: '600', color: colors.textMedium },
  inputBox: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    backgroundColor: colors.background, overflow: 'hidden',
  },
  input: { paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text },
  multiline: { height: 80, textAlignVertical: 'top' },
  createBtn: {
    backgroundColor: colors.primary, borderRadius: 14,
    height: 54, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 10,
    elevation: 4, shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8,
  },
  btnDisabled: { opacity: 0.7 },
  createBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
