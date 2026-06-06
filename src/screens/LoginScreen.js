import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { colors } from '../utils/colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' ? 'No account found. Register first.'
        : err.code === 'auth/wrong-password' ? 'Incorrect password.'
        : err.code === 'auth/email-already-in-use' ? 'Email already registered.'
        : err.message;
      Alert.alert('Authentication Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[colors.primaryDark, colors.primary, '#FF4444']} style={styles.flex}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Ionicons name="camera" size={42} color={colors.primary} />
          </View>
          <Text style={styles.companyName}>WecapuRRed</Text>
          <Text style={styles.tagline}>Banner & Hoarding Solutions</Text>
        </View>

        {/* Form card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isRegister ? 'Create Account' : 'Welcome Back'}</Text>
          <Text style={styles.cardSubtitle}>
            {isRegister ? 'Register to get started' : 'Sign in to continue'}
          </Text>

          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
              <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.authBtn} onPress={handleAuth} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.authBtnText}>{isRegister ? 'Register' : 'Sign In'}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsRegister(!isRegister)} style={styles.toggleBtn}>
            <Text style={styles.toggleText}>
              {isRegister ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={styles.toggleHighlight}>{isRegister ? 'Sign In' : 'Register'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  logoArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, marginBottom: 16,
  },
  companyName: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: 1 },
  tagline: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 28, paddingBottom: 40,
  },
  cardTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: colors.textLight, marginBottom: 24 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, borderRadius: 12,
    marginBottom: 14, paddingHorizontal: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, color: colors.text, fontSize: 15 },
  eyeBtn: { padding: 4 },
  authBtn: {
    backgroundColor: colors.primary, borderRadius: 12,
    height: 52, justifyContent: 'center', alignItems: 'center',
    marginTop: 6, elevation: 3,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 6,
  },
  authBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  toggleBtn: { alignItems: 'center', marginTop: 20 },
  toggleText: { fontSize: 14, color: colors.textMedium },
  toggleHighlight: { color: colors.primary, fontWeight: '700' },
});
