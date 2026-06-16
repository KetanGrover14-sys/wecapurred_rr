import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  Image, PanResponder, Dimensions, ActivityIndicator, Alert,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';

const { width: SCREEN_W } = Dimensions.get('window');

const PEN_COLORS = [
  { key: 'red',    hex: '#CC0000' },
  { key: 'black',  hex: '#000000' },
  { key: 'white',  hex: '#FFFFFF' },
  { key: 'yellow', hex: '#FFD600' },
  { key: 'blue',   hex: '#1565C0' },
  { key: 'green',  hex: '#2E7D32' },
];

const PEN_SIZES = [3, 6, 12];

function pointsToD(points) {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  let d = `M${first.x.toFixed(1)},${first.y.toFixed(1)}`;
  for (const p of rest) {
    d += ` L${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }
  return d;
}

export default function AnnotatePhotoScreen({ route, navigation }) {
  const { imageUri, projectId } = route.params;

  const [paths, setPaths]           = useState([]);
  const [activePath, setActivePath] = useState(null);
  const [penColor, setPenColor]     = useState(PEN_COLORS[0].hex);
  const [penSize, setPenSize]       = useState(6);
  const [saving, setSaving]         = useState(false);
  const [canvasH, setCanvasH]       = useState(400);

  // Refs so PanResponder always reads the latest values (no stale closure)
  const penColorRef = useRef(PEN_COLORS[0].hex);
  const penSizeRef  = useRef(6);
  const pointsRef   = useRef([]);
  const viewShotRef = useRef(null);

  const selectColor = (hex) => {
    penColorRef.current = hex;
    setPenColor(hex);
  };
  const selectSize = (s) => {
    penSizeRef.current = s;
    setPenSize(s);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,

      onPanResponderGrant: (evt) => {
        const { locationX: x, locationY: y } = evt.nativeEvent;
        pointsRef.current = [{ x, y }];
        setActivePath({ points: [{ x, y }], color: penColorRef.current, size: penSizeRef.current });
      },

      onPanResponderMove: (evt) => {
        const { locationX: x, locationY: y } = evt.nativeEvent;
        pointsRef.current = [...pointsRef.current, { x, y }];
        setActivePath((prev) => prev
          ? { ...prev, points: [...pointsRef.current] }
          : null
        );
      },

      onPanResponderRelease: () => {
        if (pointsRef.current.length > 0) {
          const done = {
            points: [...pointsRef.current],
            color: penColorRef.current,
            size:  penSizeRef.current,
          };
          setPaths((prev) => [...prev, done]);
        }
        setActivePath(null);
        pointsRef.current = [];
      },
    })
  ).current;

  const undo = useCallback(() => setPaths((p) => p.slice(0, -1)), []);
  const clear = useCallback(() => setPaths([]), []);

  const handleDone = async () => {
    if (paths.length === 0) {
      // No annotations — skip capture and go straight to AddSpecs
      navigation.replace('AddSpecs', { imageUri, projectId });
      return;
    }
    setSaving(true);
    try {
      const uri = await viewShotRef.current.capture();
      navigation.replace('AddSpecs', { imageUri: uri, projectId });
    } catch (e) {
      console.error('ViewShot capture failed:', e);
      Alert.alert('Error', 'Could not save annotation. Please try again.');
      setSaving(false);
    }
  };

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
            <Text style={styles.headerTitle}>Annotate Photo</Text>
            <Text style={styles.headerSub}>Draw on the image, then tap Done</Text>
          </View>
          <TouchableOpacity
            onPress={handleDone}
            disabled={saving}
            style={[styles.doneBtn, saving && { opacity: 0.6 }]}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.doneBtnText}>Done</Text>
            }
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Canvas: image + SVG overlay captured together */}
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'jpg', quality: 0.92 }}
        style={styles.canvasWrapper}
      >
        <Image
          source={{ uri: imageUri }}
          style={[styles.image, { height: canvasH }]}
          resizeMode="cover"
          onLayout={(e) => setCanvasH(e.nativeEvent.layout.height)}
          onLoad={(e) => {
            const { width: w, height: h } = e.nativeEvent.source;
            setCanvasH(Math.min(SCREEN_W * (h / w), 520));
          }}
        />
        <Svg
          style={[StyleSheet.absoluteFill, { height: canvasH }]}
          {...panResponder.panHandlers}
        >
          {paths.map((path, i) => (
            <Path
              key={i}
              d={pointsToD(path.points)}
              stroke={path.color}
              strokeWidth={path.size}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          {activePath && (
            <Path
              d={pointsToD(activePath.points)}
              stroke={activePath.color}
              strokeWidth={activePath.size}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
        </Svg>
      </ViewShot>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        {/* Color swatches */}
        <View style={styles.colorRow}>
          {PEN_COLORS.map(({ key, hex }) => (
            <TouchableOpacity
              key={key}
              onPress={() => selectColor(hex)}
              style={[
                styles.swatch,
                { backgroundColor: hex },
                hex === '#FFFFFF' && styles.swatchWhiteBorder,
                penColor === hex && styles.swatchActive,
              ]}
            />
          ))}
        </View>

        {/* Size + action buttons */}
        <View style={styles.actionsRow}>
          <View style={styles.sizeRow}>
            {PEN_SIZES.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => selectSize(s)}
                style={[styles.sizeBtn, penSize === s && styles.sizeBtnActive]}
              >
                <View style={[styles.sizeDot, { width: s * 2, height: s * 2, borderRadius: s, backgroundColor: penColor }]} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actionBtns}>
            <TouchableOpacity
              onPress={undo}
              disabled={paths.length === 0}
              style={[styles.actionBtn, paths.length === 0 && styles.actionBtnDisabled]}
            >
              <Ionicons name="arrow-undo" size={20} color={paths.length === 0 ? colors.border : colors.text} />
              <Text style={[styles.actionBtnText, paths.length === 0 && { color: colors.border }]}>Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={clear}
              disabled={paths.length === 0}
              style={[styles.actionBtn, paths.length === 0 && styles.actionBtnDisabled]}
            >
              <Ionicons name="trash-outline" size={20} color={paths.length === 0 ? colors.border : colors.error} />
              <Text style={[styles.actionBtnText, { color: paths.length === 0 ? colors.border : colors.error }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#000' },
  header:        { paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16 },
  headerRow:     { flexDirection: 'row', alignItems: 'center' },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter:  { flex: 1, marginHorizontal: 12 },
  headerTitle:   { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSub:     { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
  doneBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, minWidth: 60, alignItems: 'center',
  },
  doneBtnText:   { color: '#fff', fontSize: 15, fontWeight: '700' },

  canvasWrapper: { flex: 1, backgroundColor: '#000' },
  image:         { width: '100%', backgroundColor: '#111' },

  toolbar: {
    backgroundColor: colors.cardBg,
    paddingHorizontal: 16, paddingVertical: 12,
    paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: colors.border,
    gap: 12,
  },
  colorRow: {
    flexDirection: 'row', gap: 10, justifyContent: 'center',
  },
  swatch: {
    width: 32, height: 32, borderRadius: 16,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2,
  },
  swatchWhiteBorder: {
    borderWidth: 1.5, borderColor: colors.border,
  },
  swatchActive: {
    borderWidth: 3, borderColor: colors.text,
    transform: [{ scale: 1.15 }],
  },
  actionsRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sizeRow:       { flexDirection: 'row', gap: 8, alignItems: 'center' },
  sizeBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  sizeBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  sizeDot:       {},
  actionBtns:    { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: colors.background,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
  },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: colors.text },
});
