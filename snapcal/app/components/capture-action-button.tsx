import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';

type CaptureActionButtonProps = {
  label: string;
  variant: 'primary' | 'secondary';
  onPress: () => void;
};

export function CaptureActionButton({ label, variant, onPress }: CaptureActionButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, variant === 'primary' ? styles.primaryButton : styles.secondaryButton]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.label, variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.point,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryLabel: {
    color: Colors.background,
  },
  secondaryLabel: {
    color: Colors.textPrimary,
  },
});
