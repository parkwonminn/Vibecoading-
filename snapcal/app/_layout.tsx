import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="screens/analysis-result"
          options={{
            headerShown: true,
            headerTitle: '분석 결과',
            headerBackTitle: '뒤로',
            headerTintColor: '#1A1A1A',
            headerStyle: { backgroundColor: '#FFFFFF' },
          }}
        />
      </Stack>
    </>
  );
}
