import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AiService } from '../../../core/services/ai.service';

@Component({
  selector: 'app-employee-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      
      <!-- Sidebar -->
      <aside class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col hidden md:flex">
        <div class="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
          <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Siyena AI</span>
        </div>
        
        <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <!-- Nouvelle Discussion Button -->
          <a routerLink="/employee/chat" [queryParams]="{}"
             class="flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-900/40 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 shadow-sm hover:shadow transition-all duration-200 active:scale-95 mb-4"
             title="Créer une nouvelle conversation">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
            <span>Nouvelle discussion</span>
          </a>



          <!-- Historique des Chats Section -->
          <div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/50">
            <span class="px-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2.5">Historique</span>
            
            <div class="space-y-1 max-h-[320px] overflow-y-auto px-2">
              <div *ngIf="aiService.conversations().length === 0" class="text-xs text-gray-400 dark:text-gray-500 px-3 py-2 italic">
                Aucune discussion
              </div>
              
              <a *ngFor="let convo of aiService.conversations()" 
                 [routerLink]="['/employee/chat']" 
                 [queryParams]="{ id: convo._id }"
                 routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-900/25 dark:text-blue-400 font-medium"
                 class="flex items-center px-3 py-2 text-xs text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 hover:text-gray-900 dark:hover:text-white transition-colors truncate group relative">
                <svg class="w-3.5 h-3.5 mr-2 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <span class="truncate pr-2">{{ convo.title || 'Discussion sans titre' }}</span>
              </a>
            </div>
          </div>
          
          <a routerLink="/employee/profile" routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
             class="flex items-center px-4 py-3 mt-4 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            Mon Profil
          </a>
        </nav>
        
        <div class="p-4 border-t border-gray-200 dark:border-gray-700">
          <button (click)="logout()" class="flex items-center w-full px-4 py-3 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Déconnexion
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col overflow-hidden relative">
        <!-- Mobile Header -->
        <header class="md:hidden h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
          <span class="text-lg font-bold text-gray-800 dark:text-white">Siyena AI</span>
          <div class="flex items-center space-x-2">
            <a routerLink="/employee/chat" class="text-sm font-medium text-blue-600 mr-2">Chat</a>
            <button (click)="logout()" class="text-sm text-red-600">Quitter</button>
          </div>
        </header>

        <router-outlet></router-outlet>
      </main>

    </div>
  `,
  styles: []
})
export class EmployeeLayoutComponent implements OnInit {
  authService = inject(AuthService);
  aiService = inject(AiService);

  ngOnInit() {
    this.aiService.loadConversations().subscribe({
      error: (err) => console.error('Error loading conversations in sidebar:', err)
    });
  }

  logout() {
    this.authService.logout();
  }
}

