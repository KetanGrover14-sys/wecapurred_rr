import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import CreateProjectScreen from '../screens/CreateProjectScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import AddSpecsScreen from '../screens/AddSpecsScreen';
import AnnotatePhotoScreen from '../screens/AnnotatePhotoScreen';
import PhotoDetailScreen from '../screens/PhotoDetailScreen';
import { colors } from '../utils/colors';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="CreateProject" component={CreateProjectScreen} />
            <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
            <Stack.Screen name="AddSpecs" component={AddSpecsScreen} />
            <Stack.Screen name="AnnotatePhoto" component={AnnotatePhotoScreen} />
            <Stack.Screen name="PhotoDetail" component={PhotoDetailScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
