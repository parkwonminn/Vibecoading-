import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';

export function EmptyHistoryView() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{Strings.historyEmptyTitle}</Text>
      <Text style={styles.subtitle}>{Strings.historyEmptySubtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
