import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, ChatMessage, Conversation } from '../../../core/services/ai.service';
import { AuthService } from '../../../core/services/auth.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
      </header>

      <!-- Messages Area -->
      <div #scrollContainer class="flex-1 overflow-y-auto px-4 py-6 sm:p-8 space-y-6 scroll-smooth relative z-10">
        
        <div class="max-w-3xl mx-auto w-full flex flex-col space-y-6">
          
          <!-- Empty State / Welcome Screen -->
          <div *ngIf="messages.length === 0" class="flex flex-col items-center justify-center min-h-[55vh] text-center space-y-6 py-8" @fadeSlideIn>
            <div class="w-12 h-12 bg-transparent overflow-hidden select-none">
              <img src="/media/siyana.png" alt="Siyana IA" class="w-full h-full object-contain">
            </div>
            
            <h3 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Comment puis-je vous aider aujourd'hui ?
            </h3>

            <!-- Quick Suggestions Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full mt-6 px-4">
              <button *ngFor="let prompt of quickPrompts" 
                      (click)="selectPrompt(prompt.text)"
                      class="flex flex-col p-4 text-left bg-white dark:bg-[#212121] hover:bg-[#f9f9f9] dark:hover:bg-[#2f2f2f] border border-gray-200 dark:border-[#424242] rounded-xl transition-all duration-200 group shadow-none">
                <div class="font-semibold text-gray-850 dark:text-gray-200 text-xs sm:text-sm">
                  {{ prompt.title }}
                </div>
                <div class="text-[11px] text-gray-400 dark:text-gray-500 mt-1 leading-normal font-normal">
                  {{ prompt.desc }}
                </div>
              </button>
            </div>
          </div>

          <!-- Message Bubbles list -->
          <ng-container *ngIf="messages.length > 0">
            <div *ngFor="let msg of messages; let last = last" 
                 class="flex w-full" 
                 [ngClass]="msg.role === 'user' ? 'justify-end' : 'justify-start'" 
                 @fadeSlideIn>
              
              <!-- Avatar IA -->
              <div *ngIf="msg.role === 'assistant'" class="w-8 h-8 shrink-0 mr-3 rounded-full bg-white dark:bg-[#2f2f2f] border border-gray-150 dark:border-[#424242] shadow-sm flex items-center justify-center mt-1 overflow-hidden p-0.5 select-none">
                <img src="/media/siyana.png" alt="Siyana IA" class="w-full h-full object-contain rounded-full">
              </div>

              <!-- Message Body -->
              <div [ngClass]="msg.role === 'user' 
                     ? 'max-w-[70%] rounded-[24px] px-5 py-3 text-sm sm:text-base leading-relaxed bg-[#f4f4f4] dark:bg-[#2f2f2f] text-gray-800 dark:text-gray-100 border-none shadow-none' 
                     : 'max-w-[85%] sm:max-w-[78%] text-sm sm:text-base leading-relaxed bg-transparent border-none shadow-none text-gray-800 dark:text-gray-100 px-0 py-1.5'">
                <div class="whitespace-pre-wrap select-text markdown-body" [innerHTML]="msg.formattedContent || msg.content"></div>
              </div>
            </div>
          </ng-container>

          <div *ngIf="currentConversationId && messages.length > 0" class="flex justify-center">
            <button *ngIf="!isTicketRequested"
                    (click)="requestTechnician()"
                    [disabled]="isRequesting"
                    class="rounded-full border border-white/20 bg-white/10 text-gray-800 dark:text-gray-100 text-xs font-semibold px-4 py-2 transition duration-200 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50">
              {{ isRequesting ? 'Envoi en cours...' : 'Demander un technicien' }}
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
          <div class="relative flex items-end bg-[#f4f4f4] dark:bg-[#2f2f2f] rounded-[26px] px-4 py-3 gap-3">

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
              (click)="sendMessage()" 
              [disabled]="isLoading || !newMessage.trim()"
              [attr.aria-label]="'Envoyer le message'"
              class="send-btn flex-shrink-0 self-end w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
              [class.send-btn--active]="!isLoading && newMessage.trim()"
              [class.send-btn--disabled]="isLoading || !newMessage.trim()"
            >
              <!-- Arrow up icon -->
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M8 13V3M8 3L3.5 7.5M8 3L12.5 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          
          <!-- Bottom Info / Version -->
          <div class="text-center mt-3 select-none">
            <span class="text-[9px] font-semibold tracking-wider text-gray-400 dark:text-gray-500 uppercase">Siyena AI Assistant v1.2 • Ollama Actif</span>
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

  quickPrompts = [
    {
      title: "Demande de Congé",
      desc: "Rédiger un email professionnel de demande de congé annuel.",
      text: "Rédige-moi un email formel pour demander des congés à mon responsable pour les deux premières semaines du mois prochain. Rends-le professionnel."
    },
    {
      title: "Rapport d'Intervention",
      desc: "Générer un exemple de rapport d'intervention technique standard.",
      text: "Génère un modèle de rapport de maintenance ou d'intervention technique pour Siyena, avec des champs pour les détails du problème, de la solution et des pièces changées."
    },
    {
      title: "Consignes de Sécurité",
      desc: "Expliquer les règles de sécurité dans un atelier technique.",
      text: "Quelles sont les 5 règles d'or de sécurité à respecter impérativement dans un environnement d'intervention technique ?"
    },
    {
      title: "Aide Siyena AI",
      desc: "Découvrir tout ce que l'assistant IA peut faire pour vous.",
      text: "Explique-moi en détail comment tu peux m'assister en tant qu'employé sur la plateforme SIYENA, et quelles sont tes fonctionnalités principales ?"
    }
  ];

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

    this.aiService.sendMessage(userText, this.currentConversationId).subscribe({
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
      } catch (err) {}
    }, 100);
  }
}