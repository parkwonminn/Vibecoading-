import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';

export function AppHeader() {
  return (
    <View style={styles.container}>
      <Text style={styles.appName}>SnapCal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
});
