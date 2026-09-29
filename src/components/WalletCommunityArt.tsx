import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export function WalletHeroArtwork() {
  return (
    <Svg height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 360 220" width="100%">
      <Defs>
        <LinearGradient id="walletWash" x1="0" x2="1" y1="0" y2="1">
          <Stop offset="0" stopColor="#217D38" />
          <Stop offset="1" stopColor="#15552A" />
        </LinearGradient>
        <LinearGradient id="walletRibbon" x1="0" x2="1" y1="0" y2="0">
          <Stop offset="0" stopColor="#34C759" stopOpacity="0" />
          <Stop offset="0.52" stopColor="#FFFFFF" stopOpacity="0.42" />
          <Stop offset="1" stopColor="#34C759" stopOpacity="0.1" />
        </LinearGradient>
      </Defs>
      <Rect fill="url(#walletWash)" height="220" width="360" />
      <Circle cx="310" cy="-8" fill="#34C759" opacity="0.2" r="112" />
      <Circle cx="310" cy="-8" fill="none" opacity="0.3" r="77" stroke="#FFFFFF" strokeWidth="1" />
      <Path d="M-28 190C44 117 109 226 181 151C237 93 281 104 394 147" fill="none" opacity="0.8" stroke="url(#walletRibbon)" strokeWidth="24" />
      <Path d="M-25 186C45 112 111 220 181 147C239 87 289 103 391 143" fill="none" opacity="0.52" stroke="#FFFFFF" strokeWidth="1.5" />
      <G fill="#FFFFFF" opacity="0.34">
        <Circle cx="278" cy="42" r="2" /><Circle cx="294" cy="42" r="2" /><Circle cx="310" cy="42" r="2" /><Circle cx="326" cy="42" r="2" />
        <Circle cx="278" cy="58" r="2" /><Circle cx="294" cy="58" r="2" /><Circle cx="310" cy="58" r="2" /><Circle cx="326" cy="58" r="2" />
        <Circle cx="278" cy="74" r="2" /><Circle cx="294" cy="74" r="2" /><Circle cx="310" cy="74" r="2" /><Circle cx="326" cy="74" r="2" />
      </G>
    </Svg>
  );
}

export function CommunityOrbit({ size = 48 }: { size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 48 48" width={size}>
      <Circle cx="24" cy="24" fill="#FFFFFF" opacity="0.94" r="23" />
      <Circle cx="24" cy="18" fill="#217D38" r="5" />
      <Circle cx="14" cy="27" fill="#217D38" r="4" />
      <Circle cx="34" cy="27" fill="#217D38" r="4" />
      <Path d="M13 37c1-6 5-9 11-9s10 3 11 9" fill="none" stroke="#217D38" strokeLinecap="round" strokeWidth="3" />
      <Path d="M7 34c.5-4 3-6 7-6M41 34c-.5-4-3-6-7-6" fill="none" stroke="#217D38" strokeLinecap="round" strokeWidth="2.5" />
    </Svg>
  );
}
