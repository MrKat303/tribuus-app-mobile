import Feather from '@/components/ui/AppIcon';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/context/AppearanceContext';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

type IconName = ComponentProps<typeof Feather>['name'];

const categories: { icon: IconName; label: string }[] = [
  { icon: 'grid', label: 'Todo' },
  { icon: 'shopping-bag', label: 'Local' },
  { icon: 'coffee', label: 'Comida' },
  { icon: 'gift', label: 'Regalos' },
];

const products = [
  { category: 'Local', color: '#EAF8ED', icon: 'shopping-bag' as IconName, name: 'Bolsa reutilizable', price: '$8.990', shop: 'Almacén Raíces' },
  { category: 'Comida', color: '#FAF0E3', icon: 'coffee' as IconName, name: 'Café de especialidad', price: '$12.500', shop: 'Café La Tribu' },
  { category: 'Regalos', color: '#F0ECFA', icon: 'gift' as IconName, name: 'Set de cerámica', price: '$18.900', shop: 'Taller Manos' },
];

export default function ShopScreen() {
  const colors = useThemeColors();
  const styles = useStyles();
  const [selectedCategory, setSelectedCategory] = useState('Todo');
  const visibleProducts = selectedCategory === 'Todo'
    ? products
    : products.filter((product) => product.category === selectedCategory);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View>
          <AppText variant="eyebrow">Hecho cerca de ti</AppText>
          <AppText style={styles.title} variant="heading">Shop</AppText>
        </View>
        <Pressable accessibilityLabel="Ver carrito" style={[styles.cartButton]}>
          <Feather color={colors.primaryDark} name="shopping-cart" size={19} />
        </Pressable>
      </View>

      <Pressable accessibilityRole="search" style={[styles.searchBar]}>
        <Feather color={colors.textMuted} name="search" size={16} />
        <AppText style={styles.searchText}>Buscar productos o tiendas</AppText>
      </Pressable>

      <View style={styles.categories}>
        {categories.map((category) => {
          const selected = selectedCategory === category.label;
          return (
            <Pressable
              accessibilityRole="button"
              key={category.label}
              onPress={() => setSelectedCategory(category.label)}
              style={({ pressed }) => [
                styles.category,
                selected && styles.categorySelected,
                pressed && styles.pressed,
              ]}>
              <Feather color={selected ? colors.surface : colors.primaryDark} name={category.icon} size={15} />
              <AppText style={[styles.categoryText, selected && styles.categoryTextSelected]} variant="caption">{category.label}</AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionHeader}>
        <AppText variant="heading">Productos locales</AppText>
        <AppText variant="caption">{visibleProducts.length} disponibles</AppText>
      </View>

      <View style={styles.products}>
        {visibleProducts.map((product) => (
          <Pressable key={product.name} style={({ pressed }) => [styles.product, pressed && styles.pressed]}>
            <View style={[styles.productArt, { backgroundColor: product.color }]}>
              <Feather color={colors.primaryDark} name={product.icon} size={25} />
            </View>
            <View style={styles.productInfo}>
              <AppText style={styles.shopName} variant="caption">{product.shop}</AppText>
              <AppText numberOfLines={2} style={styles.productName} variant="bodyStrong">{product.name}</AppText>
              <AppText style={styles.price} variant="bodyStrong">{product.price}</AppText>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { letterSpacing: -0.6, marginTop: spacing.xs },
  cartButton: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, height: 44, justifyContent: 'center', width: 44 },
  searchBar: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, minHeight: 44, paddingHorizontal: spacing.md },
  searchText: { color: colors.textMuted, fontSize: 13 },
  categories: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  category: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth, flex: 1, gap: 5, justifyContent: 'center', minHeight: 52, paddingHorizontal: spacing.xs },
  categorySelected: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  categoryText: { color: colors.primaryDark, fontFamily: typography.bodyMedium, fontSize: 10 },
  categoryTextSelected: { color: colors.textOnPrimary, fontFamily: typography.bodySemiBold },
  sectionHeader: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xxl },
  products: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.lg },
  product: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', width: '47.5%' },
  productArt: { alignItems: 'center', height: 112, justifyContent: 'center' },
  productInfo: { padding: spacing.md },
  shopName: { color: colors.textMuted, fontSize: 10 },
  productName: { fontSize: 14, lineHeight: 18, marginTop: 2 },
  price: { color: colors.primaryDark, fontSize: 14, marginTop: spacing.sm },
  outlinedControl: { borderColor: colors.text, borderWidth: 1.2 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
}));
