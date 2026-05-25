import { Component, inject, signal, OnInit, computed, AfterViewInit, ElementRef, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { TicketService } from '../../../core/services/ticket.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  adminService = inject(AdminService);
  ticketService = inject(TicketService);
  
  userCount = signal<number>(0);
  tickets = signal<any[]>([]);

  @ViewChild('statsChart') statsChartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  stats = computed(() => {
    const all = this.tickets();
    return {
      total: all.length,
      todo: all.filter(t => t.status === 'pending' || t.status === 'assigned').length,
      inProgress: all.filter(t => t.status === 'in_progress').length,
      resolved: all.filter(t => t.status === 'resolved').length
    };
  });

  technicianStats = computed(() => {
    const all = this.tickets();
    const statsMap = new Map<string, { nom: string, inProgress: number, resolved: number, todo: number }>();

    all.forEach(ticket => {
      if (ticket.assignedTechnician && ticket.assignedTechnician._id) {
        const id = ticket.assignedTechnician._id;
        if (!statsMap.has(id)) {
          statsMap.set(id, { nom: ticket.assignedTechnician.nom || 'Inconnu', inProgress: 0, resolved: 0, todo: 0 });
        }
        const stat = statsMap.get(id)!;
        if (ticket.status === 'in_progress') stat.inProgress++;
        else if (ticket.status === 'resolved') stat.resolved++;
        else if (ticket.status === 'pending' || ticket.status === 'assigned') stat.todo++;
      }
    });

    return Array.from(statsMap.values()).sort((a, b) => b.resolved - a.resolved);
  });

  constructor() {
    effect(() => {
      const s = this.stats();
      if (this.chart) {
        this.updateChart(s);
      }
    });
  }

  ngOnInit() {
    this.adminService.getAllUsers().subscribe(res => {
      this.userCount.set(res.results);
    });
    this.fetchTickets();
  }

  fetchTickets() {
    this.ticketService.getTickets().subscribe({
      next: (res) => this.tickets.set(res.data),
      error: (err) => console.error('Error fetching tickets for admin stats', err)
    });
  }

  ngAfterViewInit() {
    this.initChart();
  }

  initChart() {
    const ctx = this.statsChartCanvas?.nativeElement.getContext('2d');
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
    
    this.updateChart(this.stats());
  }

  updateChart(s: any) {
    if (!this.chart) return;
    this.chart.data.datasets[0].data = [s.todo, s.inProgress, s.resolved];
    this.chart.update();
  }
}

