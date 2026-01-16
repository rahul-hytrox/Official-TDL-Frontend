import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../sidebar/sidebar';
import { AuthService } from '../../services/auth';
import { LeaveService } from '../../services/leave';
import { ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
    selector: 'app-leave-list',
    standalone: true,
    imports: [CommonModule, Sidebar, RouterLink, FormsModule],
    templateUrl: './leave-list.html',
    styleUrl: './leave-list.css'
})
export class LeaveList implements OnInit {
    user: any;
    leaves: any[] = [];
    isLoading = true;
    error: string | null = null;
    successMsg: string | null = null;

    // Modal / Details
    selectedLeave: any = null;
    showModal = false;
    isUpdating = false;

    // Editable fields for Admin
    editStatus: string = '';
    editType: string = '';

    leaveTypes = ['Sick leave', 'Paid leave', 'LOP', 'Optional holiday'];

    constructor(
        private authService: AuthService,
        private leaveService: LeaveService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.user = this.authService.getUser();
        if (!this.user) {
            this.router.navigate(['/login']);
            return;
        }

        this.loadLeaves();
    }

    isAdmin(): boolean {
        return this.authService.isAdmin();
    }

    loadLeaves() {
        this.isLoading = true;
        this.error = null;

        const request = this.isAdmin()
            ? this.leaveService.getAllLeaves()
            : this.leaveService.getEmployeeLeaves(this.user.emp_profile_id);

        request.subscribe({
            next: (res) => {
                if (res.success) {
                    this.leaves = res.data;
                    this.error = null;
                } else {
                    this.error = res.message || 'Failed to load leave applications';
                }
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error loading leaves:', err);
                this.error = 'Unable to connect to server.';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    openDetails(leave: any) {
        this.selectedLeave = { ...leave };
        this.editStatus = leave.status;
        this.editType = leave.leave_type;
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.selectedLeave = null;
    }

    updateLeave() {
        if (!this.selectedLeave) return;

        this.isUpdating = true;
        this.leaveService.updateLeaveStatus(this.selectedLeave.id, this.editStatus, this.editType).subscribe({
            next: (res) => {
                if (res.success) {
                    this.successMsg = 'Leave application updated successfully';
                    this.loadLeaves();
                    this.closeModal();
                    setTimeout(() => this.successMsg = null, 3000);
                } else {
                    alert(res.message || 'Update failed');
                }
                this.isUpdating = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Update error:', err);
                alert('An error occurred during update');
                this.isUpdating = false;
                this.cdr.detectChanges();
            }
        });
    }

    formatDateRange(start: string, end: string): string {
        const d1 = new Date(start).toLocaleDateString();
        const d2 = new Date(end).toLocaleDateString();
        return d1 === d2 ? d1 : `${d1} - ${d2}`;
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'Approved': return 'status-approved';
            case 'Rejected': return 'status-rejected';
            default: return 'status-pending';
        }
    }

    goBack() {
        this.router.navigate(['/dashboard']);
    }
}
