import Feather from '@/components/ui/AppIcon';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { CommunityPostCard } from '@/components/CommunityPostCard';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/context/AppearanceContext';
import { usePosts } from '@/context/PostsContext';
import { useProfile } from '@/context/ProfileContext';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

const badges = [
  { color: '#2F9E5B', icon: 'map' as const, label: 'Explorador', unlocked: true },
  { color: '#7869E8', icon: 'heart' as const, label: 'Buen vecino', unlocked: true },
  { color: '#A7A7AC', icon: 'lock' as const, label: 'Próximo badge', unlocked: false },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { colors: themeColors, isDark } = useAppAppearance();
  const styles = useStyles();
  const { posts } = usePosts();
  const { profile } = useProfile();
  const initials = useMemo(() => profile.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase(), [profile.name]);
  const ownPosts = useMemo(() => posts.filter((post) => post.id.startsWith('local-post-') || post.author === 'Jaime M.'), [posts]);

  return (
    <Screen scroll>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Volver" hitSlop={8} onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: themeColors.surfaceMuted }]}>
          <Feather color={themeColors.text} name="chevron-left" size={24} />
        </Pressable>
        <AppText style={styles.screenTitle} variant="bodyStrong">Mi perfil</AppText>
        <Pressable accessibilityLabel="Abrir configuración" onPress={() => router.push('/configuracion')} style={[styles.iconButton, { backgroundColor: themeColors.primarySoft }]}>
          <Feather color={themeColors.primaryDark} name="settings" size={19} />
        </Pressable>
      </View>

      <View style={styles.identity}>
        <View style={[styles.cover, { backgroundColor: isDark ? '#173822' : '#DDEFE3' }]}>
          <View style={styles.coverGlowLarge} />
          <View style={styles.coverGlowSmall} />
          <Feather color="rgba(255,255,255,0.32)" name="users" size={62} style={styles.coverIcon} />
        </View>
        <View style={[styles.avatarRing, { backgroundColor: themeColors.background }]}>
          <View style={[styles.avatar, { backgroundColor: themeColors.surfaceMuted, borderColor: themeColors.surface }]}><AppText style={[styles.avatarText, { color: themeColors.text }]}>{initials}</AppText></View>
        </View>

        <View style={[styles.profileCopy]}>
          <View style={styles.nameRow}>
            <View style={styles.nameCopy}>
              <AppText style={styles.name} variant="heading">{profile.name}</AppText>
              <View style={styles.locationRow}>
                <Feather color={themeColors.textMuted} name="map-pin" size={13} />
                <AppText style={[styles.location, { color: themeColors.textMuted }]} variant="caption">Providencia</AppText>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/ajustes/[section]', params: { section: 'informacion-personal' } })}
              style={({ pressed }) => [styles.editButton, { backgroundColor: themeColors.surfaceMuted }, pressed && styles.pressed]}>
              <Feather color={themeColors.text} name="edit-2" size={14} />
              <AppText style={[styles.editLabel, { color: themeColors.text }]} variant="caption">Editar</AppText>
            </Pressable>
          </View>
          {profile.bio ? <AppText style={[styles.bio, { color: themeColors.textMuted }]}>{profile.bio}</AppText> : null}
        </View>
      </View>

      <View style={[styles.sectionHeader]}>
        <View>
          <AppText style={styles.sectionTitle} variant="heading">Badges</AppText>
          <AppText style={[styles.sectionSubtitle, { color: themeColors.textMuted }]} variant="caption">Reconocimientos por participar en tu comunidad</AppText>
        </View>
        <View style={[styles.futurePill, { backgroundColor: themeColors.surfaceMuted }]}><AppText style={[styles.futureText, { color: themeColors.textMuted }]} variant="caption">Próximamente</AppText></View>
      </View>

      <View style={styles.badges}>
        {badges.map((badge) => (
          <View key={badge.label} style={[styles.badge, !badge.unlocked && styles.badgeLocked]}>
            <View style={[styles.badgeIcon, { backgroundColor: badge.unlocked ? badge.color : themeColors.surfaceMuted }]}>
              <Feather color={badge.unlocked ? '#FFFFFF' : themeColors.textMuted} name={badge.icon} size={20} />
            </View>
            <AppText numberOfLines={2} style={[styles.badgeLabel, { color: themeColors.text }]} variant="caption">{badge.label}</AppText>
          </View>
        ))}
      </View>

      <View style={[styles.postsHeader]}>
        <AppText style={styles.sectionTitle} variant="heading">Publicaciones</AppText>
        <AppText style={[styles.postCount, { color: themeColors.textMuted }]} variant="caption">{ownPosts.length}</AppText>
      </View>

      <View style={styles.posts}>
        {ownPosts.length ? ownPosts.map((post, index) => (
          <View key={post.id}>
            <CommunityPostCard post={post} />
            {index < ownPosts.length - 1 ? <View style={[styles.postDivider, { backgroundColor: themeColors.border }]} /> : null}
          </View>
        )) : (
          <View style={[styles.emptyPosts]}>
            <View style={[styles.emptyIcon, { backgroundColor: themeColors.primarySoft }]}><Feather color={themeColors.primaryDark} name="edit-3" size={21} /></View>
            <AppText variant="bodyStrong">Todavía no has publicado</AppText>
            <AppText style={[styles.emptyCopy, { color: themeColors.textMuted }]} variant="caption">Cuando compartas algo con tu comunidad, aparecerá aquí.</AppText>
            <Pressable onPress={() => router.push('/(tabs)/publicar')} style={({ pressed }) => [styles.publishButton, { backgroundColor: themeColors.primaryDark }, pressed && styles.pressed]}>
              <Feather color={themeColors.textOnPrimary} name="plus" size={16} />
              <AppText style={[styles.publishLabel, { color: themeColors.textOnPrimary }]} variant="caption">Crear publicación</AppText>
            </Pressable>
          </View>
        )}
      </View>
    </Screen>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  screenTitle: { fontFamily: Platform.select({ ios: 'System', default: typography.bodySemiBold }), fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  iconButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  identity: { position: 'relative' },
  cover: { backgroundColor: '#DDEFE3', borderRadius: 16, height: 124, overflow: 'hidden', position: 'relative' },
  coverGlowLarge: { backgroundColor: '#83C98A', borderRadius: 130, height: 220, opacity: 0.72, position: 'absolute', right: -36, top: -82, transform: [{ rotate: '-18deg' }], width: 225 },
  coverGlowSmall: { backgroundColor: '#B8DEC3', borderRadius: 100, bottom: -92, height: 175, left: -36, opacity: 0.9, position: 'absolute', width: 195 },
  coverIcon: { opacity: 0.65, position: 'absolute', right: 22, top: 31 },
  avatarRing: { alignItems: 'center', backgroundColor: colors.background, borderRadius: radii.pill, height: 76, justifyContent: 'center', left: 14, position: 'absolute', top: 90, width: 76 },
  avatar: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, height: 66, justifyContent: 'center', width: 66 },
  avatarText: { color: colors.text, fontFamily: Platform.select({ ios: 'System', default: typography.title }), fontSize: 20, fontWeight: '600' },
  profileCopy: { paddingTop: 40 },
  nameRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  nameCopy: { flex: 1 },
  name: { fontFamily: Platform.select({ ios: 'System', default: typography.title }), fontSize: 24, fontWeight: '700', letterSpacing: -0.5, lineHeight: 29 },
  locationRow: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 2 },
  location: { color: colors.textMuted, fontFamily: Platform.select({ ios: 'System', default: typography.body }), fontSize: 12 },
  editButton: { alignItems: 'center', borderRadius: 9, flexDirection: 'row', gap: 5, minHeight: 36, paddingHorizontal: 11 },
  editLabel: { color: colors.text, fontFamily: Platform.select({ ios: 'System', default: typography.bodySemiBold }), fontSize: 12, fontWeight: '600' },
  bio: { color: '#636366', fontFamily: Platform.select({ ios: 'System', default: typography.body }), fontSize: 14, lineHeight: 19, marginTop: 10, maxWidth: 430 },
  sectionHeader: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: 26 },
  sectionTitle: { fontFamily: Platform.select({ ios: 'System', default: typography.bodySemiBold }), fontSize: 20, fontWeight: '600', letterSpacing: -0.35, lineHeight: 25 },
  sectionSubtitle: { color: colors.textMuted, fontFamily: Platform.select({ ios: 'System', default: typography.body }), fontSize: 11, marginTop: 1 },
  futurePill: { borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3 },
  futureText: { color: colors.textMuted, fontFamily: Platform.select({ ios: 'System', default: typography.bodyMedium }), fontSize: 9, fontWeight: '500' },
  badges: { flexDirection: 'row', gap: spacing.sm, marginTop: 14 },
  badge: { alignItems: 'center', flex: 1, minHeight: 82, paddingHorizontal: spacing.xs, paddingVertical: 4 },
  badgeLocked: { opacity: 0.62 },
  badgeIcon: { alignItems: 'center', borderRadius: radii.pill, height: 44, justifyContent: 'center', width: 44 },
  badgeLabel: { color: colors.text, fontFamily: Platform.select({ ios: 'System', default: typography.bodyMedium }), fontSize: 10, fontWeight: '500', lineHeight: 13, marginTop: 6, textAlign: 'center' },
  postsHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 26 },
  postCount: { color: colors.textMuted, fontFamily: Platform.select({ ios: 'System', default: typography.bodyMedium }), fontSize: 12, fontWeight: '500', minWidth: 20, textAlign: 'right' },
  posts: { marginHorizontal: -20, marginTop: spacing.sm },
  postDivider: { backgroundColor: colors.border, height: StyleSheet.hairlineWidth, marginHorizontal: 20 },
  emptyPosts: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 36 },
  emptyIcon: { alignItems: 'center', borderRadius: radii.pill, height: 44, justifyContent: 'center', marginBottom: spacing.md, width: 44 },
  emptyCopy: { color: colors.textMuted, fontFamily: Platform.select({ ios: 'System', default: typography.body }), fontSize: 12, lineHeight: 17, marginTop: 2, maxWidth: 300, textAlign: 'center' },
  publishButton: { alignItems: 'center', borderRadius: 10, flexDirection: 'row', gap: 6, marginTop: 14, minHeight: 40, paddingHorizontal: spacing.lg },
  publishLabel: { fontFamily: Platform.select({ ios: 'System', default: typography.bodySemiBold }), fontWeight: '600' },
  pressed: { opacity: 0.68, transform: [{ scale: 0.98 }] },
}));
