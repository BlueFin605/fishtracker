import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  NewShare,
  CreateShareResponse,
  ShareSummary,
  ShareDetails,
} from './share.types';

@Injectable({ providedIn: 'root' })
export class ShareService {
  // environment.apiUrl already includes the trailing /api segment.
  private readonly base = `${environment.apiUrl}/share`;

  constructor(private http: HttpClient) {}

  create(req: NewShare): Observable<CreateShareResponse> {
    return this.http.post<CreateShareResponse>(this.base, req);
  }

  list(direction: 'outbox' | 'inbox'): Observable<ShareSummary[]> {
    return this.http.get<ShareSummary[]>(`${this.base}?direction=${direction}`);
  }

  get(shareId: string): Observable<ShareDetails> {
    return this.http.get<ShareDetails>(
      `${this.base}/${encodeURIComponent(shareId)}`
    );
  }

  revoke(shareId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/${encodeURIComponent(shareId)}`
    );
  }
}
