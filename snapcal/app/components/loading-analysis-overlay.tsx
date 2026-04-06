import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';

type LoadingAnalysisOverlayProps = {
  isVisible: boolean;
};

export function LoadingAnalysisOverlay({ isVisible }: LoadingAnalysisOverlayProps) {
  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={Colors.point} />
        <Text style={styles.message}>{Strings.analysisLoadingMessage}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    minWidth: 200,
  },
  message: {
    fontSize: 15,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});
