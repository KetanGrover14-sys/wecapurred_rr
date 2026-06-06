import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, Alert, ActivityIndicator, ActionSheetIOS,
  Platform, Modal, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { subscribeToPhotos, deleteProject } from '../services/firestoreService';
import { generatePPT } from '../services/pptService';
import PhotoCard from '../components/PhotoCard';
import { colors } from '../utils/colors';

export default function ProjectDetailScreen({ route, navigation }) {
  const { project } = route.params;
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    const unsub = subscribeToPhotos(project.id, (data) => {
      setPhotos(data);
      setLoading(false);
    });
    return unsub;
  }, [project.id]);

  const pickImage = async (fromCamera) => {
    setShowActionSheet(false);
    await new Promise((r) => setTimeout(r, 300));

    const { status } = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access in your device settings.');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          quality: 0.85,
          allowsEditing: false,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.85,
          allowsEditing: false,
        });

    if (!result.canceled && result.assets?.[0]) {
      navigation.navigate('AddSpecs', {
        imageUri: result.assets[0].uri,
        projectId: project.id,
      });
    }
  };

  const handleAddPhoto = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery'],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) pickImage(true);
          if (idx === 2) pickImage(false);
        }
      );
    } else {
      setShowActionSheet(true);
    }
  };

  const handleCreatePPT = async () => {
    if (photos.length === 0) {
      Alert.alert('No Photos', 'Add at least one photo with specifications before generating a presentation.');
      return;
    }
    setGenerating(true);
    try {
      const filePath = await generatePPT(project, photos);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          dialogTitle: `Share ${project.name} Presentation`,
          UTI: 'com.microsoft.powerpoint.pptx',
        });
      } else {
        Alert.alert('Success', `Presentation saved to: ${filePath}`);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to generate presentation. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteProject = () => {
    Alert.alert(
      'Delete Project',
      `Delete "${project.name}" and all its photos? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await deleteProject(project.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const renderPhoto = ({ item }) => (
    <PhotoCard
      photo={item}
      onPress={() => navigation.navigate('PhotoDetail', { photo: item, projectId: project.id })}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Header */}
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{project.name}</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              Client: {project.clientName}
            </Text>
          </View>
          <TouchableOpacity onPress={handleDeleteProject} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="images-outline" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.statText}>{photos.length} Photos</Text>
          </View>
          {!!project.description && (
            <Text style={styles.projectDesc} numberOfLines={1}>{project.description}</Text>
          )}
        </View>
      </LinearGradient>

      {/* Photo grid */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          renderItem={renderPhoto}
          numColumns={2}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="camera-outline" size={56} color={colors.border} />
              <Text style={styles.emptyTitle}>No Photos Yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the camera button to add your first banner photo
              </Text>
            </View>
          }
          columnWrapperStyle={{ justifyContent: 'flex-start' }}
        />
      )}

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.addPhotoBtn} onPress={handleAddPhoto} activeOpacity={0.85}>
          <Ionicons name="camera" size={20} color="#fff" />
          <Text style={styles.addPhotoBtnText}>Add Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pptBtn, generating && styles.btnDisabled]}
          onPress={handleCreatePPT}
          disabled={generating}
          activeOpacity={0.85}
        >
          {generating ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.pptBtnText}>Generating...</Text>
            </>
          ) : (
            <>
              <Ionicons name="document-text" size={20} color="#fff" />
              <Text style={styles.pptBtnText}>Create PPT</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Android ActionSheet modal */}
      <Modal visible={showActionSheet} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowActionSheet(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Add Photo</Text>
          <TouchableOpacity style={styles.sheetOption} onPress={() => pickImage(true)}>
            <Ionicons name="camera" size={22} color={colors.primary} />
            <Text style={styles.sheetOptionText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sheetOption} onPress={() => pickImage(false)}>
            <Ionicons name="images" size={22} color={colors.primary} />
            <Text style={styles.sheetOptionText}>Choose from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowActionSheet(false)}>
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, marginHorizontal: 12 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10, padding: 10, gap: 10,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
  projectDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 12, flex: 1 },
  loader: { marginTop: 60 },
  grid: { padding: 10, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: colors.textLight, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  bottomBar: {
    flexDirection: 'row', padding: 12, paddingBottom: 28,
    backgroundColor: colors.cardBg, gap: 10,
    borderTopWidth: 1, borderTopColor: colors.border,
    elevation: 8, shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  addPhotoBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.secondary, borderRadius: 12, height: 50, gap: 8,
  },
  addPhotoBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  pptBtn: {
    flex: 1.4, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.primary, borderRadius: 12, height: 50, gap: 8,
    elevation: 3, shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6,
  },
  btnDisabled: { opacity: 0.7 },
  pptBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 36,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 16 },
  sheetOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  sheetOptionText: { fontSize: 16, color: colors.text, fontWeight: '500' },
  sheetCancel: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  sheetCancelText: { fontSize: 16, color: colors.error, fontWeight: '600' },
});
