import { Injectable, signal } from '@angular/core';

const TOKEN_KEY = 'sgw_admin_token';
const API_URL_KEY = 'sgw_api_url';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  adminToken = signal<string>(localStorage.getItem(TOKEN_KEY) ?? '');
  apiUrl = signal<string>(localStorage.getItem(API_URL_KEY) ?? 'http://localhost:9001');

  setToken(token: string) {
    this.adminToken.set(token);
    localStorage.setItem(TOKEN_KEY, token);
  }

  setApiUrl(url: string) {
    this.apiUrl.set(url);
    localStorage.setItem(API_URL_KEY, url);
  }
}
