import { Platform, Pressable, StyleSheet, type PressableProps, type ViewStyle } from 'react-native';

type Props = Omit<PressableProps, 'style'> & {
  style?: ViewStyle | ViewStyle[];
  activeOpacity?: number;
};

/**
 * Pressable fiable sur web (onClick) et natif — corrige les clics inertes Expo web.
 */
export function TapButton({ onPress, disabled, style, children, activeOpacity = 0.85, ...rest }: Props) {
  const flat = StyleSheet.flatten(style) as ViewStyle | undefined;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      // @ts-expect-error RN Web: onClick garantit le clic navigateur
      onClick={
        Platform.OS === 'web' && onPress && !disabled
          ? (e: { stopPropagation?: () => void; preventDefault?: () => void }) => {
              e?.stopPropagation?.();
              e?.preventDefault?.();
              onPress(e as never);
            }
          : undefined
      }
      style={({ pressed }) => [
        flat,
        Platform.OS === 'web' ? ({ cursor: disabled ? 'default' : 'pointer' } as ViewStyle) : null,
        pressed && !disabled ? { opacity: activeOpacity } : null,
        disabled ? { opacity: 0.4 } : null,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
