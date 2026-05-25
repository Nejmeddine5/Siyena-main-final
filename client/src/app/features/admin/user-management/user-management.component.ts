import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, User } from '../../../core/services/admin.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  host: {
    '(document:click)': 'closeDropdown()'
  }
})
export class UserManagementComponent implements OnInit {
  adminService = inject(AdminService);
  users = signal<User[]>([]);
  searchTerm = signal<string>('');
  isLoading = signal<boolean>(true);

  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.users();
    return this.users().filter(user => 
      user.nom.toLowerCase().includes(term) || 
      user.email.toLowerCase().includes(term)
    );
  });

  // Role selection state
  userChoosingRole = signal<User | null>(null);
  roles = ['admin', 'technician', 'employee'];

  // Modal State
  showDeleteModal = signal<boolean>(false);
  userToDelete = signal<User | null>(null);

  ngOnInit() { this.loadUsers(); }

  openRolePicker(user: User, event: Event) {
    event.stopPropagation();
    this.userChoosingRole.set(user);
  }

  closeRolePicker() {
    this.userChoosingRole.set(null);
  }

  loadUsers() {
    this.isLoading.set(true);
    this.adminService.getAllUsers().subscribe({
      next: (res) => { this.users.set(res.data.users); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  changeRole(user: User, newRole: string) {
    this.adminService.updateUserRole(user._id, newRole).subscribe({
      next: (res) => { this.users.update(prev => prev.map(u => u._id === user._id ? res.data.user : u)); }
    });
  }

  openDeleteModal(user: User) {
    this.userToDelete.set(user);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.userToDelete.set(null);
  }

  confirmDelete() {
    const user = this.userToDelete();
    if (!user) return;

    this.adminService.deleteUser(user._id).subscribe({
      next: () => {
        this.users.update(prev => prev.filter(u => u._id !== user._id));
        this.closeDeleteModal();
      }
    });
  }

  approveUser(user: User) {
    this.adminService.approveUser(user._id).subscribe({
      next: (res) => {
        this.users.update(prev => prev.map(u => u._id === user._id ? res.data.user : u));
      }
    });
  }

  rejectUser(user: User) {
    this.adminService.rejectUser(user._id).subscribe({
      next: () => {
        this.users.update(prev => prev.filter(u => u._id !== user._id));
      }
    });
  }
}
