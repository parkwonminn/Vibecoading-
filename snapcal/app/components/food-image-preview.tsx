import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;

type FoodImagePreviewProps = {
  imageUri: string;
};

export function FoodImagePreview({ imageUri }: FoodImagePreviewProps) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
    backgroundColor: Colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
