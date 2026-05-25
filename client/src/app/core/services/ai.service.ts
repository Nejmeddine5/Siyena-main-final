import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface ChatMessage {
  _id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

export interface Conversation {
  _id: string;
  title: string;
  lastMessageAt: Date;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private apiUrl = `${environment.apiUrl}/ai`;
  // OpenWebUI base URL (adjust if different)
  private openWebUrl = 'http://localhost:3000/api';

  // Shared state for the sidebar and main chat component
  conversations = signal<Conversation[]>([]);

  constructor(private http: HttpClient) { }

  // Existing method (kept for backward compatibility)
  sendMessage(message: string, conversationId?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/chat`, { message, conversationId }).pipe(
      tap(res => {
        // Refresh conversations list if a message was successfully sent/saved
        if (res.data && res.data.conversationId) {
          this.loadConversations().subscribe();
        }
      })
    );
  }

  // New method: direct call to OpenWebUI chat completions endpoint
  sendMessageViaOpenWeb(message: string, model: string = 'llama3:8b'): Observable<any> {
    const payload = {
      model,
      messages: [{ role: 'user', content: message }]
    };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
      // Add Authorization header here if your OpenWebUI instance requires a token
      // 'Authorization': `Bearer YOUR_API_KEY`
    });
    return this.http.post<any>(`${this.openWebUrl}/chat/completions`, payload, { headers });
  }

  getConversations(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/conversations`).pipe(
      tap(res => {
        if (res.data && res.data.conversations) {
          this.conversations.set(res.data.conversations);
        }
      })
    );
  }

  loadConversations(): Observable<any> {
    return this.getConversations();
  }

  getConversationMessages(conversationId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/conversations/${conversationId}/messages`);
  }
}




