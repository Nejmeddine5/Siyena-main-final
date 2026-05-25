import { Component, OnInit, inject, signal, computed, AfterViewInit, ElementRef, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TicketService } from '../../core/services/ticket.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  notificationService = inject(NotificationService);
  authService = inject(AuthService);
  ticketService = inject(TicketService);
  router = inject(Router);

  @ViewChild('statsChart') statsChartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  tickets = signal<any[]>([]);
  
  stats = computed(() => {
    const all = this.tickets();
    const userId = this.authService.currentUser()?._id;
    const myTickets = all.filter(t => t.assignedTechnician?._id === userId || t.assignedTechnician === userId);
    
    return {
      total: myTickets.length,
      todo: myTickets.filter(t => t.status === 'pending' || t.status === 'assigned').length,
      inProgress: myTickets.filter(t => t.status === 'in_progress').length,
      resolved: myTickets.filter(t => t.status === 'resolved').length
    };
  });

  constructor() {
    // Re-render chart when stats change
    effect(() => {
      const s = this.stats();
      if (this.chart) {
        this.updateChart(s);
      }
    });
  }

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user?.role === 'admin') {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    this.notificationService.loadNotifications();
    this.fetchTickets();
  }

  ngAfterViewInit() {
    this.initChart();
  }

  fetchTickets() {
    this.ticketService.getTickets().subscribe({
      next: (res) => this.tickets.set(res.data),
      error: (err) => console.error('Error fetching tickets for stats', err)
    });
  }

  initChart() {
    const ctx = this.statsChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['À Faire', 'En Cours', 'Terminés'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: ['#6366f1', '#f59e0b', '#10b981'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        cutout: '75%',
        plugins: {
          legend: { display: false }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
    
    // Initial update
    this.updateChart(this.stats());
  }

  updateChart(s: any) {
    if (!this.chart) return;
    this.chart.data.datasets[0].data = [s.todo, s.inProgress, s.resolved];
    this.chart.update();
  }

  logout() {
    this.authService.logout();
  }

  isDashboardRoot(): boolean {
    return this.router.url === '/dashboard';
  }
}



