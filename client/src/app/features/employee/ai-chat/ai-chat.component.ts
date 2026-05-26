import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, ChatMessage, Conversation } from '../../../core/services/ai.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription } from 'rxjs';
interface DisplayMessage extends ChatMessage {
  formattedContent?: SafeHtml;
}
@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex-1 flex flex-col h-full bg-white dark:bg-[#212121] transition-colors duration-300 relative">
      
      <!-- Chat Header -->
      <header class="h-14 flex items-center justify-between border-b border-gray-150/80 dark:border-[#303030] px-6 shrink-0 bg-white dark:bg-[#212121] z-20">
        <div class="flex items-center space-x-3">
          <span class="font-bold text-gray-800 dark:text-gray-200 text-base select-none">
            {{ currentConversation?.title || 'Siyana' }}
          </span>
        </div>
        
        <!-- Theme Toggle -->
        <button (click)="themeService.toggleTheme()"
          class="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100/20 dark:hover:bg-gray-700/20 focus:outline-none transition-colors">
          <i *ngIf="!themeService.darkMode()" class="fas fa-moon text-xl text-indigo-400"></i>
          <i *ngIf="themeService.darkMode()" class="fas fa-sun text-xl text-yellow-400"></i>
        </button>
      </header>

      <!-- Messages Area -->
      <div #scrollContainer class="flex-1 overflow-y-auto px-4 py-6 sm:p-8 space-y-6 scroll-smooth relative z-10">
        
        <div class="max-w-3xl mx-auto w-full flex flex-col space-y-6">
          
          <!-- Empty State / Welcome Screen -->
          <div *ngIf="messages.length === 0" class="flex flex-col items-center justify-center min-h-[55vh] text-center space-y-6 py-8" @fadeSlideIn>
            
            <div class="space-y-2">
              <h3 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                Comment puis-je vous aider aujourd'hui ?
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Posez une question ou sélectionnez l'un des problèmes fréquents ci-dessous pour démarrer.
              </p>
            </div>

            <!-- Quick Prompts Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl px-4 mt-4">
              <button *ngFor="let prompt of quickPrompts" 
                      (click)="selectPrompt(prompt.text)"
                      class="flex flex-col items-start text-left p-4 rounded-2xl bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#383838] hover:border-indigo-300 dark:hover:border-indigo-900/60 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/10 shadow-sm hover:shadow transition-all duration-300 group">
                <span class="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1.5">{{ prompt.label }}</span>
                <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white leading-snug">{{ prompt.text }}</span>
              </button>
            </div>
          </div>

          <!-- Message Bubbles list -->
          <ng-container *ngIf="messages.length > 0">
            <div *ngFor="let msg of messages; let msgIndex = index; let last = last" 
                 class="flex w-full" 
                 [ngClass]="msg.role === 'user' ? 'justify-end' : 'justify-start'" 
                 @fadeSlideIn>
              
              <!-- Avatar IA -->
              <div *ngIf="msg.role === 'assistant'" class="w-8 h-8 shrink-0 mr-3 rounded-full bg-white dark:bg-[#2f2f2f] border border-gray-150 dark:border-[#424242] shadow-sm flex items-center justify-center mt-1 overflow-hidden p-0.5 select-none">
                <img src="/media/siyana.png" alt="Siyana IA" class="w-full h-full object-contain rounded-full">
              </div>

              <!-- User Message Body with Action Bar -->
              <div *ngIf="msg.role === 'user'" class="flex flex-col items-end max-w-[70%] group">
                <div class="rounded-[24px] px-5 py-3 text-sm sm:text-base leading-relaxed bg-[#f4f4f4] dark:bg-[#2f2f2f] text-gray-800 dark:text-gray-100 border-none shadow-none w-full">
                  <!-- Normal Content or Inline Editor -->
                  <div *ngIf="editingIndex !== msgIndex" class="whitespace-pre-wrap select-text markdown-body" [innerHTML]="msg.formattedContent || msg.content"></div>
                  
                  <div *ngIf="editingIndex === msgIndex" class="w-full flex flex-col space-y-2 py-1">
                    <textarea 
                      [(ngModel)]="editingContent"
                      rows="3"
                      class="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                    ></textarea>
                    <div class="flex justify-end space-x-2">
                      <button (click)="editingIndex = -1" class="px-3 py-1.5 bg-gray-200 dark:bg-[#3d3d3d] text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-300 dark:hover:bg-[#4d4d4d] transition-colors">
                        Annuler
                      </button>
                      <button (click)="submitEdit(msgIndex)" class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors">
                        Enregistrer & Envoyer
                      </button>
                    </div>
                  </div>
                </div>

                <!-- User Message Actions -->
                <div *ngIf="editingIndex !== msgIndex" class="flex items-center space-x-2.5 mt-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-gray-500">
                  <button (click)="copyMessage(msg.content, msgIndex)" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1" title="Copier le message">
                    <i [ngClass]="copiedIndex === msgIndex ? 'fas fa-check text-green-500' : 'fas fa-copy text-xs'"></i>
                  </button>
                  <button (click)="startEdit(msgIndex, msg.content)" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1" title="Modifier le message">
                    <i class="fas fa-pen text-xs"></i>
                  </button>
                </div>
              </div>

              <!-- Assistant Message Body with Action Bar -->
              <div *ngIf="msg.role === 'assistant'" class="flex flex-col items-start max-w-[85%] sm:max-w-[78%] group">
                <div class="text-sm sm:text-base leading-relaxed bg-transparent border-none shadow-none text-gray-800 dark:text-gray-100 px-0 py-1.5">
                  <div class="whitespace-pre-wrap select-text markdown-body" [innerHTML]="msg.formattedContent || msg.content"></div>
                </div>

                <!-- Assistant Message Actions -->
                <div class="flex items-center space-x-2.5 mt-0.5 ml-1 text-gray-400 dark:text-gray-500">
                  <button (click)="copyMessage(msg.content, msgIndex)" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1" title="Copier la réponse">
                    <i [ngClass]="copiedIndex === msgIndex ? 'fas fa-check text-green-500' : 'fas fa-copy text-xs'"></i>
                  </button>
                  <button (click)="regenerateMessage(msgIndex)" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1" title="Régénérer la réponse">
                    <i class="fas fa-sync-alt text-xs"></i>
                  </button>
                </div>
              </div>

            </div>
          </ng-container>

          <div *ngIf="currentConversationId && messages.length > 0" class="flex justify-center mt-4">
            <button *ngIf="!isTicketRequested"
                    (click)="requestTechnician()"
                    [disabled]="isRequesting"
                    class="flex items-center space-x-2 rounded-full border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-5 py-2.5 transition-all duration-200 hover:bg-indigo-150 dark:hover:bg-indigo-900/40 shadow-sm hover:shadow hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
              <i class="fas fa-user-cog text-sm"></i>
              <span>{{ isRequesting ? 'Envoi en cours...' : "Demander l'assistance d'un technicien" }}</span>
            </button>
            <span *ngIf="isTicketRequested"
                  class="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 text-xs font-semibold px-3 py-1">
              Demande envoyée aux admins
            </span>
          </div>

          <!-- Typing Indicator -->
          <div *ngIf="isLoading" class="flex w-full justify-start" @fadeSlideIn>
            <div class="w-8 h-8 shrink-0 mr-3 rounded-full bg-white dark:bg-[#2f2f2f] border border-gray-150 dark:border-[#424242] shadow-sm flex items-center justify-center mt-1 overflow-hidden p-0.5 select-none">
              <img src="/media/siyana.png" alt="Siyana IA" class="w-full h-full object-contain rounded-full">
            </div>
            <div class="bg-transparent rounded-2xl px-2 py-4 flex items-center space-x-1.5 shadow-none border-none">
              <div class="w-2.5 h-2.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
              <div class="w-2.5 h-2.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
              <div class="w-2.5 h-2.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
            </div>
          </div>

        </div>
      </div>

      <!-- Input Area -->
      <div class="px-4 pb-5 sm:pb-7 bg-transparent shrink-0 relative z-10">
        <div class="max-w-3xl mx-auto w-full">
          
          <!-- Input container -->
          <div class="relative flex items-end bg-[#f4f4f4] dark:bg-[#2f2f2f] border border-transparent dark:border-[#383838] focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-[26px] px-4 py-3 gap-3 shadow-sm transition-all duration-300">

            <!-- Textarea -->
            <textarea 
              #textInput
              [(ngModel)]="newMessage" 
              (keydown.enter)="handleEnter($event)"
              rows="1"
              placeholder="Message Siyana..."
              class="flex-grow bg-transparent border-0 text-gray-950 dark:text-gray-100 focus:ring-0 focus:outline-none resize-none max-h-40 min-h-[28px] placeholder-gray-400 dark:placeholder-gray-500 text-sm md:text-base leading-relaxed self-end py-0"
              (input)="autoResize($event)"
            ></textarea>
            
            <!-- Send Button — arrow-up style (Claude / ChatGPT) -->
            <button 
              *ngIf="!isLoading"
              (click)="sendMessage()" 
              [disabled]="!newMessage.trim()"
              [attr.aria-label]="'Envoyer le message'"
              class="send-btn flex-shrink-0 self-end w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
              [class.send-btn--active]="newMessage.trim()"
              [class.send-btn--disabled]="!newMessage.trim()"
            >
              <!-- Arrow up icon -->
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M8 13V3M8 3L3.5 7.5M8 3L12.5 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <!-- Stop Button — square icon -->
            <button 
              *ngIf="isLoading"
              (click)="stopGeneration()" 
              [attr.aria-label]="'Arrêter la génération'"
              class="send-btn send-btn--active flex-shrink-0 self-end w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
            >
              <!-- Stop (square) icon -->
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect width="12" height="12" rx="2" />
              </svg>
            </button>
          </div>
          
          <!-- Bottom Info / Version -->
          <div class="text-center mt-4 select-none pb-2">
            <span class="text-[10px] font-bold tracking-wide text-blue-700 dark:text-blue-300">SIYENA</span>
            <p class="text-[8px] text-gray-400 dark:text-gray-500 mt-1.5 leading-relaxed">Centre Informatique du Ministère de la Santé (CIMS)</p>
          </div>
        </div>
      </div>
      
    </div>
  `,
  animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      height: 100%;
      min-height: 0;
      overflow: hidden;
    }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.25); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(107, 114, 128, 0.45); }

    /* Code highlight / block styles */
    .markdown-body pre { white-space: pre; }
    .markdown-body code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }

    /* ── Send button ── */
    .send-btn {
      outline: none;
    }

    /* Disabled state: gray pill */
    .send-btn--disabled {
      background-color: #e5e7eb;
      color: #9ca3af;
      cursor: not-allowed;
    }
    :host-context(.dark) .send-btn--disabled {
      background-color: #3d3d3d;
      color: #6b7280;
    }

    /* Active state: solid black / white depending on theme */
    .send-btn--active {
      background-color: #111827;
      color: #ffffff;
      cursor: pointer;
    }
    .send-btn--active:hover {
      background-color: #1f2937;
      transform: scale(1.05);
    }
    .send-btn--active:active {
      transform: scale(0.95);
    }
    :host-context(.dark) .send-btn--active {
      background-color: #ffffff;
      color: #111827;
    }
    :host-context(.dark) .send-btn--active:hover {
      background-color: #f3f4f6;
    }
  `]
})
export class AiChatComponent implements OnInit {
  aiService = inject(AiService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  @ViewChild('textInput') textInput!: ElementRef;

  messages: DisplayMessage[] = [];
  newMessage = '';
  isLoading = false;
  isTicketRequested = false;
  isRequesting = false;
  currentConversationId?: string;
  currentConversation?: Conversation;

  quickPrompts = [
    { label: '🛠️ Problème matériel', text: "Mon PC ou mon écran ne s'allume pas." },
    { label: '🖨️ Panne Imprimante', text: "L'imprimante réseau ne répond plus." },
    { label: '🔑 Accès Session', text: "Comment réinitialiser mon mot de passe de session ?" },
    { label: '🌐 Problème Réseau', text: "Je n'arrive pas à me connecter à l'intranet." }
  ];

  editingIndex: number = -1;
  editingContent: string = '';
  copiedIndex: number = -1;
  private chatSubscription?: Subscription;

  startEdit(index: number, content: string) {
    this.editingIndex = index;
    this.editingContent = content;
  }

  submitEdit(index: number) {
    if (!this.editingContent.trim() || this.isLoading) return;

    const editedText = this.editingContent.trim();

    // Slice messages to truncate subsequent ones
    this.messages = this.messages.slice(0, index + 1);

    // Update the message in place
    this.messages[index].content = editedText;
    this.messages[index].formattedContent = this.formatMessageContent(editedText);

    this.editingIndex = -1;

    // Trigger AI API call
    this.isLoading = true;
    this.chatSubscription = this.aiService.sendMessage(editedText, this.currentConversationId).subscribe({
      next: (res) => {
        const aiMsg = res.data.aiMessage;
        this.messages.push({
          ...aiMsg,
          formattedContent: this.formatMessageContent(aiMsg.content)
        });
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        const errMsg = 'Désolé, une erreur est survenue lors de la communication avec le serveur IA.';
        this.messages.push({
          role: 'assistant',
          content: errMsg,
          formattedContent: this.formatMessageContent(errMsg)
        });
        this.scrollToBottom();
      }
    });
  }

  regenerateMessage(index: number) {
    if (this.isLoading || index <= 0) return;

    const previousUserMessage = this.messages[index - 1];
    if (previousUserMessage && previousUserMessage.role === 'user') {
      // Remove current assistant message
      this.messages = this.messages.slice(0, index);

      this.isLoading = true;
      this.chatSubscription = this.aiService.sendMessage(previousUserMessage.content, this.currentConversationId).subscribe({
        next: (res) => {
          const aiMsg = res.data.aiMessage;
          this.messages.push({
            ...aiMsg,
            formattedContent: this.formatMessageContent(aiMsg.content)
          });
          this.isLoading = false;
          this.scrollToBottom();
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          const errMsg = 'Désolé, une erreur est survenue lors de la communication avec le serveur IA.';
          this.messages.push({
            role: 'assistant',
            content: errMsg,
            formattedContent: this.formatMessageContent(errMsg)
          });
          this.scrollToBottom();
        }
      });
    }
  }

  copyMessage(text: string, index: number) {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedIndex = index;
      setTimeout(() => {
        if (this.copiedIndex === index) {
          this.copiedIndex = -1;
        }
      }, 2000);
    });
  }

  stopGeneration() {
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
      this.chatSubscription = undefined;
    }
    this.isLoading = false;

    const lastMsg = this.messages[this.messages.length - 1];
    if (lastMsg && lastMsg.role === 'user') {
      this.messages.push({
        role: 'assistant',
        content: '⏹️ Génération interrompue par l\'utilisateur.',
        formattedContent: this.formatMessageContent('⏹️ Génération interrompue par l\'utilisateur.')
      });
    }
    this.scrollToBottom();
  }

  formatMessageContent(content: string): SafeHtml {
    if (!content) return '';

    let html = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const displayLang = lang ? lang.trim() : 'code';
      return `<pre class="bg-slate-950 text-slate-100 p-4 rounded-xl my-3 overflow-x-auto font-mono text-xs md:text-sm border border-slate-800 shadow-inner select-text"><div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-800/60 pb-1 select-none">${displayLang}</div><code class="select-text">${code.trim()}</code></pre>`;
    });

    html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded font-mono text-xs md:text-sm">$1</code>');
    html = html.replace(/\*\*([\s\S]*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
    html = html.replace(/\*([\s\S]*?)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/^### (.*?)$/gm, '<h4 class="text-sm md:text-base font-bold text-gray-900 dark:text-white mt-4 mb-2">$1</h4>');
    html = html.replace(/^## (.*?)$/gm, '<h3 class="text-base md:text-lg font-extrabold text-gray-900 dark:text-white mt-5 mb-2.5">$1</h3>');
    html = html.replace(/^# (.*?)$/gm, '<h2 class="text-lg md:text-xl font-black text-gray-900 dark:text-white mt-6 mb-3">$1</h2>');
    html = html.replace(/^\s*[-*]\s+(.*?)$/gm, '<div class="flex items-start ml-2 my-1.5"><span class="text-indigo-500 dark:text-indigo-400 mr-2 select-none">•</span><span class="flex-grow">$1</span></div>');
    html = html.replace(/^\s*(\d+)\.\s+(.*?)$/gm, '<div class="flex items-start ml-2 my-1.5"><span class="text-indigo-500 dark:text-indigo-400 mr-2 font-bold select-none">$1.</span><span class="flex-grow">$2</span></div>');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.currentConversationId = id;
        this.loadMessages(id);
        this.updateCurrentConversationInfo(id);
      } else {
        this.clearCurrentChatState();
      }
    });

    this.aiService.loadConversations().subscribe();
  }

  updateCurrentConversationInfo(id: string) {
    const list = this.aiService.conversations();
    const match = list.find(c => c._id === id);
    if (match) {
      this.currentConversation = match;
    } else {
      this.aiService.getConversations().subscribe({
        next: (res) => {
          const freshList = res.data?.conversations || [];
          const freshMatch = freshList.find((c: any) => c._id === id);
          if (freshMatch) {
            this.currentConversation = freshMatch;
          }
        }
      });
    }
  }

  loadMessages(id: string) {
    this.isLoading = true;
    this.aiService.getConversationMessages(id).subscribe({
      next: (res) => {
        const rawMessages = res.data.messages || [];
        this.messages = rawMessages.map((msg: any) => ({
          ...msg,
          formattedContent: this.formatMessageContent(msg.content)
        }));
        this.isTicketRequested = !!res.data.isTicketRequested;
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  handleEnter(event: Event) {
    const kbEvent = event as KeyboardEvent;
    if (!kbEvent.shiftKey) {
      kbEvent.preventDefault();
      this.sendMessage();
    }
  }

  autoResize(event: any) {
    const textarea = event.target || event;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }

  selectPrompt(text: string) {
    this.newMessage = text;
    setTimeout(() => {
      if (this.textInput) {
        const el = this.textInput.nativeElement;
        el.focus();
        this.autoResize(el);
      }
    }, 50);
  }

  clearCurrentChat() {
    this.router.navigate(['/employee/chat'], { queryParams: {} });
  }

  requestTechnician() {
    if (!this.currentConversationId || this.isRequesting || this.isTicketRequested) return;

    this.isRequesting = true;
    this.aiService.requestTechnician(this.currentConversationId).subscribe({
      next: () => {
        this.isTicketRequested = true;
        this.isRequesting = false;

        const infoContent = '✅ Votre demande de technicien a été envoyée aux administrateurs. Un ticket a été créé à partir de cette conversation.';
        this.messages.push({
          role: 'assistant',
          content: infoContent,
          formattedContent: this.formatMessageContent(infoContent)
        });
        this.scrollToBottom();
      },
      error: (err) => {
        console.error(err);
        this.isRequesting = false;

        const errorContent = '⚠️ Impossible de créer la demande de technicien pour le moment. Réessayez plus tard.';
        this.messages.push({
          role: 'assistant',
          content: errorContent,
          formattedContent: this.formatMessageContent(errorContent)
        });
        this.scrollToBottom();
      }
    });
  }

  clearCurrentChatState() {
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
      this.chatSubscription = undefined;
    }
    this.messages = [];
    this.currentConversationId = undefined;
    this.currentConversation = undefined;
    this.newMessage = '';
    this.isTicketRequested = false;
    this.isRequesting = false;
    setTimeout(() => {
      if (this.textInput) {
        this.textInput.nativeElement.style.height = 'auto';
      }
    }, 0);
  }

  sendMessage() {
    if (!this.newMessage.trim() || this.isLoading) return;

    const userText = this.newMessage.trim();
    this.newMessage = '';

    this.messages.push({
      role: 'user',
      content: userText,
      formattedContent: this.formatMessageContent(userText)
    });
    this.scrollToBottom();

    setTimeout(() => {
      if (this.textInput) {
        this.textInput.nativeElement.style.height = 'auto';
      }
    }, 0);

    this.isLoading = true;

    this.chatSubscription = this.aiService.sendMessage(userText, this.currentConversationId).subscribe({
      next: (res) => {
        const isNew = !this.currentConversationId;
        if (isNew && res.data && res.data.conversationId) {
          this.currentConversationId = res.data.conversationId;
          this.router.navigate(['/employee/chat'], {
            queryParams: { id: this.currentConversationId },
            replaceUrl: true
          });
        }
        const aiMsg = res.data.aiMessage;
        this.messages.push({
          ...aiMsg,
          formattedContent: this.formatMessageContent(aiMsg.content)
        });
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        const errMsg = 'Désolé, une erreur est survenue lors de la communication avec le serveur IA.';
        this.messages.push({
          role: 'assistant',
          content: errMsg,
          formattedContent: this.formatMessageContent(errMsg)
        });
        this.scrollToBottom();
      }
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
      try {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      } catch (err) { }
    }, 100);
  }
}