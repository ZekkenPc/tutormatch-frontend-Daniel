import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'http://localhost:8081', // Apunta a tu Auth Server de Spring Boot
  redirectUri: 'http://localhost:4200/', // A dónde ir después del login
  postLogoutRedirectUri: 'http://localhost:4200/', // A dónde ir al cerrar sesión
  clientId: 'frontend-client',
  responseType: 'code',
  scope: 'openid profile',
  showDebugInformation: true,
  requireHttps: false, 
  useSilentRefresh: true 
};