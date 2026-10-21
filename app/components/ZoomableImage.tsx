import React from 'react';
import { Modal, Pressable, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { touchPad } from '../constants/touch';

interface Props { uri: string; visible: boolean; onClose: () => void; }

// Full-screen picture: pinch to zoom, drag to move around, double-tap to reset.
export function ZoomableImage({ uri, visible, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const reset = () => {
    'worklet';
    scale.value = withTiming(1); savedScale.value = 1;
    x.value = withTiming(0); y.value = withTiming(0);
    savedX.value = 0; savedY.value = 0;
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => { scale.value = Math.min(6, Math.max(1, savedScale.value * e.scale)); })
    .onEnd(() => { savedScale.value = scale.value; if (scale.value === 1) reset(); });
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      x.value = savedX.value + e.translationX;
      y.value = savedY.value + e.translationY;
    })
    .onEnd(() => { savedX.value = x.value; savedY.value = y.value; });
  const doubleTap = Gesture.Tap().numberOfTaps(2).onEnd(() => { reset(); });
  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.root}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.center, style]}>
            <Image source={{ uri }} style={{ width, height: height * 0.8 }} resizeMode="contain" />
          </Animated.View>
        </GestureDetector>
        <Pressable accessibilityLabel="Close picture" style={styles.close} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  close: { position: 'absolute', top: 48, right: Spacing.md, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + touchPad },
  closeText: { color: '#fff', fontWeight: '600', fontSize: FontSize.md },
});
