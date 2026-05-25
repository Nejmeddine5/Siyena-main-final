import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketService, Ticket } from '../../../core/services/ticket.service';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.css']
})
export class TicketsComponent implements OnInit {
  ticketService = inject(TicketService);
  socketService = inject(SocketService);
  authService = inject(AuthService);
  searchQuery = signal('');

  to_do: Ticket[] = []; // Merged pending + assigned
  in_progress: Ticket[] = [];
  resolved: Ticket[] = [];

  showCreateModal = signal(false);
  isAdmin = this.authService.currentUser()?.role === 'admin';

  // New ticket form
  newTicket = {
    title: '',
    description: '',
    priority: 'medium'
  };

  fakeError = signal<string | null>(null);

  technicians = signal<any[]>([]);
  showAssignModal = signal(false);
  selectedTicketId = signal<string | null>(null);

  // Resolution Report
  showReportModal = signal(false);
  resolutionReport = {
    problemDescription: '',
    actionTaken: ''
  };
  pendingDropData: any = null;

  // Details Modal
  showDetailsModal = signal(false);
  selectedTicket = signal<Ticket | null>(null);


  ngOnInit() {
    this.fetchTickets();
    if (this.isAdmin) {
      this.fetchTechnicians();
    }

    const currentUserId = this.authService.currentUser()?._id;

    this.socketService.listen('newTicket').subscribe((ticket: Ticket) => {
      if (this.isAdmin || ticket.assignedTechnician?._id === currentUserId || ticket.assignedTechnician === currentUserId) {
        this.pushTicketToColumn(ticket);
      }
    });

    this.socketService.listen('ticketUpdated').subscribe((ticket: Ticket) => {
      this.removeTicketFromAllColumns(ticket._id);
      if (this.isAdmin || ticket.assignedTechnician?._id === currentUserId || ticket.assignedTechnician === currentUserId) {
        this.pushTicketToColumn(ticket);
      }
    });

    this.socketService.listen('ticketDeleted').subscribe((data: any) => {
      this.removeTicketFromAllColumns(data._id);
      if (this.selectedTicket() && this.selectedTicket()?._id === data._id) {
        this.closeDetailsModal();
      }
    });
  }

  fetchTechnicians() {
    this.ticketService.getTechnicians().subscribe({
      next: (res) => {
        this.technicians.set(res.data.users.filter(u => u.role === 'technician' || u.role === 'admin'));
      },
      error: (err) => console.error('Failed to fetch technicians', err)
    });
  }

  canManageTicket(ticket: Ticket): boolean {
    if (this.isAdmin) return true;
    const userId = this.authService.currentUser()?._id;
    return ticket.assignedTechnician?._id === userId || ticket.assignedTechnician === userId;
  }


  fetchTickets() {
    this.ticketService.getTickets().subscribe({
      next: (res) => {
        this.clearColumns();
        res.data.forEach(ticket => this.pushTicketToColumn(ticket));
      },
      error: (err) => console.error('Failed to get tickets', err)
    });
  }

  clearColumns() {
    this.to_do = [];
    this.in_progress = [];
    this.resolved = [];
  }

  pushTicketToColumn(ticket: Ticket) {
    switch (ticket.status) {
      case 'pending':
      case 'assigned':
        this.to_do.push(ticket);
        break;
      case 'in_progress':
        this.in_progress.push(ticket);
        break;
      case 'resolved':
        this.resolved.push(ticket);
        break;
      default:
        this.to_do.push(ticket);
        break;
    }
  }

  removeTicketFromAllColumns(id: string) {
    this.to_do = this.to_do.filter(t => t._id !== id);
    this.in_progress = this.in_progress.filter(t => t._id !== id);
    this.resolved = this.resolved.filter(t => t._id !== id);
  }

  drop(event: CdkDragDrop<Ticket[]>) {
    const ticket = event.previousContainer.data[event.previousIndex];

    // Permission Check
    if (!this.canManageTicket(ticket)) {
      this.fakeError.set("Vous n'êtes pas assigné à ce ticket.");
      setTimeout(() => this.fakeError.set(null), 5000);
      return;
    }

    if (event.previousContainer === event.container) {

      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const ticket = event.previousContainer.data[event.previousIndex];
      const newStatusId = event.container.id;

      const htmlIdToStatus: { [key: string]: string } = {
        'list-to_do': 'pending', // We drop into To Do, it becomes pending (or assigned if logic allows, but pending is safe)
        'list-in_progress': 'in_progress',
        'list-resolved': 'resolved'
      };

      const status = htmlIdToStatus[newStatusId] || 'pending';

      if (status === 'resolved') {
        // Intercept resolution to show report modal
        this.pendingDropData = {
          ticket,
          previousContainer: event.previousContainer,
          container: event.container,
          previousIndex: event.previousIndex,
          currentIndex: event.currentIndex
        };
        this.openReportModal(ticket);
        return;
      }

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      this.ticketService.updateTicketStatus(ticket._id, status).subscribe({
        next: (res) => console.log('Status changed', res),
        error: (err) => {
          this.fakeError.set("Erreur lors de la mise à jour du statut !");
          setTimeout(() => this.fakeError.set(null), 5000);
          console.error('Change status failed', err);
        }
      });
    }
  }

  openCreateModal() {

    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  createTicket() {
    if (!this.newTicket.title) {
      this.triggerFakeError("Veuillez remplir le titre.");
      return;
    }

    // Mock API call or use real service if available
    // Assuming ticketService has a createTicket method
    const ticketData = {
      ...this.newTicket,
      status: 'pending'
    };

    this.ticketService.createTicket(ticketData).subscribe({
      next: (res) => {

        this.closeCreateModal();
        this.newTicket = { title: '', description: '', priority: 'medium' };
        // The list will update via socket if implemented, otherwise fetch again
        this.fetchTickets();
      },
      error: (err) => this.triggerFakeError("Impossible de créer le ticket.")
    });
  }
  openAssignModal(ticketId: string) {
    this.selectedTicketId.set(ticketId);
    this.showAssignModal.set(true);
  }

  closeAssignModal() {
    this.showAssignModal.set(false);
    this.selectedTicketId.set(null);
  }

  confirmAssignment(technicianId: string) {
    const ticketId = this.selectedTicketId();
    if (!ticketId) return;

    this.ticketService.assignTicket(ticketId, technicianId).subscribe({
      next: (res) => {
        this.closeAssignModal();
        this.fetchTickets();
      },
      error: (err) => {
        this.fakeError.set("Échec de l'assignation.");
        setTimeout(() => this.fakeError.set(null), 5000);
      }
    });
  }

  triggerFakeError(msg: string) {
    this.fakeError.set(msg);
    setTimeout(() => this.fakeError.set(null), 5000);
  }

  // Report Modal Methods
  openReportModal(ticket: Ticket) {
    this.selectedTicketId.set(ticket._id);
    this.resolutionReport = { problemDescription: '', actionTaken: '' };
    this.showReportModal.set(true);
  }

  closeReportModal() {
    this.showReportModal.set(false);
    this.pendingDropData = null;
  }

  submitResolutionReport() {
    if (!this.resolutionReport.problemDescription || !this.resolutionReport.actionTaken) {
      this.triggerFakeError("Veuillez remplir tous les champs du rapport.");
      return;
    }

    const { ticket } = this.pendingDropData;

    this.ticketService.updateTicketStatus(ticket._id, 'resolved', this.resolutionReport).subscribe({
      next: (res) => {
        // The response contains the updated ticket with the report
        const updatedTicket = res.data;
        
        // Remove from old location and add to resolved
        this.removeTicketFromAllColumns(ticket._id);
        this.pushTicketToColumn(updatedTicket);
        
        this.closeReportModal();
      },
      error: (err) => {
        this.triggerFakeError("Échec de la clôture du ticket.");
      }
    });
  }

  // Details Modal Methods
  openDetailsModal(ticket: Ticket) {
    this.selectedTicket.set(ticket);
    this.showDetailsModal.set(true);
  }

  closeDetailsModal() {
    this.showDetailsModal.set(false);
    this.selectedTicket.set(null);
  }

  deleteTicket(ticketId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer définitivement ce ticket ?')) {
      this.ticketService.deleteTicket(ticketId).subscribe({
        next: () => {
          this.removeTicketFromAllColumns(ticketId);
          if (this.selectedTicket() && this.selectedTicket()?._id === ticketId) {
            this.closeDetailsModal();
          }
        },
        error: (err) => {
          this.triggerFakeError("Impossible de supprimer le ticket.");
        }
      });
    }
  }

  matchesSearch(ticket: Ticket): boolean {
    if (!this.searchQuery()) return true;
    const s = this.searchQuery().toLowerCase();
    
    // Status translation map for better searching (optional but good for UX)
    const statusMap: { [key: string]: string } = {
      'pending': 'à faire pending',
      'assigned': 'assigné assigned',
      'in_progress': 'en cours progress',
      'resolved': 'résolu resolved'
    };
    const translatedStatus = statusMap[ticket.status] || ticket.status;

    return (
      ticket.ticketId?.toLowerCase().includes(s) ||
      ticket.issue?.toLowerCase().includes(s) ||
      ticket.assignedTechnician?.nom?.toLowerCase().includes(s) ||
      translatedStatus.toLowerCase().includes(s) ||
      ticket.priority?.toLowerCase().includes(s)
    );
  }
}


