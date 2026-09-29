import Feather from '@/components/ui/AppIcon';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/ui/AppText';
import { useProfile } from '@/context/ProfileContext';
import { useThemeColors } from '@/context/AppearanceContext';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';
import { useRouter } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
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
const confettiPieces = [
  { color: '#FFFFFF', drift: -24, left: '8%', rotate: 480 },
  { color: '#FFB340', drift: 16, left: '16%', rotate: -420 },
  { color: '#34C759', drift: -12, left: '25%', rotate: 540 },
  { color: '#FFFFFF', drift: 28, left: '34%', rotate: -510 },
  { color: '#78A8FF', drift: -18, left: '43%', rotate: 430 },
  { color: '#FFB340', drift: 22, left: '52%', rotate: -560 },
  { color: '#FFFFFF', drift: -27, left: '61%', rotate: 500 },
  { color: '#34C759', drift: 15, left: '70%', rotate: -450 },
  { color: '#78A8FF', drift: -15, left: '79%', rotate: 520 },
  { color: '#FFFFFF', drift: 25, left: '89%', rotate: -490 },
] as const;

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

function ConfettiPiece({ active, index }: { active: boolean; index: number }) {
  const progress = useSharedValue(0);
  const piece = confettiPieces[index];

  useEffect(() => {
    progress.set(0);
    if (active) progress.set(withDelay(index * 55, withTiming(1, { duration: 1250 + (index % 3) * 170 })));
  }, [active, index, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const value = progress.get();
    return {
      opacity: active ? 1 - Math.max(0, (value - 0.76) / 0.24) : 0,
      transform: [
        { translateX: value * piece.drift },
        { translateY: value * 310 },
        { rotate: `${value * piece.rotate}deg` },
      ],
    };
  });

  return <Animated.View style={[confettiStyles.piece, { backgroundColor: piece.color, left: piece.left }, animatedStyle]} />;
}

const confettiStyles = StyleSheet.create({
  piece: { borderRadius: 2, height: 10, position: 'absolute', top: -12, width: 6 },
});

export default function CommunityWalletScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useStyles();
  const { profile } = useProfile();
  const [entries, setEntries] = useState(initialEntries);
  const [proposals, setProposals] = useState(initialProposals);
  const [supportedProposals, setSupportedProposals] = useState<string[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<(typeof initialProposals)[number] | null>(null);
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
      <View>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Volver" hitSlop={10} onPress={() => router.back()} style={styles.backButton}><Feather color={colors.text} name="arrow-left" size={20} /></Pressable>
        <View style={styles.titleBlock}><AppText style={styles.topTitle} variant="bodyStrong">Fondo común</AppText><View style={styles.headerLocation}><Feather color={colors.primaryDark} name="map-pin" size={10} /><AppText style={styles.headerLocationText} variant="caption">{neighborhood}</AppText></View></View>
        <View style={styles.topIcon}><Feather color={colors.text} name="more-horizontal" size={18} /></View>
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.balanceTop}><View><AppText style={styles.balanceEyebrow} variant="caption">FONDO COMUNITARIO</AppText><AppText style={styles.balanceNeighborhood} variant="caption">{neighborhood}</AppText></View><View style={styles.balanceStatus}><View style={styles.balanceStatusDot} /><AppText style={styles.balanceStatusText} variant="caption">Activo</AppText></View></View>
        <AppText style={styles.balanceAmount} variant="heading">{formatCLP(balance)}</AppText>
        <View style={styles.balanceFooter}><AppText style={styles.balanceMeta} variant="caption">Saldo disponible</AppText><AppText style={styles.balanceMembers} variant="caption">36 vecinos</AppText></View>
      </View>

      <View style={styles.actionStrip}>
        <Pressable accessibilityRole="button" onPress={openDonation} style={[styles.iconAction, styles.iconActionDivider]}><View style={styles.iconActionCircle}><Feather color="#FFFFFF" name="plus-circle" size={25} /></View><AppText numberOfLines={2} style={styles.iconActionLabel} variant="caption">Aportar</AppText></Pressable>
        <Pressable accessibilityRole="button" onPress={() => { setNotice(''); setShowProposal((value) => !value); setShowDonate(false); }} style={[styles.iconAction, styles.iconActionDivider]}><View style={styles.iconActionCircle}><Feather color="#FFFFFF" name="edit-3" size={24} /></View><AppText numberOfLines={2} style={styles.iconActionLabel} variant="caption">Crear iniciativa</AppText></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setHistoryFilter('Todo')} style={[styles.iconAction, styles.iconActionDivider]}><View style={styles.iconActionCircle}><Feather color="#FFFFFF" name="clock" size={25} /></View><AppText numberOfLines={2} style={styles.iconActionLabel} variant="caption">Movimientos</AppText></Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/community-wallet-analytics')} style={styles.iconAction}><View style={styles.iconActionCircle}><Feather color="#FFFFFF" name="bar-chart-2" size={25} /></View><AppText numberOfLines={2} style={styles.iconActionLabel} variant="caption">Estadísticas</AppText></Pressable>
      </View>

      {showProposal ? <View style={styles.formCard}><AppText variant="bodyStrong">Nueva propuesta de gasto</AppText><TextInput onChangeText={setProposalTitle} placeholder="¿Qué necesita el barrio?" placeholderTextColor={colors.textMuted} style={styles.input} value={proposalTitle} /><TextInput keyboardType="numeric" onChangeText={setProposalAmount} placeholder="Monto estimado en CLP" placeholderTextColor={colors.textMuted} style={styles.input} value={proposalAmount} /><Pressable onPress={submitProposal} style={styles.submitButton}><AppText style={styles.primaryActionText} variant="bodyStrong">Publicar propuesta</AppText></Pressable></View> : null}

      {notice ? <View style={styles.notice}><Feather color={colors.primaryDark} name="check-circle" size={15} /><AppText style={styles.noticeText} variant="caption">{notice}</AppText></View> : null}

      {proposals[0] ? <View style={styles.featuredWrap}>
        <View style={styles.featuredHeader}><View><AppText style={styles.featuredKicker} variant="caption">SELECCIÓN DE LA COMUNIDAD</AppText><AppText style={styles.featuredHeading} variant="heading">Iniciativa destacada</AppText></View></View>
        <Pressable accessibilityRole="button" onPress={() => setSelectedProposal(proposals[0])} style={[styles.featuredCard, styles.featuredCardRedesign]}>
          <View style={styles.featuredTopLine}><View style={styles.featuredTag}><AppText style={styles.featuredTagText} variant="caption">DESTACADA</AppText></View><Feather color={colors.primaryDark} name="arrow-up-right" size={18} /></View>
          <AppText style={[styles.featuredTitle, styles.featuredTitleRedesign]} variant="bodyStrong">{proposals[0].description}</AppText>
          <AppText style={[styles.featuredSummary, styles.featuredSummaryRedesign]} variant="caption">{proposals[0].summary}</AppText>
          <View style={[styles.featuredFooter, styles.featuredFooterRedesign]}><View><AppText style={styles.featuredMetaLabel} variant="caption">PRESUPUESTO ESTIMADO</AppText><AppText style={styles.featuredBudget} variant="bodyStrong">{formatCLP(proposals[0].amount)}</AppText></View><View style={styles.featuredSupport}><Feather color={colors.primaryDark} name="users" size={14} /><AppText style={styles.featuredSupportText} variant="caption">{proposals[0].votes + (supportedProposals.includes(proposals[0].id) ? 1 : 0)} apoyos</AppText></View></View>
        </Pressable>
      </View> : null}

      <View style={styles.sectionHeader}><View><AppText style={styles.sectionTitle} variant="heading">Iniciativas del barrio</AppText><AppText style={styles.sectionSubtitle} variant="caption">Propuestas abiertas a la comunidad</AppText></View><View style={styles.sectionCount}><AppText style={styles.countLabel} variant="caption">{proposals.length}</AppText></View></View>
      {proposals.slice(1).map((proposal) => {
        const isSupported = supportedProposals.includes(proposal.id);
        return (
          <Pressable accessibilityRole="button" key={proposal.id} onPress={() => setSelectedProposal(proposal)} style={[styles.proposal, styles.proposalRedesign]}>
            <View style={styles.proposalTop}>
              <View style={styles.proposalCategory}><AppText style={styles.proposalCategoryText} variant="caption">{proposal.category}</AppText><View style={styles.proposalStatus}><View style={styles.statusDot} /><AppText style={styles.proposalStatusText} variant="caption">En evaluación</AppText></View></View>
              <Feather color={colors.textMuted} name="chevron-right" size={18} />
            </View>
            <AppText style={styles.proposalTitle} variant="bodyStrong">{proposal.description}</AppText>
            <AppText style={styles.proposalSummary} variant="caption">{proposal.summary}</AppText>
            <View style={styles.proposalBudget}><View><AppText style={styles.budgetLabel} variant="caption">PRESUPUESTO ESTIMADO</AppText><AppText style={styles.proposalAmount} variant="bodyStrong">{formatCLP(proposal.amount)}</AppText></View><View style={styles.proposalSupportMetric}><AppText style={styles.proposalSupportValue} variant="bodyStrong">{proposal.votes + (isSupported ? 1 : 0)}</AppText><AppText style={styles.proposalSupportLabel} variant="caption">APOYOS</AppText></View></View>
            <View style={styles.proposalDivider} />
            <View style={styles.proposalFooter}><AppText style={styles.proposalOpenHint} variant="caption">Toca para ver la propuesta completa</AppText><WalletPressable accessibilityRole="button" accessibilityState={{ selected: isSupported }} onPress={(event) => { event.stopPropagation(); setSupportedProposals((current) => isSupported ? current.filter((id) => id !== proposal.id) : [...current, proposal.id]); }} style={[styles.supportButton, isSupported && styles.supportButtonActive]}><Feather color={isSupported ? colors.textOnPrimary : colors.primaryDark} name={isSupported ? 'check' : 'thumbs-up'} size={13} /><AppText style={[styles.supportButtonText, isSupported && styles.supportButtonTextActive]} variant="caption">{isSupported ? 'Apoyando' : 'Apoyar'}</AppText></WalletPressable></View>
          </Pressable>
        );
      })}

      <View style={styles.sectionHeader}><View><AppText style={styles.sectionTitle} variant="heading">Historial</AppText><AppText style={styles.sectionSubtitle} variant="caption">Aportes y gastos del fondo</AppText></View><Feather color={colors.textMuted} name="clock" size={17} /></View>
      <View style={styles.historyFilters}>{(['Todo', 'Aportes', 'Gastos'] as const).map((filter) => <WalletPressable key={filter} accessibilityRole="button" accessibilityState={{ selected: historyFilter === filter }} onPress={() => setHistoryFilter(filter)} style={[styles.historyFilter, historyFilter === filter && styles.historyFilterActive]}><AppText style={[styles.historyFilterText, historyFilter === filter && styles.historyFilterTextActive]} variant="caption">{filter}</AppText></WalletPressable>)}</View>
      <View style={styles.historyCard}>{visibleEntries.map((entry, index) => <View key={`${entry.title}-${entry.date}-${index}`} style={[styles.entry, index === visibleEntries.length - 1 && styles.entryLast]}><View style={[styles.entryIcon, entry.type === 'Aporte' ? styles.incomeIcon : styles.expenseIcon]}><Feather color={entry.type === 'Aporte' ? colors.primaryDark : colors.textMuted} name={entry.icon} size={16} /></View><View style={styles.entryCopy}><AppText numberOfLines={1} variant="bodyStrong">{entry.title}</AppText><AppText numberOfLines={1} style={styles.entryMeta} variant="caption">{entry.date} · {entry.detail}</AppText></View><View style={styles.entryAmountColumn}><AppText style={[styles.entryAmount, entry.type === 'Aporte' && styles.incomeAmount]} variant="bodyStrong">{entry.type === 'Aporte' ? '+' : '−'}{formatCLP(entry.amount)}</AppText><AppText style={styles.entryType} variant="caption">{entry.type}</AppText></View></View>)}</View>

      <View style={styles.footerNote}><Feather color={colors.textMuted} name="info" size={14} /><AppText style={styles.footerText} variant="caption">Prototipo visual. Aportes, propuestas y saldos son datos de ejemplo; los controles de verificación y pagos aún no están conectados.</AppText></View>
      </View>
      <Modal animationType="fade" onRequestClose={() => setSelectedProposal(null)} transparent visible={selectedProposal !== null}>
        <View style={styles.detailOverlay}>
          <Pressable accessibilityLabel="Cerrar detalle" onPress={() => setSelectedProposal(null)} style={styles.detailDismiss} />
          {selectedProposal ? <View style={styles.detailCard}>
            <View style={styles.detailHeader}><View style={styles.detailStatus}><View style={styles.statusDot} /><AppText style={styles.detailStatusText} variant="caption">EN EVALUACIÓN</AppText></View><Pressable accessibilityLabel="Cerrar" hitSlop={10} onPress={() => setSelectedProposal(null)} style={styles.detailClose}><Feather color={colors.text} name="x" size={19} /></Pressable></View>
            <AppText style={styles.detailCategory} variant="caption">{selectedProposal.category}</AppText>
            <AppText style={styles.detailTitle} variant="heading">{selectedProposal.description}</AppText>
            <AppText style={styles.detailSummary} variant="caption">{selectedProposal.summary}</AppText>
            <View style={styles.detailFacts}>
              <View style={styles.detailFact}><AppText style={styles.detailFactLabel} variant="caption">PRESUPUESTO ESTIMADO</AppText><AppText style={styles.detailFactValue} variant="bodyStrong">{formatCLP(selectedProposal.amount)}</AppText></View>
              <View style={styles.detailFactDivider} />
              <View style={styles.detailFact}><AppText style={styles.detailFactLabel} variant="caption">APOYOS</AppText><AppText style={styles.detailFactValue} variant="bodyStrong">{selectedProposal.votes + (supportedProposals.includes(selectedProposal.id) ? 1 : 0)} vecinos</AppText></View>
            </View>
            <View style={styles.detailAuthor}><View><AppText style={styles.detailAuthorLabel} variant="caption">PROPUESTA POR</AppText><AppText style={styles.detailAuthorName} variant="bodyStrong">{selectedProposal.by}</AppText></View><AppText style={styles.detailCommunity} variant="caption">Comunidad de {neighborhood}</AppText></View>
            <Pressable onPress={() => setSupportedProposals((current) => current.includes(selectedProposal.id) ? current.filter((id) => id !== selectedProposal.id) : [...current, selectedProposal.id])} style={[styles.detailSupportButton, supportedProposals.includes(selectedProposal.id) && styles.detailSupportButtonActive]}><AppText style={[styles.detailSupportText, supportedProposals.includes(selectedProposal.id) && styles.detailSupportTextActive]} variant="bodyStrong">{supportedProposals.includes(selectedProposal.id) ? 'Quitar mi apoyo' : 'Apoyar esta iniciativa'}</AppText></Pressable>
          </View> : null}
        </View>
      </Modal>
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
      <Modal animationType="fade" onRequestClose={() => setShowReceipt(false)} visible={showReceipt}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.receiptScreen}>
          <View pointerEvents="none" style={styles.confettiLayer}>{confettiPieces.map((_, index) => <ConfettiPiece active={showReceipt} index={index} key={index} />)}</View>
          <View style={styles.receiptHeader}><Pressable accessibilityLabel="Cerrar comprobante" hitSlop={10} onPress={() => setShowReceipt(false)} style={styles.receiptHeaderButton}><Feather color="#FFFFFF" name="x" size={20} /></Pressable><AppText style={styles.receiptHeaderTitle} variant="bodyStrong">Comprobante de aporte</AppText><View style={styles.receiptHeaderButton} /></View>
          <View style={styles.receiptCard}>
            <View style={styles.receiptSuccess}><Feather color="#FFFFFF" name="check" size={30} /></View>
            <AppText style={styles.receiptTitle} variant="heading">Aporte realizado</AppText>
            <AppText style={styles.receiptSubhead} variant="caption">Tu aporte al fondo de {neighborhood} fue registrado correctamente.</AppText>
            <AppText style={styles.receiptAmountLabel} variant="caption">MONTO TOTAL</AppText>
            <AppText style={styles.receiptAmountValue} variant="heading">{formatCLP(lastDonation.amount)}</AppText>
            <View style={styles.receiptPerforation} />
            <AppText style={styles.receiptSectionLabel} variant="caption">DETALLE DEL APORTE</AppText>
            <View style={styles.receiptDestination}><View style={styles.receiptDestinationMark}><AppText style={styles.receiptDestinationInitial} variant="bodyStrong">P</AppText></View><View style={styles.receiptDestinationCopy}><AppText style={styles.receiptDestinationTitle} variant="bodyStrong">Fondo de {neighborhood}</AppText><AppText style={styles.receiptDestinationMeta} variant="caption">{lastDonation.source}</AppText></View><View style={styles.receiptVerified}><Feather color={colors.primaryDark} name="check" size={13} /></View></View>
            <View style={styles.receiptMetaRow}><AppText style={styles.receiptKey} variant="caption">Fecha</AppText><AppText style={styles.receiptValue} variant="caption">Hoy</AppText></View>
            <View style={styles.receiptMetaRow}><AppText style={styles.receiptKey} variant="caption">Estado</AppText><AppText style={styles.receiptComplete} variant="caption">Completado</AppText></View>
            <Pressable accessibilityRole="button" onPress={() => { setShowReceipt(false); setNotice(`Tu aporte de ${formatCLP(lastDonation.amount)} ya aparece en el historial.`); }} style={styles.receiptButton}><AppText style={styles.receiptButtonText} variant="bodyStrong">Listo</AppText></Pressable>
            <Pressable accessibilityRole="button" onPress={() => { setShowReceipt(false); openDonation(); }} style={styles.receiptAgain}><AppText style={styles.receiptAgainText} variant="bodyStrong">Aportar de nuevo</AppText></Pressable>
            <View pointerEvents="none" style={styles.receiptNotches}>{Array.from({ length: 18 }).map((_, index) => <View key={index} style={styles.receiptNotch} />)}</View>
          </View>
          <View style={styles.receiptSecure}><Feather color="rgba(255,255,255,0.72)" name="shield" size={13} /><AppText style={styles.receiptSecureText} variant="caption">Comprobante generado por Tribus</AppText></View>
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }, backButton: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, height: 42, justifyContent: 'center', width: 42 }, titleBlock: { alignItems: 'center' }, topTitle: { fontSize: 16, letterSpacing: -0.25 }, headerLocation: { alignItems: 'center', flexDirection: 'row', gap: 3, marginTop: 2 }, headerLocationText: { color: colors.textMuted, fontSize: 9, lineHeight: 12 }, topIcon: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, height: 42, justifyContent: 'center', width: 42 },
  intro: { marginTop: 23 }, eyebrow: { color: colors.primaryDark, fontSize: 9, letterSpacing: 1 }, heading: { fontSize: 29, letterSpacing: -0.9, lineHeight: 34, marginTop: 4 }, subheading: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  neighborhoodLabel: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 19 }, neighborhoodCaption: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 10 }, neighborhoodName: { color: colors.text, fontSize: 12, marginLeft: 2 },
  balanceCard: { backgroundColor: colors.primaryDark, borderRadius: 24, minHeight: 190, padding: 20 }, balanceTop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' }, balanceEyebrow: { color: '#FFFFFF', fontFamily: typography.bodySemiBold, fontSize: 9, letterSpacing: 0.75 }, balanceNeighborhood: { color: 'rgba(255,255,255,0.68)', fontSize: 9, marginTop: 4 }, balanceStatus: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: radii.pill, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 6 }, balanceStatusDot: { backgroundColor: '#FFFFFF', borderRadius: radii.pill, height: 6, width: 6 }, balanceStatusText: { color: '#FFFFFF', fontFamily: typography.bodyMedium, fontSize: 8 }, balanceAmount: { color: '#FFFFFF', fontSize: 43, letterSpacing: -1.55, lineHeight: 50, marginTop: 31 }, balanceFooter: { alignItems: 'center', borderTopColor: 'rgba(255,255,255,0.15)', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, paddingTop: 13 }, balanceMeta: { color: 'rgba(255,255,255,0.72)', fontSize: 9 }, balanceMembers: { color: '#FFFFFF', fontFamily: typography.bodyMedium, fontSize: 9 },
  verificationCard: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 15, flexDirection: 'row', gap: 11, marginTop: 12, padding: 12 }, verifiedIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 12, height: 34, justifyContent: 'center', width: 34 }, verificationCopy: { flex: 1 }, mutedCopy: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 2 },
  actionStrip: { backgroundColor: colors.primary, borderRadius: 24, flexDirection: 'row', marginTop: 17, minHeight: 112, overflow: 'hidden', paddingVertical: 13 }, iconAction: { alignItems: 'center', flex: 1, justifyContent: 'center', minWidth: 0, paddingHorizontal: 4 }, iconActionDivider: { borderRightColor: 'rgba(255,255,255,0.22)', borderRightWidth: StyleSheet.hairlineWidth }, iconActionCircle: { alignItems: 'center', height: 36, justifyContent: 'center' }, iconActionLabel: { color: '#FFFFFF', fontFamily: typography.bodyMedium, fontSize: 9, lineHeight: 12, marginTop: 8, minHeight: 24, textAlign: 'center' }, primaryActionText: { color: colors.textOnPrimary, fontSize: 12 },
  formCard: { backgroundColor: colors.surfaceMuted, borderRadius: 14, marginTop: 12, padding: 14 }, amountChoices: { flexDirection: 'row', gap: 8, marginTop: 12 }, amountChoice: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, flex: 1, minHeight: 42, justifyContent: 'center' }, amountChoiceText: { color: colors.primaryDark, fontSize: 11 }, input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 10, borderWidth: 1, color: colors.text, fontFamily: typography.body, fontSize: 12, marginTop: 9, minHeight: 43, paddingHorizontal: 11 }, submitButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 10, justifyContent: 'center', marginTop: 10, minHeight: 42 },
  notice: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 10, flexDirection: 'row', gap: 8, marginTop: 11, padding: 11 }, noticeText: { color: colors.primaryDark, flex: 1, fontSize: 10, lineHeight: 15 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 27 }, sectionTitle: { fontSize: 20, letterSpacing: -0.5 }, sectionSubtitle: { color: colors.textMuted, fontSize: 10, marginTop: 2 }, sectionCount: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, height: 28, justifyContent: 'center', minWidth: 28, paddingHorizontal: 8 }, countLabel: { color: colors.textMuted, fontSize: 11 },
  featuredWrap: { marginTop: 29 }, featuredHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' }, featuredKicker: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.85 }, featuredHeading: { fontSize: 22, letterSpacing: -0.55, lineHeight: 28, marginTop: 3 }, featuredCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, marginTop: 12, padding: 15 }, featuredTitle: { fontSize: 15, lineHeight: 20, marginTop: 2 }, featuredSummary: { color: colors.textMuted, fontSize: 10, lineHeight: 14, marginTop: 3 }, featuredFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }, featuredSupport: { alignItems: 'center', flexDirection: 'row', gap: 4 }, featuredSupportText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 9 },
  entry: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, minHeight: 68, paddingVertical: 9 }, entryLast: { borderBottomWidth: 0 }, entryIcon: { alignItems: 'center', borderRadius: radii.pill, height: 36, justifyContent: 'center', width: 36 }, incomeIcon: { backgroundColor: colors.primarySoft }, expenseIcon: { backgroundColor: colors.warmSoft }, entryCopy: { flex: 1, minWidth: 0 }, entryMeta: { color: colors.textMuted, fontSize: 9, lineHeight: 14, marginTop: 3 }, entryAmountColumn: { alignItems: 'flex-end', maxWidth: '33%' }, entryAmount: { fontSize: 11 }, incomeAmount: { color: colors.primaryDark }, entryType: { color: colors.textMuted, fontSize: 8, marginTop: 1 }, historyFilters: { flexDirection: 'row', gap: 7, marginTop: 13 }, historyFilter: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, height: 31, justifyContent: 'center', paddingHorizontal: 12 }, historyFilterActive: { backgroundColor: colors.primaryDark }, historyFilterText: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 10 }, historyFilterTextActive: { color: colors.textOnPrimary, fontFamily: typography.bodySemiBold }, historyCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, marginTop: 11, overflow: 'hidden', paddingHorizontal: 14 },
  proposal: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, marginTop: 11, padding: 14 }, proposalTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, proposalCategory: { gap: 4 }, proposalCategoryText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.35 }, proposalStatus: { alignItems: 'center', flexDirection: 'row', gap: 5 }, statusDot: { backgroundColor: colors.warning, borderRadius: radii.pill, height: 5, width: 5 }, proposalStatusText: { color: colors.textMuted, fontSize: 9 }, proposalAmount: { color: colors.text, fontSize: 15, letterSpacing: -0.2, marginTop: 3 }, proposalTitle: { fontSize: 16, letterSpacing: -0.3, lineHeight: 21, marginTop: 14 }, proposalSummary: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 4 }, proposalBudget: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 11, flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingHorizontal: 10, paddingVertical: 9 }, budgetLabel: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 8, letterSpacing: 0.35 }, proposalDivider: { backgroundColor: colors.border, height: StyleSheet.hairlineWidth, marginTop: 12 }, proposalFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }, supportButton: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, flexDirection: 'row', gap: 5, minHeight: 32, paddingHorizontal: 11 }, supportButtonActive: { backgroundColor: colors.primaryDark }, supportButtonText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 9 }, supportButtonTextActive: { color: colors.textOnPrimary },
  featuredCardRedesign: { backgroundColor: colors.primarySoft, borderColor: colors.border, elevation: 2, padding: 17, shadowColor: colors.shadow, shadowOffset: { height: 5, width: 0 }, shadowOpacity: 0.09, shadowRadius: 14 }, featuredTopLine: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, featuredTag: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 5 }, featuredTagText: { color: '#FFFFFF', fontFamily: typography.bodySemiBold, fontSize: 7, letterSpacing: 0.55 }, featuredTitleRedesign: { fontSize: 19, lineHeight: 24, marginTop: 18 }, featuredSummaryRedesign: { fontSize: 11, lineHeight: 16, marginTop: 6 }, featuredFooterRedesign: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 18, paddingTop: 13 }, featuredMetaLabel: { color: colors.textMuted, fontFamily: typography.bodySemiBold, fontSize: 7, letterSpacing: 0.5 }, featuredBudget: { color: colors.text, fontSize: 15, marginTop: 2 }, proposalRedesign: { elevation: 1, padding: 16, shadowColor: colors.shadow, shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.05, shadowRadius: 10 }, proposalSupportMetric: { alignItems: 'flex-end' }, proposalSupportValue: { color: colors.primaryDark, fontSize: 17 }, proposalSupportLabel: { color: colors.textMuted, fontFamily: typography.bodySemiBold, fontSize: 7, letterSpacing: 0.5, marginTop: 1 }, proposalOpenHint: { color: colors.textMuted, flex: 1, fontSize: 8 },
  detailOverlay: { backgroundColor: 'rgba(5,9,7,0.5)', flex: 1, justifyContent: 'flex-end' }, detailDismiss: { flex: 1 }, detailCard: { backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 30, paddingHorizontal: 20, paddingTop: 15 }, detailHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, detailStatus: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 7 }, detailStatusText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.5 }, detailClose: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 40 }, detailCategory: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 9, letterSpacing: 0.55, marginTop: 22, textTransform: 'uppercase' }, detailTitle: { fontSize: 27, lineHeight: 33, marginTop: 5 }, detailSummary: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 9 }, detailFacts: { backgroundColor: colors.surfaceMuted, borderRadius: 17, flexDirection: 'row', marginTop: 22, paddingVertical: 14 }, detailFact: { flex: 1, paddingHorizontal: 14 }, detailFactDivider: { backgroundColor: colors.border, width: StyleSheet.hairlineWidth }, detailFactLabel: { color: colors.textMuted, fontFamily: typography.bodySemiBold, fontSize: 7, letterSpacing: 0.5 }, detailFactValue: { fontSize: 14, marginTop: 4 }, detailAuthor: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, paddingVertical: 14 }, detailAuthorLabel: { color: colors.textMuted, fontFamily: typography.bodySemiBold, fontSize: 7, letterSpacing: 0.5 }, detailAuthorName: { fontSize: 11, marginTop: 2 }, detailCommunity: { color: colors.textMuted, fontSize: 9 }, detailSupportButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 14, height: 52, justifyContent: 'center', marginTop: 20 }, detailSupportButtonActive: { backgroundColor: colors.primarySoft, borderColor: colors.primaryDark, borderWidth: StyleSheet.hairlineWidth }, detailSupportText: { color: '#FFFFFF', fontSize: 12 }, detailSupportTextActive: { color: colors.primaryDark },
  modalOverlay: { backgroundColor: 'rgba(5, 9, 7, 0.44)', flex: 1, justifyContent: 'flex-end' }, modalDismissArea: { flex: 1 }, donationSheet: { backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxWidth: 720, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 10, width: '100%' }, sheetHandle: { alignSelf: 'center', backgroundColor: colors.border, borderRadius: radii.pill, height: 4, width: 38 }, sheetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }, sheetKicker: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.8 }, sheetTitle: { fontSize: 25, letterSpacing: -0.55, lineHeight: 31, marginTop: 2 }, sheetClose: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, height: 38, justifyContent: 'center', width: 38 }, amountField: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'center', marginTop: 20, paddingBottom: 10 }, currencyPrefix: { color: colors.text, fontSize: 33, lineHeight: 42, marginRight: 4 }, donationInput: { color: colors.text, fontFamily: typography.title, fontSize: 38, letterSpacing: -0.8, lineHeight: 45, minWidth: 92, padding: 0, textAlign: 'center' }, amountHelper: { color: colors.textMuted, fontSize: 10, marginTop: 7, textAlign: 'center' }, donationError: { color: colors.danger, fontSize: 10, marginTop: 7, textAlign: 'center' }, quickAmounts: { flexDirection: 'row', gap: 7, marginTop: 15 }, quickAmount: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 10, flex: 1, height: 35, justifyContent: 'center' }, quickAmountActive: { backgroundColor: colors.primarySoft, borderColor: colors.primaryDark, borderWidth: StyleSheet.hairlineWidth }, quickAmountText: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 9 }, quickAmountTextActive: { color: colors.primaryDark, fontFamily: typography.bodySemiBold }, paymentSectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 }, paymentLabel: { color: colors.textMuted, fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.7 }, paymentSecure: { color: colors.primaryDark, fontFamily: typography.bodyMedium, fontSize: 9 }, paymentSources: { gap: 8, marginTop: 10 }, paymentSource: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 57, paddingHorizontal: 11 }, paymentSourceSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primaryDark }, paymentSourceIcon: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 10, height: 34, justifyContent: 'center', width: 34 }, paymentSourceIconSelected: { backgroundColor: colors.surface }, paymentSourceCopy: { flex: 1, marginLeft: 10 }, paymentSourceTitle: { fontSize: 11, lineHeight: 15 }, paymentSourceDetail: { color: colors.textMuted, fontSize: 9, lineHeight: 12, marginTop: 1 }, radio: { alignItems: 'center', borderColor: colors.border, borderRadius: radii.pill, borderWidth: 1.5, height: 18, justifyContent: 'center', width: 18 }, radioSelected: { borderColor: colors.primaryDark }, radioDot: { backgroundColor: colors.primaryDark, borderRadius: radii.pill, height: 8, justifyContent: 'center', width: 8 }, donateButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 14, flexDirection: 'row', gap: 7, height: 52, justifyContent: 'center', marginTop: 20 }, donateButtonText: { color: colors.textOnPrimary, fontSize: 12 },
  receiptScreen: { alignItems: 'center', backgroundColor: colors.primaryDark, flex: 1, paddingHorizontal: 14 }, confettiLayer: { height: 330, left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 0, zIndex: 3 }, receiptHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', maxWidth: 460, minHeight: 56, width: '100%', zIndex: 1 }, receiptHeaderButton: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 }, receiptHeaderTitle: { color: '#FFFFFF', fontSize: 15 }, receiptCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 22, marginTop: 8, maxWidth: 460, paddingBottom: 26, paddingHorizontal: 18, paddingTop: 23, width: '100%', zIndex: 1 }, receiptSuccess: { alignItems: 'center', backgroundColor: colors.primary, borderColor: colors.primaryDark, borderRadius: 24, borderWidth: 5, height: 64, justifyContent: 'center', transform: [{ rotate: '8deg' }], width: 64 }, receiptTitle: { color: '#17171F', fontSize: 24, letterSpacing: -0.55, lineHeight: 30, marginTop: 19 }, receiptSubhead: { color: '#85858E', fontSize: 11, lineHeight: 16, marginTop: 5, maxWidth: 280, textAlign: 'center' }, receiptAmountLabel: { color: '#92929B', fontFamily: typography.bodyMedium, fontSize: 9, letterSpacing: 0.5, marginTop: 20 }, receiptAmountValue: { color: '#17171F', fontSize: 31, letterSpacing: -0.7, lineHeight: 38, marginTop: 2 }, receiptPerforation: { borderBottomColor: '#DADAE0', borderBottomWidth: 1, borderStyle: 'dashed', marginVertical: 18, width: '100%' }, receiptSectionLabel: { alignSelf: 'flex-start', color: '#92929B', fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.65 }, receiptDestination: { alignItems: 'center', backgroundColor: '#F4F4F6', borderRadius: 14, flexDirection: 'row', marginTop: 9, minHeight: 66, paddingHorizontal: 11, width: '100%' }, receiptDestinationMark: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 40 }, receiptDestinationInitial: { color: colors.primaryDark, fontSize: 14 }, receiptDestinationCopy: { flex: 1, marginLeft: 10 }, receiptDestinationTitle: { color: '#17171F', fontSize: 12 }, receiptDestinationMeta: { color: '#92929B', fontSize: 9, marginTop: 2 }, receiptVerified: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, height: 27, justifyContent: 'center', width: 27 }, receiptMetaRow: { alignItems: 'center', borderBottomColor: '#ECECF0', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 38, width: '100%' }, receiptKey: { color: '#92929B', fontSize: 10 }, receiptValue: { color: '#17171F', fontFamily: typography.bodyMedium, fontSize: 10, maxWidth: '65%', textAlign: 'right' }, receiptComplete: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 10 }, receiptButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 12, height: 49, justifyContent: 'center', marginTop: 20, width: '100%' }, receiptButtonText: { color: '#FFFFFF', fontSize: 12 }, receiptAgain: { alignItems: 'center', height: 42, justifyContent: 'center', marginTop: 4 }, receiptAgainText: { color: colors.primaryDark, fontSize: 11 }, receiptNotches: { bottom: -7, flexDirection: 'row', justifyContent: 'space-around', left: 0, position: 'absolute', right: 0 }, receiptNotch: { backgroundColor: colors.primaryDark, borderRadius: radii.pill, height: 14, width: 14 }, receiptSecure: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 18, zIndex: 1 }, receiptSecureText: { color: 'rgba(255,255,255,0.72)', fontSize: 9 },
  donationPage: { backgroundColor: colors.background, flex: 1 }, donationSheetFullscreen: { alignSelf: 'center', backgroundColor: colors.background, borderRadius: 0, flex: 1, maxWidth: 720, paddingBottom: 16, paddingHorizontal: 16, paddingTop: 6, width: '100%' }, sheetHeaderFullscreen: { height: 50, marginTop: 0 }, sheetBack: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, height: 38, justifyContent: 'center', width: 38 }, targetSection: { marginTop: 16 }, targetLabel: { color: colors.textMuted, fontFamily: typography.bodySemiBold, fontSize: 9, letterSpacing: 0.72 }, fundTarget: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderBottomWidth: 0, borderRadius: 14, flexDirection: 'row', marginTop: 8, minHeight: 64, paddingHorizontal: 12, paddingVertical: 10 }, fundTargetIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, height: 42, justifyContent: 'center', width: 42 }, fundTargetCopy: { flex: 1, marginLeft: 11 }, fundTargetTitle: { fontSize: 14, lineHeight: 18 }, fundTargetDetail: { color: colors.textMuted, fontSize: 10, marginTop: 2 }, targetCheck: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.pill, height: 28, justifyContent: 'center', width: 28 }, amountFieldReference: { borderBottomWidth: 0, marginTop: 38, paddingBottom: 0 }, donationInputReference: { fontSize: 58, lineHeight: 66, minWidth: 145 }, amountHelperReference: { fontSize: 11, marginTop: 2 }, quickAmountsReference: { gap: 8, marginTop: 17 }, quickAmountReference: { backgroundColor: colors.surfaceMuted, borderRadius: 8, height: 38 }, quickAmountTextReference: { fontSize: 10 }, paymentSectionHeaderReference: { marginTop: 28 }, paymentSourceReference: { backgroundColor: colors.surfaceMuted, borderColor: colors.border, borderRadius: 14, minHeight: 66, paddingHorizontal: 13 }, paymentSourceIconReference: { backgroundColor: colors.surface, height: 40, width: 40 }, paymentSourceTitleReference: { fontSize: 13, lineHeight: 17 }, paymentSourceDetailReference: { fontSize: 10, lineHeight: 14, marginTop: 2 }, changeSource: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.pill, flexDirection: 'row', gap: 1, paddingHorizontal: 8, paddingVertical: 6 }, changeSourceText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 10 }, donateButtonReference: { borderRadius: 14, height: 56, marginTop: 'auto' }, donateButtonTextReference: { fontSize: 13 },
  footerNote: { alignItems: 'flex-start', flexDirection: 'row', gap: 7, marginBottom: spacing.xl, marginTop: 19 }, footerText: { color: colors.textMuted, flex: 1, fontSize: 9, lineHeight: 14 },
}));
