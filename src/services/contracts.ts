/** Fronteras de infraestructura. Sus implementaciones se agregarán cuando se definan proveedores y permisos. */
export interface ConnectivityService {
  isOnline(): Promise<boolean>;
}

export interface LocationService {
  requestForegroundPermission(): Promise<boolean>;
}

export interface MediaService {
  requestCameraPermission(): Promise<boolean>;
}

export interface NotificationService {
  requestPermission(): Promise<boolean>;
}

export interface CommunityRepository<TCommunity, TPost> {
  getCurrentCommunity(): Promise<TCommunity | null>;
  listPosts(): Promise<readonly TPost[]>;
}
