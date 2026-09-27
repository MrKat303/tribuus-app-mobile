import Feather from '@/components/ui/AppIcon';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

import { useThemeColors } from '@/context/AppearanceContext';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing } from '@/theme/tokens';

import { AppText } from './ui/AppText';
import { Card } from './ui/Card';

type FeaturePlaceholderProps = {
  description: string;
  eyebrow: string;
  icon: ComponentProps<typeof Feather>['name'];
  title: string;
};

export function FeaturePlaceholder({ description, eyebrow, icon, title }: FeaturePlaceholderProps) {
  const colors = useThemeColors();
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Feather color={colors.primaryDark} name={icon} size={30} />
      </View>
      <AppText variant="eyebrow">{eyebrow}</AppText>
      <AppText style={styles.title} variant="heading">{title}</AppText>
      <AppText style={styles.description}>{description}</AppText>
      <Card style={styles.note}>
        <AppText variant="bodyStrong">Estamos preparando este espacio.</AppText>
        <AppText style={styles.noteText} variant="caption">
          Esta pantalla ya forma parte de la navegación y crecerá en una próxima etapa.
        </AppText>
      </Card>
    </View>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  container: { flex: 1, justifyContent: 'center' },
  icon: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.lg,
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing.xl,
    transform: [{ rotate: '-2deg' }],
    width: 64,
  },
  title: { marginTop: spacing.sm },
  description: { color: colors.textMuted, marginTop: spacing.md },
  note: { marginTop: spacing.xxl },
  noteText: { marginTop: spacing.xs },
}));
