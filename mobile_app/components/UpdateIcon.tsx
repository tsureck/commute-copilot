import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface ModernIconProps {
  type: 'weather' | 'train' | 'calendar' | 'traffic' | 'rain' | 'sun' | 'cloud' | 'snow' | 'bus' | 'car' | 'default';
  size?: number;
  color?: string;
}

// Weather/Rain icon - water droplets (teardrop shape)
function RainDropsIcon({ size, color }: { size: number; color: string }) {
  return (
    <View style={[iconStyles.iconContainer, { width: size, height: size }]}>
      {/* Three teardrops - classic water drop shape */}
      {/* Left droplet */}
      <View style={[iconStyles.droplet, { left: size * 0.08, top: size * 0.25 }]}>
        <View style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.07,
          borderRightWidth: size * 0.07,
          borderBottomWidth: size * 0.12,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }} />
        <View style={{
          width: size * 0.14,
          height: size * 0.14,
          backgroundColor: color,
          borderRadius: size * 0.07,
          marginTop: -2,
        }} />
      </View>
      
      {/* Center droplet (larger) */}
      <View style={[iconStyles.droplet, { left: size * 0.38, top: size * 0.08 }]}>
        <View style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.1,
          borderRightWidth: size * 0.1,
          borderBottomWidth: size * 0.16,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }} />
        <View style={{
          width: size * 0.2,
          height: size * 0.2,
          backgroundColor: color,
          borderRadius: size * 0.1,
          marginTop: -2,
        }} />
      </View>
      
      {/* Right droplet */}
      <View style={[iconStyles.droplet, { right: size * 0.08, top: size * 0.4 }]}>
        <View style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.06,
          borderRightWidth: size * 0.06,
          borderBottomWidth: size * 0.1,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }} />
        <View style={{
          width: size * 0.12,
          height: size * 0.12,
          backgroundColor: color,
          borderRadius: size * 0.06,
          marginTop: -2,
        }} />
      </View>
    </View>
  );
}

// Train icon - modern rail symbol
function TrainIcon({ size, color }: { size: number; color: string }) {
  return (
    <View style={[iconStyles.iconContainer, { width: size, height: size }]}>
      {/* Track lines */}
      <View style={[iconStyles.trackLine, { backgroundColor: color, width: size * 0.8, height: 2, top: size * 0.7 }]} />
      <View style={[iconStyles.trackLine, { backgroundColor: color, width: size * 0.8, height: 2, top: size * 0.8 }]} />
      {/* Train body */}
      <View style={[iconStyles.trainBody, { backgroundColor: color, width: size * 0.5, height: size * 0.55, top: size * 0.1, borderRadius: size * 0.08 }]} />
      {/* Window */}
      <View style={[iconStyles.trainWindow, { backgroundColor: theme.colors.background, width: size * 0.3, height: size * 0.15, top: size * 0.2, borderRadius: 2 }]} />
    </View>
  );
}

// Calendar icon - grid
function CalendarIcon({ size, color }: { size: number; color: string }) {
  return (
    <View style={[iconStyles.iconContainer, { width: size, height: size }]}>
      {/* Calendar outline */}
      <View style={[iconStyles.calendarBase, { borderColor: color, width: size * 0.7, height: size * 0.65, bottom: size * 0.1, borderWidth: 2, borderRadius: size * 0.08 }]} />
      {/* Top bar */}
      <View style={[iconStyles.calendarTop, { backgroundColor: color, width: size * 0.7, height: size * 0.15, top: size * 0.15, borderTopLeftRadius: size * 0.08, borderTopRightRadius: size * 0.08 }]} />
      {/* Dots for days */}
      <View style={[iconStyles.calendarDot, { backgroundColor: color, width: size * 0.1, height: size * 0.1, top: size * 0.45, left: size * 0.22 }]} />
      <View style={[iconStyles.calendarDot, { backgroundColor: color, width: size * 0.1, height: size * 0.1, top: size * 0.45, left: size * 0.45 }]} />
      <View style={[iconStyles.calendarDot, { backgroundColor: color, width: size * 0.1, height: size * 0.1, top: size * 0.6, left: size * 0.22 }]} />
      <View style={[iconStyles.calendarDot, { backgroundColor: color, width: size * 0.1, height: size * 0.1, top: size * 0.6, left: size * 0.45 }]} />
    </View>
  );
}

// Traffic/Car icon - signal bars
function TrafficIcon({ size, color }: { size: number; color: string }) {
  return (
    <View style={[iconStyles.iconContainer, { width: size, height: size }]}>
      {/* Signal bars like a speedometer */}
      <View style={[iconStyles.signalBar, { backgroundColor: color, width: size * 0.1, height: size * 0.3, bottom: size * 0.2, left: size * 0.15, opacity: 0.4 }]} />
      <View style={[iconStyles.signalBar, { backgroundColor: color, width: size * 0.1, height: size * 0.45, bottom: size * 0.2, left: size * 0.32 }]} />
      <View style={[iconStyles.signalBar, { backgroundColor: color, width: size * 0.1, height: size * 0.6, bottom: size * 0.2, left: size * 0.49 }]} />
      <View style={[iconStyles.signalBar, { backgroundColor: color, width: size * 0.1, height: size * 0.45, bottom: size * 0.2, right: size * 0.15, opacity: 0.4 }]} />
    </View>
  );
}

// Default icon - pulse dot
function DefaultIcon({ size, color }: { size: number; color: string }) {
  return (
    <View style={[iconStyles.iconContainer, { width: size, height: size }]}>
      <View style={[iconStyles.pulseDot, { backgroundColor: color, width: size * 0.4, height: size * 0.4, borderRadius: size * 0.2 }]} />
      <View style={[iconStyles.pulseRing, { borderColor: color, width: size * 0.7, height: size * 0.7, borderRadius: size * 0.35, borderWidth: 2, opacity: 0.3 }]} />
    </View>
  );
}

// Settings icon - sliders
export function SettingsIcon({ size = 24, color }: { size?: number; color?: string }) {
  const iconColor = color || theme.colors.textSecondary;
  return (
    <View style={[iconStyles.iconContainer, { width: size, height: size }]}>
      {/* Three horizontal lines with dots */}
      <View style={{ position: 'absolute', top: size * 0.15, width: size * 0.8, height: 2, backgroundColor: iconColor, borderRadius: 1 }} />
      <View style={{ position: 'absolute', top: size * 0.15 - 3, left: size * 0.55, width: 8, height: 8, backgroundColor: iconColor, borderRadius: 4 }} />
      
      <View style={{ position: 'absolute', top: size * 0.45, width: size * 0.8, height: 2, backgroundColor: iconColor, borderRadius: 1 }} />
      <View style={{ position: 'absolute', top: size * 0.45 - 3, left: size * 0.2, width: 8, height: 8, backgroundColor: iconColor, borderRadius: 4 }} />
      
      <View style={{ position: 'absolute', top: size * 0.75, width: size * 0.8, height: 2, backgroundColor: iconColor, borderRadius: 1 }} />
      <View style={{ position: 'absolute', top: size * 0.75 - 3, left: size * 0.45, width: 8, height: 8, backgroundColor: iconColor, borderRadius: 4 }} />
    </View>
  );
}

export function ModernIcon({ type, size = 24, color }: ModernIconProps) {
  const iconColor = color || theme.colors.accent;
  
  switch (type) {
    case 'weather':
    case 'sun':
    case 'cloud':
    case 'rain':
    case 'snow':
      return <RainDropsIcon size={size} color={iconColor} />;
    case 'train':
    case 'bus':
      return <TrainIcon size={size} color={iconColor} />;
    case 'calendar':
      return <CalendarIcon size={size} color={iconColor} />;
    case 'traffic':
    case 'car':
      return <TrafficIcon size={size} color={iconColor} />;
    default:
      return <DefaultIcon size={size} color={iconColor} />;
  }
}

// Keep the old export for backward compatibility
export function UpdateIcon({ type, size = 24 }: { type: string; size?: number }) {
  return <ModernIcon type={type as any} size={size} />;
}

const iconStyles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Rain droplets
  droplet: {
    position: 'absolute',
  },
  // Train
  trackLine: {
    position: 'absolute',
    alignSelf: 'center',
  },
  trainBody: {
    position: 'absolute',
    alignSelf: 'center',
  },
  trainWindow: {
    position: 'absolute',
    alignSelf: 'center',
  },
  // Calendar
  calendarBase: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  calendarTop: {
    position: 'absolute',
    alignSelf: 'center',
  },
  calendarDot: {
    position: 'absolute',
    borderRadius: 2,
  },
  // Traffic
  signalBar: {
    position: 'absolute',
    borderRadius: 2,
  },
  // Default
  pulseDot: {
    position: 'absolute',
  },
  pulseRing: {
    position: 'absolute',
  },
});
