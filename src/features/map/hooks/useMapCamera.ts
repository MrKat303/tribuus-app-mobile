import type { Camera } from '@rnmapbox/maps';
import { useCallback, useRef, useState } from 'react';

import {
  clampCoordinateToBoundingBox,
  type Coordinate,
  COUNTRY_CAMERA_BOUNDING_BOX,
  COUNTRY_MIN_ZOOM,
  DEFAULT_MAP_ZOOM,
  SANTIAGO,
} from '../model/map';

type CameraSettings = Parameters<Camera['setCamera']>[0];
type CameraChangeState = { properties: { center: number[]; zoom: number } };

export function useMapCamera() {
  const cameraRef = useRef<Camera>(null);
  const mapCenterRef = useRef<Coordinate>(SANTIAGO);
  const [mapCenter, setMapCenter] = useState<Coordinate>(SANTIAGO);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_MAP_ZOOM);

  const moveCamera = useCallback((settings: CameraSettings) => {
    if ('stops' in settings) {
      cameraRef.current?.setCamera(settings);
      return;
    }

    cameraRef.current?.setCamera({
      ...settings,
      centerCoordinate: settings.centerCoordinate
        ? clampCoordinateToBoundingBox(settings.centerCoordinate as Coordinate, COUNTRY_CAMERA_BOUNDING_BOX)
        : undefined,
      zoomLevel: settings.zoomLevel === undefined ? undefined : Math.max(COUNTRY_MIN_ZOOM, settings.zoomLevel),
    });
  }, []);

  const handleCameraChanged = useCallback((state: CameraChangeState) => {
    const [longitude, latitude] = state.properties.center;
    const coordinate = clampCoordinateToBoundingBox([longitude, latitude], COUNTRY_CAMERA_BOUNDING_BOX);
    mapCenterRef.current = coordinate;
    setMapCenter(coordinate);
    setZoomLevel(Math.max(COUNTRY_MIN_ZOOM, state.properties.zoom));
  }, []);

  return { cameraRef, handleCameraChanged, mapCenter, mapCenterRef, moveCamera, zoomLevel };
}
