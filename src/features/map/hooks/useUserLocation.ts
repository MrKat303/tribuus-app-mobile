import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import {
  type Coordinate,
  COUNTRY_CAMERA_BOUNDING_BOX,
  COUNTRY_NAME,
  isCoordinateInBoundingBox,
  SANTIAGO,
  USER_LOCATION_ZOOM,
} from '../model/map';

type MoveCamera = (settings: {
  animationDuration: number;
  animationMode: 'flyTo';
  centerCoordinate: Coordinate;
  zoomLevel: number;
}) => void;

export function useUserLocation(moveCamera: MoveCamera) {
  const [locationGranted, setLocationGranted] = useState(false);
  const [userCoordinate, setUserCoordinate] = useState<Coordinate | null>(null);

  const locateUser = useCallback(async (showDeniedAlert = true) => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      setLocationGranted(false);
      if (showDeniedAlert) Alert.alert('Activa tu ubicación', 'Tribuus necesita tu permiso para mostrar lugares y alertas cerca de ti.');
      return;
    }

    setLocationGranted(true);
    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coordinate: Coordinate = [position.coords.longitude, position.coords.latitude];
      if (!isCoordinateInBoundingBox(coordinate, COUNTRY_CAMERA_BOUNDING_BOX)) {
        setUserCoordinate(null);
        moveCamera({ animationDuration: 700, animationMode: 'flyTo', centerCoordinate: SANTIAGO, zoomLevel: USER_LOCATION_ZOOM });
        if (showDeniedAlert) Alert.alert(`Estás fuera de ${COUNTRY_NAME}`, `Por ahora Tribuus solo permite explorar y buscar lugares dentro de ${COUNTRY_NAME}.`);
        return;
      }
      setUserCoordinate(coordinate);
      moveCamera({ animationDuration: 900, animationMode: 'flyTo', centerCoordinate: coordinate, zoomLevel: USER_LOCATION_ZOOM });
    } catch {
      if (showDeniedAlert) Alert.alert('No pudimos encontrarte', 'Inténtalo nuevamente en unos segundos.');
    }
  }, [moveCamera]);

  useEffect(() => {
    const requestTimer = setTimeout(() => void locateUser(false), 0);
    return () => clearTimeout(requestTimer);
  }, [locateUser]);

  return { locateUser, locationGranted, userCoordinate };
}
