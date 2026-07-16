import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from '../../auth.config';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private initialLoadPromise: Promise<boolean>;

  constructor(
    private oauthService: OAuthService,
    private router: Router,
  ) {
    this.oauthService.configure(authConfig);
    this.oauthService.setupAutomaticSilentRefresh();

    this.initialLoadPromise = this.oauthService
      .loadDiscoveryDocumentAndTryLogin()
      .then((loggedIn) => {
        if (loggedIn) {
          this.router.navigateByUrl('/app/home');
        }
        return loggedIn;
      });
  }

  private get decodedToken(): any {
    const token = this.oauthService.getAccessToken();
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch (error) {
      return null;
    }
  }

  public get userName(): string {
    const payload = this.decodedToken;
    if (payload && payload.sub) {
      return payload.sub.split('@')[0];
    }
    return 'Usuario';
  }

  public get primaryRole(): string {
    const payload = this.decodedToken;
    const roles: string[] = payload?.roles || [];

    if (roles.includes('ROLE_ADMIN')) return 'Administrador';
    if (roles.includes('ROLE_TUTOR')) return 'Tutor';
    if (roles.includes('ROLE_ALUMNO')) return 'Alumno';

    return 'Invitado';
  }

  public login(): void {
    this.oauthService.initCodeFlow();
  }

  public logout(): void {
    this.oauthService.logOut();
  }

  public get isLoggedIn(): boolean {
    return this.oauthService.hasValidAccessToken();
  }

  public async waitForAuthReady(): Promise<boolean> {
    await this.initialLoadPromise;
    return this.isLoggedIn;
  }

  // Métodos para obtener información del usuario

  public hasRole(rolBuscado: string): boolean {
    const payload = this.decodedToken;
    const roles: string[] = payload?.roles || [];
    return roles.includes(rolBuscado);
  }

  public get userId(): string {
    const payload = this.decodedToken;
    return payload?.usuario_id || '';
  }

  public get userEmail(): string {
    const payload = this.decodedToken;
    return payload?.sub || '';
  }

  // HU-08: pide un access token nuevo usando el refresh_token guardado,
  // sin mandar al usuario a loguearse de nuevo. El backend (auth) ahora
  // vuelve a consultar los roles actuales en la BD en cada emisión de
  // token, así que este refresh sí trae el rol actualizado (ej. TUTOR)
  // si el usuario acaba de ser aprobado.
  public async refrescarToken(): Promise<boolean> {
    try {
      await this.oauthService.refreshToken();
      return true;
    } catch (error) {
      // Si no hay refresh_token válido (ej. sesión expirada de verdad),
      // no rompemos la app por esto; el resto de guards se encargan de
      // mandar a login cuando corresponda.
      return false;
    }
  }
}
