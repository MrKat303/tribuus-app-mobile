import { SwipeableTabPage } from '@/components/SwipeableTabPage';
import { MapScreen } from '@/features/map/screens/MapScreen';
import { PlacesProvider } from '@/features/places/application/PlacesProvider';

export default function MapTab() {
  return (
    <PlacesProvider>
      <SwipeableTabPage edgeOnly>
        <MapScreen />
      </SwipeableTabPage>
    </PlacesProvider>
  );
}
