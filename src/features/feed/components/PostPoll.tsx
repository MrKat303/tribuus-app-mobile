import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/context/AppearanceContext';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';
import type { CommunityPoll } from '@/types/community';

type PostPollProps = {
  onSelect: (optionId: string) => void;
  poll: CommunityPoll;
  selectedOptionId?: string;
};

export function PostPoll({ onSelect, poll, selectedOptionId }: PostPollProps) {
  const { colors: themeColors } = useAppAppearance();
  const styles = useStyles();

  return (
    <View style={styles.poll}>
      <AppText style={styles.question} variant="bodyStrong">{poll.question}</AppText>
      {poll.options.map((option) => {
        const selected = selectedOptionId === option.id;
        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            key={option.id}
            onPress={() => onSelect(option.id)}
            style={[styles.option, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }, selected && { backgroundColor: themeColors.primarySoft, borderColor: themeColors.primary }]}>
            <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <AppIcon color={themeColors.textOnPrimary} name="check" size={12} /> : null}</View>
            <AppText style={[styles.optionText, { color: selected ? themeColors.primaryDark : themeColors.text }]} variant="caption">{option.label}</AppText>
            {selectedOptionId ? <AppText style={styles.votes} variant="caption">{option.votes}</AppText> : null}
          </Pressable>
        );
      })}
      <AppText style={styles.hint} variant="caption">{selectedOptionId ? 'Voto registrado en este dispositivo' : 'Toca una opción para votar'}</AppText>
    </View>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  poll: { gap: 7, marginTop: 11 },
  question: { fontFamily: typography.bodySemiBold, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  option: { alignItems: 'center', borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.sm, minHeight: 42, paddingHorizontal: 12 },
  radio: { alignItems: 'center', borderColor: '#AEAEB2', borderRadius: radii.pill, borderWidth: 1, height: 18, justifyContent: 'center', width: 18 },
  radioSelected: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  optionText: { flex: 1, fontFamily: typography.bodyMedium, fontSize: 13, fontWeight: '500' },
  votes: { color: colors.primaryDark, fontFamily: typography.bodyMedium },
  hint: { color: colors.textMuted, fontFamily: typography.body, fontSize: 10, paddingHorizontal: 2 },
}));
