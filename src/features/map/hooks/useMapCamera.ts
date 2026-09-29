import type { Camera, MapState } from '@rnmapbox/maps';
import { useCallback, useRef, useState } from 'react';

import {
  clampCoordinateToBoundingBox,
  type Coordinate,
  COUNTRY_CAMERA_BOUNDING_BOX,
  COUNTRY_MIN_ZOOM,
  DEFAULT_MAP_ZOOM,
  type MapViewportBounds,
  SANTIAGO,
} from '../model/map';

type CameraSettings = Parameters<Camera['setCamera']>[0];
export function useMapCamera() {
  const cameraRef = useRef<Camera>(null);
  const mapCenterRef = useRef<Coordinate>(SANTIAGO);
  const zoomLevelRef = useRef(DEFAULT_MAP_ZOOM);
  const [mapCenter, setMapCenter] = useState<Coordinate>(SANTIAGO);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_MAP_ZOOM);
  const [viewportBounds, setViewportBounds] = useState<MapViewportBounds | null>(null);

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

  const updateCameraRefs = useCallback((state: MapState) => {
    const [longitude, latitude] = state.properties.center;
    const coordinate = clampCoordinateToBoundingBox([longitude, latitude], COUNTRY_CAMERA_BOUNDING_BOX);
    mapCenterRef.current = coordinate;
    zoomLevelRef.current = Math.max(COUNTRY_MIN_ZOOM, state.properties.zoom);
    return coordinate;
  }, []);

  const handleCameraChanged = useCallback((state: MapState) => {
    // Mapbox emits this event continuously during gestures. Keep the live camera
    // outside React so panning does not invalidate ranking and clustering.
    updateCameraRefs(state);
  }, [updateCameraRefs]);

  const handleMapIdle = useCallback((state: MapState) => {
    const coordinate = updateCameraRefs(state);
    setMapCenter(coordinate);
    setZoomLevel(zoomLevelRef.current);
    setViewportBounds({
      ne: state.properties.bounds.ne.slice(0, 2) as Coordinate,
      sw: state.properties.bounds.sw.slice(0, 2) as Coordinate,
    });
  }, [updateCameraRefs]);

  return {
    cameraRef,
    handleCameraChanged,
    handleMapIdle,
    mapCenter,
    mapCenterRef,
    moveCamera,
    viewportBounds,
    zoomLevel,
  };
}
