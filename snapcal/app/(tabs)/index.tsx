import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/app-header';
import { CaptureActionButton } from '../components/capture-action-button';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';

export default function MainAnalysisScreen() {
  const router = useRouter();

  async function handleCameraCapture() {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) return;

    const captureResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!captureResult.canceled && captureResult.assets[0]) {
      const imageUri = captureResult.assets[0].uri;
      router.push({ pathname: '/screens/analysis-result', params: { imageUri } });
    }
  }

  async function handleGallerySelection() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return;

    const selectionResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!selectionResult.canceled && selectionResult.assets[0]) {
      const imageUri = selectionResult.assets[0].uri;
      router.push({ pathname: '/screens/analysis-result', params: { imageUri } });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />

      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateTitle}>{Strings.historyEmptyTitle}</Text>
        <Text style={styles.emptyStateSubtitle}>{Strings.historyEmptySubtitle}</Text>
      </View>

      <View style={styles.captureActionsContainer}>
        <CaptureActionButton
          label={Strings.cameraButtonLabel}
          variant="primary"
          onPress={handleCameraCapture}
        />
        <View style={styles.buttonGap} />
        <CaptureActionButton
          label={Strings.galleryButtonLabel}
          variant="secondary"
          onPress={handleGallerySelection}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  captureActionsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  buttonGap: {
    height: 12,
  },
});
