import Feather from '@/components/ui/AppIcon';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/ui/AppText';
import { useProfile } from '@/context/ProfileContext';
import { useThemeColors } from '@/context/AppearanceContext';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

type WalletEntry = { amount: number; date: string; detail: string; icon: 'arrow-down-left' | 'arrow-up-right'; title: string; type: 'Aporte' | 'Gasto' };

const neighborhood = 'Providencia';
const initialEntries: WalletEntry[] = [
  { amount: 85000, date: '12 sep 2026', detail: 'Compra de pintura · comprobante disponible', icon: 'arrow-up-right', title: 'Pintura para la plaza', type: 'Gasto' },
  { amount: 10000, date: '10 sep 2026', detail: 'Aporte de vecino verificado', icon: 'arrow-down-left', title: 'Aporte comunitario', type: 'Aporte' },
  { amount: 45000, date: '08 sep 2026', detail: 'Reparación de luminaria', icon: 'arrow-up-right', title: 'Luz pasaje Los Aromos', type: 'Gasto' },
  { amount: 15000, date: '05 sep 2026', detail: 'Aporte de vecino verificado', icon: 'arrow-down-left', title: 'Aporte comunitario', type: 'Aporte' },
];
const initialProposals = [
  { id: 'benches', amount: 120000, by: 'Camila R.', category: 'ESPACIOS PÚBLICOS', description: 'Instalar bancas en la plaza', raised: 84000, summary: 'Un lugar cómodo para descansar y encontrarnos como vecinos.', votes: 18 },
  { id: 'cleanup', amount: 60000, by: 'Diego M.', category: 'LIMPIEZA', description: 'Herramientas para la jornada de limpieza', raised: 23000, summary: 'Guantes, bolsas y herramientas para cuidar nuestras calles.', votes: 9 },
];

const formatCLP = (value: number) => `$${value.toLocaleString('es-CL')}`;
const paymentSources = ['Saldo Tribus', 'Tarjeta terminada en 4821', 'Transferencia bancaria'] as const;

function WalletPressable({ children, style, ...props }: ComponentProps<typeof Pressable>) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        {...props}
        onPressIn={(event) => {
          scale.set(withSpring(0.975, { damping: 14, stiffness: 360 }));
          props.onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.set(withSpring(1, { damping: 14, stiffness: 360 }));
          props.onPressOut?.(event);
        }}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default function CommunityWalletScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useStyles();
  const { profile } = useProfile();
  const [entries, setEntries] = useState(initialEntries);
  const [proposals, setProposals] = useState(initialProposals);
  const [supportedProposals, setSupportedProposals] = useState<string[]>([]);
  const [showDonate, setShowDonate] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalAmount, setProposalAmount] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [donationError, setDonationError] = useState('');
  const [paymentSource, setPaymentSource] = useState<'Saldo Tribus' | 'Tarjeta terminada en 4821' | 'Transferencia bancaria'>('Saldo Tribus');
  const [lastDonation, setLastDonation] = useState({ amount: 0, source: 'Saldo Tribus' });
  const [notice, setNotice] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'Todo' | 'Aportes' | 'Gastos'>('Todo');
  const balance = 485000 + entries.filter((entry) => entry.title === 'Tu aporte').reduce((sum, item) => sum + item.amount, 0);
  const visibleEntries = entries.filter((entry) => historyFilter === 'Todo' || (historyFilter === 'Aportes' ? entry.type === 'Aporte' : entry.type === 'Gasto'));
  const monthlyTotals = useMemo(() => ({
    contributions: entries.filter((entry) => entry.type === 'Aporte').reduce((total, entry) => total + entry.amount, 0),
    expenses: entries.filter((entry) => entry.type === 'Gasto').reduce((total, entry) => total + entry.amount, 0),
  }), [entries]);
  const entrance = useSharedValue(0);
  const balanceScale = useSharedValue(0.96);
  const entranceStyle = useAnimatedStyle(() => ({ opacity: entrance.get(), transform: [{ translateY: (1 - entrance.get()) * 14 }] }));
  const balanceStyle = useAnimatedStyle(() => ({ transform: [{ scale: balanceScale.get() }] }));

  useEffect(() => {
    entrance.set(withTiming(1, { duration: 360 }));
    balanceScale.set(withDelay(85, withSpring(1, { damping: 16, stiffness: 170 })));
  }, [balanceScale, entrance]);

  const openDonation = () => {
    setDonationAmount('');
    setDonationError('');
    setShowDonate(true);
    setShowProposal(false);
  };

  const donate = () => {
    const amount = Number(donationAmount.replace(/\D/g, ''));
    if (!amount || amount < 500) {
      setDonationError('Ingresa un aporte de al menos $500.');
      return;
    }
    setEntries((current) => [{ amount, date: 'Hoy', detail: `Aporte desde ${paymentSource} · demo`, icon: 'arrow-down-left', title: 'Tu aporte', type: 'Aporte' }, ...current]);
    setLastDonation({ amount, source: paymentSource });
    setDonationAmount('');
    setDonationError('');
    setShowDonate(false);
    setShowReceipt(true);
  };

  const changePaymentSource = () => {
    setPaymentSource((current) => paymentSources[(paymentSources.indexOf(current) + 1) % paymentSources.length]);
  };

  const submitProposal = () => {
    const amount = Number(proposalAmount.replace(/\D/g, ''));
    if (!proposalTitle.trim() || !amount) return;
    setProposals((current) => [{ id: `initiative-${Date.now()}`, amount, by: profile.name, category: 'NUEVA INICIATIVA', description: proposalTitle.trim(), raised: 0, summary: 'Propuesta compartida por un vecino del barrio.', votes: 0 }, ...current]);
    setProposalTitle('');
    setProposalAmount('');
    setShowProposal(false);
    setNotice('Tu propuesta ya aparece para revisión de los vecinos.');
  };

  return (
    <Screen scroll swipeTabs={false}>
      <Animated.View style={entranceStyle}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Volver" hitSlop={8} onPress={() => router.back()} style={styles.backButton}><Feather color={colors.text} name="chevron-left" size={23} /></Pressable>
        <AppText style={styles.topTitle} variant="bodyStrong">Fondo del barrio</AppText>
        <View style={styles.topIcon}><Feather color={colors.primaryDark} name="users" size={17} /></View>
      </View>

      <View style={styles.intro}>
        <AppText style={styles.eyebrow} variant="eyebrow">CAJA VECINAL</AppText>
        <AppText style={styles.heading} variant="heading">Fondo comunitario</AppText>
        <AppText style={styles.subheading} variant="caption">La comunidad propone y decide en conjunto.</AppText>
      </View>

      <View style={styles.neighborhoodLabel}><Feather color={colors.primaryDark} name="map-pin" size={14} /><AppText style={styles.neighborhoodCaption} variant="caption">TU COMUNIDAD</AppText><AppText style={styles.neighborhoodName} variant="bodyStrong">{neighborhood}</AppText></View>

      <Animated.View style={[styles.balanceCard, balanceStyle]}>
        <View style={styles.balanceTop}><View style={styles.balanceLabel}><AppText style={styles.balanceEyebrow} variant="caption">SALDO DISPONIBLE</AppText></View><View style={styles.balanceIcon}><Feather color={colors.primaryDark} name="shield" size={15} /></View></View>
        <AppText style={styles.balanceAmount} variant="heading">{formatCLP(balance)}</AppText>
        <View style={styles.balanceFooter}><View style={styles.communityLabel}><Feather color={colors.primaryDark} name="map-pin" size={11} /><AppText style={styles.balanceMeta} variant="caption">{neighborhood} · 36 vecinos</AppText></View><View style={styles.demoBadge}><AppText style={styles.demoBadgeText} variant="caption">DEMO</AppText></View></View>
      </Animated.View>

      <View style={styles.actions}>
        <WalletPressable accessibilityRole="button" onPress={openDonation} style={styles.primaryAction}><View style={styles.actionIcon}><Feather color={colors.primaryDark} name="plus" size={17} /></View><AppText style={styles.primaryActionText} variant="bodyStrong">Aportar al fondo</AppText></WalletPressable>
        <WalletPressable accessibilityRole="button" onPress={() => { setNotice(''); setShowProposal((value) => !value); setShowDonate(false); }} style={styles.secondaryAction}><Feather color={colors.primaryDark} name="edit-3" size={16} /><AppText style={styles.secondaryActionText} variant="bodyStrong">Nueva iniciativa</AppText></WalletPressable>
      </View>

      <View style={styles.verifiedHint}><Feather color={colors.primaryDark} name="shield" size={12} /><AppText style={styles.verifiedHintText} variant="caption">Aportes e iniciativas para vecinos verificados</AppText></View>

      {showProposal ? <View style={styles.formCard}><AppText variant="bodyStrong">Nueva propuesta de gasto</AppText><TextInput onChangeText={setProposalTitle} placeholder="¿Qué necesita el barrio?" placeholderTextColor={colors.textMuted} style={styles.input} value={proposalTitle} /><TextInput keyboardType="numeric" onChangeText={setProposalAmount} placeholder="Monto estimado en CLP" placeholderTextColor={colors.textMuted} style={styles.input} value={proposalAmount} /><Pressable onPress={submitProposal} style={styles.submitButton}><AppText style={styles.primaryActionText} variant="bodyStrong">Publicar propuesta</AppText></Pressable></View> : null}

      {notice ? <View style={styles.notice}><Feather color={colors.primaryDark} name="check-circle" size={15} /><AppText style={styles.noticeText} variant="caption">{notice}</AppText></View> : null}

      <View style={styles.monthlySummary}>
        <View style={styles.monthlyItem}><View style={[styles.monthlyIcon, styles.incomeIcon]}><Feather color={colors.primaryDark} name="arrow-down-left" size={15} /></View><View><AppText style={styles.monthlyLabel} variant="caption">APORTES DEL MES</AppText><AppText style={styles.monthlyAmount} variant="bodyStrong">{formatCLP(monthlyTotals.contributions)}</AppText></View></View>
        <View style={styles.monthlyDivider} />
        <View style={styles.monthlyItem}><View style={[styles.monthlyIcon, styles.expenseIcon]}><Feather color={colors.textMuted} name="arrow-up-right" size={15} /></View><View><AppText style={styles.monthlyLabel} variant="caption">USADO ESTE MES</AppText><AppText style={styles.monthlyAmount} variant="bodyStrong">{formatCLP(monthlyTotals.expenses)}</AppText></View></View>
      </View>

      {proposals[0] ? <View style={styles.featuredWrap}>
        <View style={styles.featuredHeader}><View><AppText style={styles.featuredKicker} variant="caption">EN MOVIMIENTO</AppText><AppText style={styles.featuredHeading} variant="heading">Iniciativa destacada</AppText></View><View style={styles.liveBadge}><View style={styles.liveDot} /><AppText style={styles.liveLabel} variant="caption">ACTIVA</AppText></View></View>
        <View style={styles.featuredCard}>
          <View style={styles.featuredTop}><View style={styles.featuredGlyph}><Feather color={colors.primaryDark} name="sun" size={20} /></View><View style={styles.featuredCopy}><AppText style={styles.featuredCategory} variant="caption">{proposals[0].category}</AppText><AppText style={styles.featuredTitle} variant="bodyStrong">{proposals[0].description}</AppText><AppText style={styles.featuredSummary} variant="caption">{proposals[0].summary}</AppText></View><View style={styles.featuredPercent}><AppText style={styles.percentValue} variant="bodyStrong">{Math.round((proposals[0].raised / proposals[0].amount) * 100)}%</AppText><AppText style={styles.percentLabel} variant="caption">financiado</AppText></View></View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min((proposals[0].raised / proposals[0].amount) * 100, 100)}%` }]} /></View>
          <View style={styles.featuredFooter}><AppText style={styles.progressCopy} variant="caption">{formatCLP(proposals[0].raised)} reunidos de {formatCLP(proposals[0].amount)}</AppText><View style={styles.featuredSupport}><Feather color={colors.primaryDark} name="users" size={13} /><AppText style={styles.featuredSupportText} variant="caption">{proposals[0].votes} apoyos</AppText></View></View>
        </View>
      </View> : null}

      <View style={styles.sectionHeader}><View><AppText style={styles.sectionTitle} variant="heading">Iniciativas del barrio</AppText><AppText style={styles.sectionSubtitle} variant="caption">Propuestas abiertas a la comunidad</AppText></View><View style={styles.sectionCount}><AppText style={styles.countLabel} variant="caption">{proposals.length}</AppText></View></View>
      {proposals.map((proposal) => {
        const isSupported = supportedProposals.includes(proposal.id);
        return (
          <View key={proposal.id} style={styles.proposal}>
            <View style={styles.proposalTop}>
              <View style={styles.proposalIdentity}><View style={styles.proposalGlyph}><Feather color={colors.primaryDark} name={proposal.id === 'benches' ? 'sun' : proposal.id === 'cleanup' ? 'trash-2' : 'heart'} size={17} /></View><View style={styles.proposalCategory}><AppText style={styles.proposalCategoryText} variant="caption">{proposal.category}</AppText><View style={styles.proposalStatus}><View style={styles.statusDot} /><AppText style={styles.proposalStatusText} variant="caption">En evaluación</AppText></View></View></View>
            </View>
            <AppText style={styles.proposalTitle} variant="bodyStrong">{proposal.description}</AppText>
            <AppText style={styles.proposalSummary} variant="caption">{proposal.summary}</AppText>
            <View style={styles.proposalBudget}><View><AppText style={styles.budgetLabel} variant="caption">PRESUPUESTO ESTIMADO</AppText><AppText style={styles.proposalAmount} variant="bodyStrong">{formatCLP(proposal.amount)}</AppText></View><View style={styles.proposalAuthor}><View style={styles.authorAvatar}><AppText style={styles.authorInitial}>{proposal.by.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</AppText></View><View><AppText style={styles.authorLabel} variant="caption">Propuesta por</AppText><AppText style={styles.authorName} variant="caption">{proposal.by}</AppText></View></View></View>
            <View style={styles.initiativeProgress}><View style={[styles.initiativeProgressFill, { width: `${Math.min((proposal.raised / proposal.amount) * 100, 100)}%` }]} /></View>
            <View style={styles.proposalDivider} />
            <View style={styles.proposalFooter}><View><AppText style={styles.communitySupport} variant="caption">{proposal.votes + (isSupported ? 1 : 0)} vecinos apoyan</AppText><AppText style={styles.raisedCopy} variant="caption">{formatCLP(proposal.raised)} reunidos</AppText></View><WalletPressable accessibilityRole="button" accessibilityState={{ selected: isSupported }} onPress={() => setSupportedProposals((current) => isSupported ? current.filter((id) => id !== proposal.id) : [...current, proposal.id])} style={[styles.supportButton, isSupported && styles.supportButtonActive]}><Feather color={isSupported ? colors.textOnPrimary : colors.primaryDark} name={isSupported ? 'check' : 'thumbs-up'} size={13} /><AppText style={[styles.supportButtonText, isSupported && styles.supportButtonTextActive]} variant="caption">{isSupported ? 'Apoyando' : 'Apoyar iniciativa'}</AppText></WalletPressable></View>
          </View>
        );
      })}

      <View style={styles.sectionHeader}><View><AppText style={styles.sectionTitle} variant="heading">Historial</AppText><AppText style={styles.sectionSubtitle} variant="caption">Aportes y gastos del fondo</AppText></View><Feather color={colors.textMuted} name="clock" size={17} /></View>
      <View style={styles.historyFilters}>{(['Todo', 'Aportes', 'Gastos'] as const).map((filter) => <WalletPressable key={filter} accessibilityRole="button" accessibilityState={{ selected: historyFilter === filter }} onPress={() => setHistoryFilter(filter)} style={[styles.historyFilter, historyFilter === filter && styles.historyFilterActive]}><AppText style={[styles.historyFilterText, historyFilter === filter && styles.historyFilterTextActive]} variant="caption">{filter}</AppText></WalletPressable>)}</View>
      <View style={styles.historyCard}>{visibleEntries.map((entry, index) => <View key={`${entry.title}-${entry.date}-${index}`} style={[styles.entry, index === visibleEntries.length - 1 && styles.entryLast]}><View style={[styles.entryIcon, entry.type === 'Aporte' ? styles.incomeIcon : styles.expenseIcon]}><Feather color={entry.type === 'Aporte' ? colors.primaryDark : colors.textMuted} name={entry.icon} size={16} /></View><View style={styles.entryCopy}><AppText numberOfLines={1} variant="bodyStrong">{entry.title}</AppText><AppText numberOfLines={1} style={styles.entryMeta} variant="caption">{entry.date} · {entry.detail}</AppText></View><View style={styles.entryAmountColumn}><AppText style={[styles.entryAmount, entry.type === 'Aporte' && styles.incomeAmount]} variant="bodyStrong">{entry.type === 'Aporte' ? '+' : '−'}{formatCLP(entry.amount)}</AppText><AppText style={styles.entryType} variant="caption">{entry.type}</AppText></View></View>)}</View>

      <View style={styles.footerNote}><Feather color={colors.textMuted} name="info" size={14} /><AppText style={styles.footerText} variant="caption">Prototipo visual. Aportes, propuestas y saldos son datos de ejemplo; los controles de verificación y pagos aún no están conectados.</AppText></View>
      </Animated.View>
      <Modal animationType="slide" onRequestClose={() => setShowDonate(false)} visible={showDonate}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.donationPage}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.donationPage}>
          <View style={[styles.donationSheet, styles.donationSheetFullscreen]}>
            <View style={[styles.sheetHeader, styles.sheetHeaderFullscreen]}><Pressable accessibilityLabel="Volver" hitSlop={10} onPress={() => setShowDonate(false)} style={styles.sheetBack}><Feather color={colors.text} name="chevron-left" size={23} /></Pressable><AppText style={styles.sheetTitle} variant="bodyStrong">Aportar fondos</AppText><Pressable accessibilityLabel="Más opciones" hitSlop={10} style={styles.sheetClose}><Feather color={colors.textMuted} name="more-vertical" size={20} /></Pressable></View>
            <View style={styles.targetSection}><AppText style={styles.targetLabel} variant="caption">APORTAR A</AppText><View style={styles.fundTarget}><View style={styles.fundTargetIcon}><Feather color={colors.primaryDark} name="users" size={18} /></View><View style={styles.fundTargetCopy}><AppText style={styles.fundTargetTitle} variant="bodyStrong">Fondo comunitario</AppText><AppText style={styles.fundTargetDetail} variant="caption">Providencia · 36 vecinos</AppText></View><View style={styles.targetCheck}><Feather color={colors.primaryDark} name="check" size={14} /></View></View></View>
            <View style={[styles.amountField, styles.amountFieldReference]}><AppText style={styles.currencyPrefix} variant="heading">$</AppText><TextInput accessibilityLabel="Monto del aporte" autoFocus keyboardType="number-pad" onChangeText={(value) => { setDonationAmount(value.replace(/\D/g, '')); setDonationError(''); }} placeholder="0" placeholderTextColor={colors.textMuted} style={[styles.donationInput, styles.donationInputReference]} value={donationAmount} /></View>
            {donationError ? <AppText style={styles.donationError} variant="caption">{donationError}</AppText> : <AppText style={[styles.amountHelper, styles.amountHelperReference]} variant="caption">Ingresa el monto de tu aporte</AppText>}
            <View style={[styles.quickAmounts, styles.quickAmountsReference]}>{[2000, 5000, 10000, 20000].map((amount) => <WalletPressable key={amount} accessibilityRole="button" onPress={() => { setDonationAmount(String(amount)); setDonationError(''); }} style={[styles.quickAmount, styles.quickAmountReference, donationAmount === String(amount) && styles.quickAmountActive]}><AppText style={[styles.quickAmountText, styles.quickAmountTextReference, donationAmount === String(amount) && styles.quickAmountTextActive]} variant="caption">{formatCLP(amount)}</AppText></WalletPressable>)}</View>
            <View style={[styles.paymentSectionHeader, styles.paymentSectionHeaderReference]}><AppText style={styles.paymentLabel} variant="caption">DESDE</AppText><AppText style={styles.paymentSecure} variant="caption">Pago seguro</AppText></View>
            <WalletPressable accessibilityRole="button" onPress={changePaymentSource} style={[styles.paymentSource, styles.paymentSourceReference]}><View style={[styles.paymentSourceIcon, styles.paymentSourceIconReference]}><Feather color={colors.primaryDark} name={paymentSource === 'Saldo Tribus' ? 'briefcase' : paymentSource === 'Tarjeta terminada en 4821' ? 'credit-card' : 'home'} size={18} /></View><View style={styles.paymentSourceCopy}><AppText style={[styles.paymentSourceTitle, styles.paymentSourceTitleReference]} variant="bodyStrong">{paymentSource}</AppText><AppText style={[styles.paymentSourceDetail, styles.paymentSourceDetailReference]} variant="caption">{paymentSource === 'Saldo Tribus' ? 'Disponible para aportar ahora' : paymentSource === 'Tarjeta terminada en 4821' ? 'Crédito o débito' : 'Se confirmará antes de aportar'}</AppText></View><View style={styles.changeSource}><AppText style={styles.changeSourceText} variant="caption">Cambiar</AppText><Feather color={colors.primaryDark} name="chevron-right" size={15} /></View></WalletPressable>
            <WalletPressable accessibilityRole="button" onPress={donate} style={[styles.donateButton, styles.donateButtonReference]}><AppText style={[styles.donateButtonText, styles.donateButtonTextReference]} variant="bodyStrong">Continuar con {donationAmount ? formatCLP(Number(donationAmount)) : 'tu aporte'}</AppText><Feather color={colors.textOnPrimary} name="arrow-right" size={17} /></WalletPressable>
          </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
      <Modal animationType="fade" onRequestClose={() => setShowReceipt(false)} transparent visible={showReceipt}>
        <View style={styles.receiptOverlay}>
          <View style={styles.receiptCard}>
            <View style={styles.receiptSuccess}><Feather color={colors.textOnPrimary} name="check" size={27} /></View>
            <AppText style={styles.receiptTitle} variant="heading">Aporte registrado</AppText>
            <AppText style={styles.receiptSubhead} variant="caption">Gracias por apoyar a {neighborhood}.</AppText>
            <View style={styles.receiptAmount}><AppText style={styles.receiptAmountLabel} variant="caption">MONTO APORTADO</AppText><AppText style={styles.receiptAmountValue} variant="heading">{formatCLP(lastDonation.amount)}</AppText></View>
            <View style={styles.receiptDetails}><View style={styles.receiptLine}><AppText style={styles.receiptKey} variant="caption">Desde</AppText><AppText style={styles.receiptValue} variant="caption">{lastDonation.source}</AppText></View><View style={styles.receiptLine}><AppText style={styles.receiptKey} variant="caption">Destino</AppText><AppText style={styles.receiptValue} variant="caption">Fondo de {neighborhood}</AppText></View><View style={styles.receiptLine}><AppText style={styles.receiptKey} variant="caption">Estado</AppText><AppText style={styles.receiptComplete} variant="caption">Completado</AppText></View></View>
            <WalletPressable accessibilityRole="button" onPress={() => { setShowReceipt(false); setNotice(`Tu aporte de ${formatCLP(lastDonation.amount)} ya aparece en el historial.`); }} style={styles.receiptButton}><AppText style={styles.receiptButtonText} variant="bodyStrong">Listo</AppText></WalletPressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, backButton: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 40 }, topTitle: { fontSize: 15, letterSpacing: -0.2 }, topIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 40 },
  intro: { marginTop: 23 }, eyebrow: { color: colors.primaryDark, fontSize: 9, letterSpacing: 1 }, heading: { fontSize: 29, letterSpacing: -0.9, lineHeight: 34, marginTop: 4 }, subheading: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  neighborhoodLabel: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 19 }, neighborhoodCaption: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 10 }, neighborhoodName: { color: colors.text, fontSize: 12, marginLeft: 2 },
  balanceCard: { backgroundColor: colors.primaryDark, borderColor: 'rgba(255,255,255,0.13)', borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, marginTop: 12, minHeight: 180, overflow: 'hidden', padding: 20, shadowColor: colors.shadow, shadowOffset: { height: 10, width: 0 }, shadowOpacity: 0.16, shadowRadius: 18 }, balanceTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, balanceLabel: { alignItems: 'center', flexDirection: 'row', gap: 7 }, balanceIcon: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.17)', borderRadius: radii.pill, height: 32, justifyContent: 'center', width: 32 }, balanceEyebrow: { color: colors.textOnPrimary, fontFamily: typography.bodySemiBold, fontSize: 9, letterSpacing: 0.8 }, balanceAmount: { color: colors.textOnPrimary, fontSize: 40, letterSpacing: -1.35, lineHeight: 47, marginTop: 22 }, balanceFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 17 }, communityLabel: { alignItems: 'center', flexDirection: 'row', gap: 5 }, balanceMeta: { color: colors.textOnPrimary, fontSize: 10, opacity: 0.84 }, demoBadge: { backgroundColor: 'rgba(255,255,255,0.17)', borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 4 }, demoBadgeText: { color: colors.textOnPrimary, fontFamily: typography.bodyMedium, fontSize: 8, letterSpacing: 0.4 },
  verificationCard: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 15, flexDirection: 'row', gap: 11, marginTop: 12, padding: 12 }, verifiedIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 12, height: 34, justifyContent: 'center', width: 34 }, verificationCopy: { flex: 1 }, mutedCopy: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 9, marginTop: 13 }, primaryAction: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 15, flex: 1, flexDirection: 'row', gap: 8, height: 51, justifyContent: 'center' }, actionIcon: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: radii.pill, height: 26, justifyContent: 'center', width: 26 }, primaryActionText: { color: colors.textOnPrimary, fontSize: 12 }, secondaryAction: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, flex: 1, flexDirection: 'row', gap: 7, height: 51, justifyContent: 'center' }, secondaryActionText: { color: colors.text, fontSize: 11 }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] }, verifiedHint: { alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 10 }, verifiedHintText: { color: colors.textMuted, fontSize: 9 },
  formCard: { backgroundColor: colors.surfaceMuted, borderRadius: 14, marginTop: 12, padding: 14 }, amountChoices: { flexDirection: 'row', gap: 8, marginTop: 12 }, amountChoice: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, flex: 1, minHeight: 42, justifyContent: 'center' }, amountChoiceText: { color: colors.primaryDark, fontSize: 11 }, input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 10, borderWidth: 1, color: colors.text, fontFamily: typography.body, fontSize: 12, marginTop: 9, minHeight: 43, paddingHorizontal: 11 }, submitButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 10, justifyContent: 'center', marginTop: 10, minHeight: 42 },
  notice: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 10, flexDirection: 'row', gap: 8, marginTop: 11, padding: 11 }, noticeText: { color: colors.primaryDark, flex: 1, fontSize: 10, lineHeight: 15 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 27 }, sectionTitle: { fontSize: 20, letterSpacing: -0.5 }, sectionSubtitle: { color: colors.textMuted, fontSize: 10, marginTop: 2 }, sectionCount: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, height: 28, justifyContent: 'center', minWidth: 28, paddingHorizontal: 8 }, countLabel: { color: colors.textMuted, fontSize: 11 },
  monthlySummary: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 18, flexDirection: 'row', marginTop: 18, minHeight: 82, paddingHorizontal: 13 }, monthlyItem: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 8 }, monthlyIcon: { alignItems: 'center', borderRadius: radii.pill, height: 29, justifyContent: 'center', width: 29 }, monthlyLabel: { color: colors.textMuted, fontFamily: typography.bodySemiBold, fontSize: 7, letterSpacing: 0.42 }, monthlyAmount: { fontSize: 13, lineHeight: 17, marginTop: 2 }, monthlyDivider: { backgroundColor: colors.border, height: 34, marginHorizontal: 7, width: StyleSheet.hairlineWidth },
  featuredWrap: { marginTop: 29 }, featuredHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' }, featuredKicker: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.85 }, featuredHeading: { fontSize: 22, letterSpacing: -0.55, lineHeight: 28, marginTop: 3 }, liveBadge: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, flexDirection: 'row', gap: 5, marginTop: 4, paddingHorizontal: 9, paddingVertical: 6 }, liveDot: { backgroundColor: colors.primary, borderRadius: radii.pill, height: 6, width: 6 }, liveLabel: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.45 }, featuredCard: { backgroundColor: colors.warmSoft, borderColor: colors.border, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, marginTop: 12, padding: 15 }, featuredTop: { alignItems: 'flex-start', flexDirection: 'row' }, featuredGlyph: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 14, height: 42, justifyContent: 'center', width: 42 }, featuredCopy: { flex: 1, marginLeft: 10 }, featuredCategory: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.45 }, featuredTitle: { fontSize: 15, lineHeight: 20, marginTop: 2 }, featuredSummary: { color: colors.textMuted, fontSize: 10, lineHeight: 14, marginTop: 3 }, featuredPercent: { alignItems: 'flex-end', marginLeft: 7 }, percentValue: { color: colors.primaryDark, fontSize: 17, letterSpacing: -0.4, lineHeight: 20 }, percentLabel: { color: colors.textMuted, fontSize: 8, lineHeight: 10 }, progressTrack: { backgroundColor: colors.surface, borderRadius: radii.pill, height: 7, marginTop: 15, overflow: 'hidden' }, progressFill: { backgroundColor: colors.primary, borderRadius: radii.pill, height: '100%' }, featuredFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }, progressCopy: { color: colors.textMuted, fontSize: 9 }, featuredSupport: { alignItems: 'center', flexDirection: 'row', gap: 4 }, featuredSupportText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 9 },
  entry: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, minHeight: 68, paddingVertical: 9 }, entryLast: { borderBottomWidth: 0 }, entryIcon: { alignItems: 'center', borderRadius: radii.pill, height: 36, justifyContent: 'center', width: 36 }, incomeIcon: { backgroundColor: colors.primarySoft }, expenseIcon: { backgroundColor: colors.warmSoft }, entryCopy: { flex: 1, minWidth: 0 }, entryMeta: { color: colors.textMuted, fontSize: 9, lineHeight: 14, marginTop: 3 }, entryAmountColumn: { alignItems: 'flex-end', maxWidth: '33%' }, entryAmount: { fontSize: 11 }, incomeAmount: { color: colors.primaryDark }, entryType: { color: colors.textMuted, fontSize: 8, marginTop: 1 }, historyFilters: { flexDirection: 'row', gap: 7, marginTop: 13 }, historyFilter: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, height: 31, justifyContent: 'center', paddingHorizontal: 12 }, historyFilterActive: { backgroundColor: colors.primaryDark }, historyFilterText: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 10 }, historyFilterTextActive: { color: colors.textOnPrimary, fontFamily: typography.bodySemiBold }, historyCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, marginTop: 11, overflow: 'hidden', paddingHorizontal: 14 },
  proposal: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, marginTop: 11, padding: 14 }, proposalTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, proposalIdentity: { alignItems: 'center', flexDirection: 'row', gap: 9 }, proposalGlyph: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 12, height: 38, justifyContent: 'center', width: 38 }, proposalCategory: { gap: 4 }, proposalCategoryText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.35 }, proposalStatus: { alignItems: 'center', flexDirection: 'row', gap: 5 }, statusDot: { backgroundColor: colors.warning, borderRadius: radii.pill, height: 5, width: 5 }, proposalStatusText: { color: colors.textMuted, fontSize: 9 }, proposalAmount: { color: colors.text, fontSize: 15, letterSpacing: -0.2, marginTop: 3 }, proposalTitle: { fontSize: 16, letterSpacing: -0.3, lineHeight: 21, marginTop: 14 }, proposalSummary: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 4 }, proposalBudget: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 11, flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingHorizontal: 10, paddingVertical: 9 }, budgetLabel: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 8, letterSpacing: 0.35 }, proposalAuthor: { alignItems: 'center', flexDirection: 'row', gap: 7 }, authorAvatar: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, height: 29, justifyContent: 'center', width: 29 }, authorInitial: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 9 }, authorLabel: { color: colors.textMuted, fontSize: 8 }, authorName: { color: colors.text, fontFamily: typography.bodyMedium, fontSize: 9, marginTop: 1 }, initiativeProgress: { backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, height: 5, marginTop: 10, overflow: 'hidden' }, initiativeProgressFill: { backgroundColor: colors.primary, borderRadius: radii.pill, height: '100%' }, proposalDivider: { backgroundColor: colors.border, height: StyleSheet.hairlineWidth, marginTop: 12 }, proposalFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }, communitySupport: { color: colors.textMuted, fontSize: 9 }, raisedCopy: { color: colors.primaryDark, fontFamily: typography.bodyMedium, fontSize: 8, marginTop: 2 }, supportButton: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, flexDirection: 'row', gap: 5, minHeight: 32, paddingHorizontal: 11 }, supportButtonActive: { backgroundColor: colors.primaryDark }, supportButtonText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 9 }, supportButtonTextActive: { color: colors.textOnPrimary },
  modalOverlay: { backgroundColor: 'rgba(5, 9, 7, 0.44)', flex: 1, justifyContent: 'flex-end' }, modalDismissArea: { flex: 1 }, donationSheet: { backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxWidth: 720, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 10, width: '100%' }, sheetHandle: { alignSelf: 'center', backgroundColor: colors.border, borderRadius: radii.pill, height: 4, width: 38 }, sheetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }, sheetKicker: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.8 }, sheetTitle: { fontSize: 25, letterSpacing: -0.55, lineHeight: 31, marginTop: 2 }, sheetClose: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, height: 38, justifyContent: 'center', width: 38 }, amountField: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'center', marginTop: 20, paddingBottom: 10 }, currencyPrefix: { color: colors.text, fontSize: 33, lineHeight: 42, marginRight: 4 }, donationInput: { color: colors.text, fontFamily: typography.title, fontSize: 38, letterSpacing: -0.8, lineHeight: 45, minWidth: 92, padding: 0, textAlign: 'center' }, amountHelper: { color: colors.textMuted, fontSize: 10, marginTop: 7, textAlign: 'center' }, donationError: { color: colors.danger, fontSize: 10, marginTop: 7, textAlign: 'center' }, quickAmounts: { flexDirection: 'row', gap: 7, marginTop: 15 }, quickAmount: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 10, flex: 1, height: 35, justifyContent: 'center' }, quickAmountActive: { backgroundColor: colors.primarySoft, borderColor: colors.primaryDark, borderWidth: StyleSheet.hairlineWidth }, quickAmountText: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 9 }, quickAmountTextActive: { color: colors.primaryDark, fontFamily: typography.bodySemiBold }, paymentSectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 }, paymentLabel: { color: colors.textMuted, fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.7 }, paymentSecure: { color: colors.primaryDark, fontFamily: typography.bodyMedium, fontSize: 9 }, paymentSources: { gap: 8, marginTop: 10 }, paymentSource: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 57, paddingHorizontal: 11 }, paymentSourceSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primaryDark }, paymentSourceIcon: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 10, height: 34, justifyContent: 'center', width: 34 }, paymentSourceIconSelected: { backgroundColor: colors.surface }, paymentSourceCopy: { flex: 1, marginLeft: 10 }, paymentSourceTitle: { fontSize: 11, lineHeight: 15 }, paymentSourceDetail: { color: colors.textMuted, fontSize: 9, lineHeight: 12, marginTop: 1 }, radio: { alignItems: 'center', borderColor: colors.border, borderRadius: radii.pill, borderWidth: 1.5, height: 18, justifyContent: 'center', width: 18 }, radioSelected: { borderColor: colors.primaryDark }, radioDot: { backgroundColor: colors.primaryDark, borderRadius: radii.pill, height: 8, width: 8 }, donateButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 14, flexDirection: 'row', gap: 7, height: 52, justifyContent: 'center', marginTop: 20 }, donateButtonText: { color: colors.textOnPrimary, fontSize: 12 },
  receiptOverlay: { alignItems: 'center', backgroundColor: 'rgba(5, 9, 7, 0.44)', flex: 1, justifyContent: 'center', padding: 24 }, receiptCard: { alignItems: 'center', backgroundColor: colors.background, borderRadius: 24, maxWidth: 390, padding: 24, width: '100%' }, receiptSuccess: { alignItems: 'center', backgroundColor: colors.primaryDark, borderColor: colors.primarySoft, borderRadius: radii.pill, borderWidth: 7, height: 68, justifyContent: 'center', width: 68 }, receiptTitle: { fontSize: 24, letterSpacing: -0.55, lineHeight: 30, marginTop: 15 }, receiptSubhead: { color: colors.textMuted, fontSize: 11, marginTop: 4 }, receiptAmount: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 16, marginTop: 20, paddingVertical: 14, width: '100%' }, receiptAmountLabel: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.65 }, receiptAmountValue: { color: colors.primaryDark, fontSize: 29, letterSpacing: -0.65, lineHeight: 35, marginTop: 2 }, receiptDetails: { marginTop: 17, width: '100%' }, receiptLine: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 34 }, receiptKey: { color: colors.textMuted, fontSize: 10 }, receiptValue: { color: colors.text, fontFamily: typography.bodyMedium, fontSize: 10, maxWidth: '65%', textAlign: 'right' }, receiptComplete: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 10 }, receiptButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 13, height: 48, justifyContent: 'center', marginTop: 20, width: '100%' }, receiptButtonText: { color: colors.textOnPrimary, fontSize: 12 },
  donationPage: { backgroundColor: colors.background, flex: 1 }, donationSheetFullscreen: { alignSelf: 'center', backgroundColor: colors.background, borderRadius: 0, flex: 1, maxWidth: 720, paddingBottom: 16, paddingHorizontal: 16, paddingTop: 6, width: '100%' }, sheetHeaderFullscreen: { height: 50, marginTop: 0 }, sheetBack: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, height: 38, justifyContent: 'center', width: 38 }, targetSection: { marginTop: 16 }, targetLabel: { color: colors.textMuted, fontFamily: typography.bodySemiBold, fontSize: 9, letterSpacing: 0.72 }, fundTarget: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderBottomWidth: 0, borderRadius: 14, flexDirection: 'row', marginTop: 8, minHeight: 64, paddingHorizontal: 12, paddingVertical: 10 }, fundTargetIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, height: 42, justifyContent: 'center', width: 42 }, fundTargetCopy: { flex: 1, marginLeft: 11 }, fundTargetTitle: { fontSize: 14, lineHeight: 18 }, fundTargetDetail: { color: colors.textMuted, fontSize: 10, marginTop: 2 }, targetCheck: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.pill, height: 28, justifyContent: 'center', width: 28 }, amountFieldReference: { borderBottomWidth: 0, marginTop: 38, paddingBottom: 0 }, donationInputReference: { fontSize: 58, lineHeight: 66, minWidth: 145 }, amountHelperReference: { fontSize: 11, marginTop: 2 }, quickAmountsReference: { gap: 8, marginTop: 17 }, quickAmountReference: { backgroundColor: colors.surfaceMuted, borderRadius: 8, height: 38 }, quickAmountTextReference: { fontSize: 10 }, paymentSectionHeaderReference: { marginTop: 28 }, paymentSourceReference: { backgroundColor: colors.surfaceMuted, borderColor: colors.border, borderRadius: 14, minHeight: 66, paddingHorizontal: 13 }, paymentSourceIconReference: { backgroundColor: colors.surface, height: 40, width: 40 }, paymentSourceTitleReference: { fontSize: 13, lineHeight: 17 }, paymentSourceDetailReference: { fontSize: 10, lineHeight: 14, marginTop: 2 }, changeSource: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.pill, flexDirection: 'row', gap: 1, paddingHorizontal: 8, paddingVertical: 6 }, changeSourceText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 10 }, donateButtonReference: { borderRadius: 14, height: 56, marginTop: 'auto' }, donateButtonTextReference: { fontSize: 13 },
  footerNote: { alignItems: 'flex-start', flexDirection: 'row', gap: 7, marginBottom: spacing.xl, marginTop: 19 }, footerText: { color: colors.textMuted, flex: 1, fontSize: 9, lineHeight: 14 },
}));
