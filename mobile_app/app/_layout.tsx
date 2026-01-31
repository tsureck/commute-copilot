import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <LinearGradient
          colors={[theme.colors.backgroundGradientStart, theme.colors.backgroundGradientEnd]}
          style={StyleSheet.absoluteFill}
        />
        <StatusBar style="light" translucent backgroundColor="transparent" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: 'transparent',
            },
            headerTintColor: theme.colors.textPrimary,
            headerTitleStyle: {
              fontWeight: '600',
            },
            contentStyle: {
              backgroundColor: 'transparent',
            },
            animation: 'fade_from_bottom',
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="decision/[decisionId]"
            options={{
              title: 'Details',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="chat"
            options={{
              title: 'Chat',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: 'Settings',
              headerBackTitle: 'Back',
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
