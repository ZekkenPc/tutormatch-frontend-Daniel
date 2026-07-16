<<<<<<< HEAD
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
=======
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { catchError, from, switchMap, throwError } from 'rxjs';
>>>>>>> c6c6e86 (H05)
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Inyectamos el servicio de OAuth2 directamente en la función
  const oauthService = inject(OAuthService);
<<<<<<< HEAD
  const token = oauthService.getAccessToken();
=======
>>>>>>> c6c6e86 (H05)

  // Verificamos si la petición va dirigida a nuestro Gateway
  const isApiRequest = req.url.startsWith(environment.apiGatewayUrl);

<<<<<<< HEAD
  // Si tenemos token y es nuestra API, clonamos la petición y le pegamos el Header
  if (token && isApiRequest) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Dejamos pasar la petición modificada
    return next(clonedRequest);
  }

  // Si no hay token o va a otra API externa, pasa la petición original tal cual
  return next(req);
=======
  const conToken = (token: string | null) =>
    token && isApiRequest ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(conToken(oauthService.getAccessToken())).pipe(
    catchError((error: unknown) => {
      // HU-08: respaldo por si el usuario recibe un 403 en algo de Tutor
      // porque su JWT todavía no reflejaba el ascenso (ej. no pasó por el
      // Layout todavía para disparar el refresh silencioso normal).
      // Refrescamos el token una vez y reintentamos la misma petición.
      if (isApiRequest && error instanceof HttpErrorResponse && error.status === 403) {
        return from(oauthService.refreshToken()).pipe(
          switchMap(() => next(conToken(oauthService.getAccessToken()))),
          catchError(() => throwError(() => error)),
        );
      }
      return throwError(() => error);
    }),
  );
>>>>>>> c6c6e86 (H05)
};
