import { useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { router } from 'expo-router';

// Configure how notifications are displayed when app is in foreground
// Wrapped in try-catch for Expo Go compatibility
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  console.log('Notification handler setup skipped (Expo Go limitation)');
}

interface UseNotificationsReturn {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  sendTestNotification: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

export function useNotifications(): UseNotificationsReturn {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    console.log('📱 [Notification] Hook initialized');
    
    // Register for push notifications (will fail silently in Expo Go SDK 53+)
    registerForPushNotifications().then(token => {
      if (token) {
        console.log('📱 [Notification] Push token received:', token.substring(0, 20) + '...');
        setExpoPushToken(token);
      }
    }).catch(() => {
      console.log('📱 [Notification] Push token registration skipped (Expo Go)');
    });

    // Listen for incoming notifications (foreground)
    try {
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('📱 [Notification] 🔔 Notification RECEIVED:', notification.request.content.title);
        setNotification(notification);
      });

      // Listen for notification taps
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('📱 [Notification] 👆 Notification TAPPED');
        const data = response.notification.request.content.data;
        console.log('📱 [Notification] Data:', JSON.stringify(data));
        
        // Navigate to decision screen if decisionId is present
        if (data?.decisionId) {
          console.log('📱 [Notification] Navigating to /decision/' + data.decisionId);
          router.push(`/decision/${data.decisionId}`);
        }
      });
      console.log('📱 [Notification] Listeners registered');
    } catch (e) {
      console.log('📱 [Notification] Listeners setup skipped (Expo Go limitation)');
    }

    return () => {
      try {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
        console.log('📱 [Notification] Listeners cleaned up');
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      return finalStatus === 'granted';
    } catch (e) {
      console.log('Notification permissions not available in Expo Go');
      return false;
    }
  }, []);

  const sendTestNotification = useCallback(async () => {
    console.log('📱 [Notification] sendTestNotification called');
    try {
      console.log('📱 [Notification] Requesting permissions...');
      const hasPermission = await requestPermissions();
      console.log('📱 [Notification] Permission result:', hasPermission);
      
      if (!hasPermission) {
        console.log('📱 [Notification] Permission denied - showing alert');
        Alert.alert(
          'Notifications Limited',
          'Push notifications are not available in Expo Go (SDK 53+). Use a development build for full notification support.\n\nFor now, tap "Open Latest Decision" to test the Decision screen.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('📱 [Notification] Scheduling notification...');
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚆 Commute Update',
          body: 'Your evening commute recommendation is ready. Tap to view.',
          data: {
            decisionId: 'demo-001',
            type: 'commute_update',
          },
        },
        trigger: null, // Show immediately
      });
      console.log('📱 [Notification] ✅ Notification scheduled with ID:', notificationId);
    } catch (e: any) {
      console.log('📱 [Notification] ❌ Error:', e?.message || e);
      Alert.alert(
        'Notifications Not Available',
        'Push notifications require a development build. Use "Open Latest Decision" to test the Decision screen directly.',
        [{ text: 'OK' }]
      );
    }
  }, [requestPermissions]);

  return {
    expoPushToken,
    notification,
    sendTestNotification,
    requestPermissions,
  };
}

async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return null;
    }

    // Push token registration not available in Expo Go SDK 53+
    // This will throw in Expo Go but work in development builds
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'commute-copilot',
    });
    
    return tokenData.data;
  } catch (error) {
    // Expected to fail in Expo Go - push notifications require development build
    console.log('Push token registration skipped (requires development build)');
    return null;
  }
}
