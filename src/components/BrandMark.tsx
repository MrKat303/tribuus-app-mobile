import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

export function BrandMark() {
  return (
    <View accessibilityLabel="Tribuus" accessibilityRole="image" style={styles.container}>
      <Image
        contentFit="contain"
        source={require('../../assets/brand/tribuus-logo.svg')}
        style={styles.logo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 40, justifyContent: 'center', width: 112 },
  logo: { height: 40, width: 112 },
});
