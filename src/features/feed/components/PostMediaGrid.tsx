import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/context/AppearanceContext';
import { radii, typography } from '@/theme/tokens';
import type { CommunityPostImage } from '@/types/community';

type PostMediaGridProps = {
  images: CommunityPostImage[];
  onRemove?: (imageId: string) => void;
  recyclingKey: string;
};

function MediaCell({ extraCount = 0, image, onRemove, recyclingKey }: {
  extraCount?: number;
  image: CommunityPostImage;
  onRemove?: (imageId: string) => void;
  recyclingKey: string;
}) {
  const { colors } = useAppAppearance();
  const source = image.variants?.feed.uri ?? image.uri;
  const placeholder = image.variants?.thumbnail.uri;

  return (
    <View style={styles.cell}>
      <Image
        accessibilityLabel="Foto de la publicación"
        cachePolicy="memory-disk"
        contentFit="cover"
        placeholder={placeholder ? { uri: placeholder } : undefined}
        placeholderContentFit="cover"
        recyclingKey={`${recyclingKey}-${image.id}`}
        source={{ uri: source }}
        style={StyleSheet.absoluteFill}
        transition={180}
      />
      {extraCount > 0 ? (
        <View style={styles.moreOverlay}>
          <AppText style={styles.moreText} variant="bodyStrong">+{extraCount}</AppText>
        </View>
      ) : null}
      {onRemove ? (
        <Pressable
          accessibilityLabel="Quitar foto"
          accessibilityRole="button"
          hitSlop={6}
          onPress={() => onRemove(image.id)}
          style={({ pressed }) => [styles.remove, { borderColor: colors.surface }, pressed && styles.pressed]}>
          <AppIcon color="#FFFFFF" name="x" size={14} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function PostMediaGrid({ images, onRemove, recyclingKey }: PostMediaGridProps) {
  const visible = images.slice(0, 4);
  const extraCount = Math.max(0, images.length - 4);

  if (!visible.length) return null;

  if (visible.length === 1) {
    return (
      <View style={[styles.grid, styles.single]}>
        <MediaCell image={visible[0]} onRemove={onRemove} recyclingKey={recyclingKey} />
      </View>
    );
  }

  if (visible.length === 2) {
    return (
      <View style={[styles.grid, styles.row]}>
        {visible.map((image) => <MediaCell image={image} key={image.id} onRemove={onRemove} recyclingKey={recyclingKey} />)}
      </View>
    );
  }

  if (visible.length === 3) {
    return (
      <View style={[styles.grid, styles.row]}>
        <MediaCell image={visible[0]} onRemove={onRemove} recyclingKey={recyclingKey} />
        <View style={styles.column}>
          {visible.slice(1).map((image) => <MediaCell image={image} key={image.id} onRemove={onRemove} recyclingKey={recyclingKey} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.grid, styles.column]}>
      <View style={styles.row}>
        {visible.slice(0, 2).map((image) => <MediaCell image={image} key={image.id} onRemove={onRemove} recyclingKey={recyclingKey} />)}
      </View>
      <View style={styles.row}>
        {visible.slice(2, 4).map((image, index) => (
          <MediaCell extraCount={index === 1 ? extraCount : 0} image={image} key={image.id} onRemove={onRemove} recyclingKey={recyclingKey} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { aspectRatio: 4 / 3, borderRadius: 14, gap: 3, overflow: 'hidden', width: '100%' },
  single: { flexDirection: 'row' },
  row: { flex: 1, flexDirection: 'row', gap: 3 },
  column: { flex: 1, gap: 3 },
  cell: { flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden', position: 'relative' },
  moreOverlay: { alignItems: 'center', backgroundColor: 'rgba(5,6,7,0.58)', bottom: 0, justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 0 },
  moreText: { color: '#FFFFFF', fontFamily: typography.bodySemiBold, fontSize: 24, lineHeight: 30 },
  remove: { alignItems: 'center', backgroundColor: 'rgba(28,28,30,0.78)', borderRadius: radii.pill, borderWidth: 1, height: 28, justifyContent: 'center', position: 'absolute', right: 7, top: 7, width: 28, zIndex: 2 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.94 }] },
});
