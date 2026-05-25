import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketService, Alert } from '../../../core/services/ticket.service';
import { SocketService } from '../../../core/services/socket.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css']
})
export class AlertsComponent implements OnInit {
  alerts: Alert[] = [];
  ticketService = inject(TicketService);
  socketService = inject(SocketService);

  ngOnInit(): void {
    this.fetchAlerts();

    this.socketService.listen('newAlert').subscribe((alert: Alert) => {
      this.alerts.unshift(alert);
    });

    this.socketService.listen('alertUpdated').subscribe((updatedAlert: Alert) => {
      const idx = this.alerts.findIndex(a => a._id === updatedAlert._id);
      if (idx !== -1) {
        this.alerts[idx] = updatedAlert;
      }
    });
  }

  fetchAlerts() {
    this.ticketService.getAlerts().subscribe({
      next: (res) => {
        this.alerts = res.data;
      },
      error: (err) => console.error('Failed to get alerts', err)
    });
  }

  createTicket(alertId: string) {
    this.ticketService.createTicket(alertId).subscribe({
      next: (res) => {
        // Will also receive socket event 'alertUpdated'
        console.log('Ticket created', res);
      },
      error: (err) => console.error('Error creating ticket', err)
    });
  }
}
