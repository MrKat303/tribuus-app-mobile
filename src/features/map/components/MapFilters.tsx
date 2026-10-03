import { memo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/theme/AppearanceProvider';
import { makeThemedStyles } from '@/theme/themedStyles';
import { spacing } from '@/theme/tokens';

import { MAP_FILTERS, type MapFilter } from '../model/map';
import { filterColor, filterIcon } from '../ui/mapPresentation';

type MapFiltersProps = {
  activeFilter: MapFilter;
  onChange: (filter: MapFilter) => void;
};

const filterLabel: Record<MapFilter, string> = {
  Bar: 'Bar',
  Café: 'Cafés',
  Evento: 'Evento',
  Restaurante: 'Restaurantes',
  Todos: 'Todos',
};

export const MapFilters = memo(function MapFilters({ activeFilter, onChange }: MapFiltersProps) {
  const { colors: themeColors } = useAppAppearance();
  const styles = useStyles();

  return (
    <View style={styles.categoryBar}>
      <ScrollView contentContainerStyle={styles.categoriesContent} horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {MAP_FILTERS.map((filter) => {
          const active = activeFilter === filter;
          const accent = filter === 'Todos' ? themeColors.primaryDark : filterColor[filter];
          return (
            <Pressable
              accessibilityRole="button"
              hitSlop={2}
              key={filter}
              onPress={() => onChange(filter)}
              style={({ pressed }) => [
                styles.categoryItem,
                { backgroundColor: themeColors.overlay, borderColor: themeColors.border },
                active && { backgroundColor: themeColors.primaryDark, borderColor: themeColors.primaryDark },
                pressed && styles.categoryItemPressed,
              ]}>
              <AppIcon color={active ? themeColors.textOnPrimary : accent} name={filter === 'Todos' ? 'grid' : filterIcon[filter]} size={15} />
              <AppText style={[styles.categoryText, { color: themeColors.text }, active && { color: themeColors.textOnPrimary }]} variant="caption">{filterLabel[filter]}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

const useStyles = makeThemedStyles((colors) => ({
  categoryBar: { alignItems: 'center', flexDirection: 'row', minHeight: 44 },
  categories: { flex: 1 },
  categoriesContent: { alignItems: 'center', gap: 6, paddingHorizontal: 1, paddingRight: spacing.sm },
  categoryItem: { alignItems: 'center', backgroundColor: 'rgba(20,27,23,0.96)', borderColor: colors.border, borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 4, justifyContent: 'center', minHeight: 40, paddingHorizontal: 11 },
  categoryItemActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  categoryItemPressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  categoryText: { color: colors.text, fontSize: 10.5, lineHeight: 14 },
  categoryTextActive: { color: colors.background },
}));
