import { SwipeableTabPage } from '@/components/SwipeableTabPage';
import { MapScreen } from '@/features/map/screens/MapScreen';

export default function MapTab() {
  return <SwipeableTabPage edgeOnly><MapScreen /></SwipeableTabPage>;
}
