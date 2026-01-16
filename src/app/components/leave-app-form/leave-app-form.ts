import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { AuthService } from '../../services/auth';
import { LeaveService } from '../../services/leave';

@Component({
    selector: 'app-leave-app-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, Sidebar],
    templateUrl: './leave-app-form.html',
    styleUrl: './leave-app-form.css'
})
export class LeaveAppForm implements OnInit {
    leaveForm!: FormGroup;
    user: any;
    isSubmitting = false;
    submitSuccess = false;
    isInitialLoading = false;

    leaveTypes = ['Sick leave', 'Paid leave', 'LOP', 'Optional holiday'];
    durations = ['Full Day', 'Half Day'];

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private leaveService: LeaveService,
        private router: Router
    ) {
        // Initialize with empty form immediately to satisfy Angular [formGroup] requirement
        this.createEmptyForm();
    }

    ngOnInit() {
        const currentUser = this.authService.getUser();
        if (!currentUser) {
            this.router.navigate(['/login']);
            return;
        }

        // 1. Initialize immediately with cached data so screen isn't empty
        this.user = currentUser;
        this.initForm();

        // 2. Fetch fresh profile data in background to ensure we have latest designation/email
        this.authService.getEmployeeProfile(currentUser.emp_profile_id).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.user = res.data;
                    this.updateProfileFields();
                }
            },
            error: (err) => {
                console.error('Error fetching fresh profile:', err);
            }
        });
    }

    updateProfileFields() {
        if (!this.leaveForm) return;

        const fullName = this.user.emp_first_name
            ? `${this.user.emp_first_name} ${this.user.emp_last_name || ''}`.trim()
            : (this.user.emp_name || 'N/A');

        const email = this.user.emp_email_id || this.user.emp_email || 'N/A';
        const designation = this.user.emp_designation || 'N/A';

        this.leaveForm.patchValue({
            fullName: fullName,
            emailId: email,
            department: designation
        });
    }

    createEmptyForm() {
        this.leaveForm = this.fb.group({
            fullName: [{ value: '', disabled: true }],
            emailId: [{ value: '', disabled: true }],
            employeeId: [{ value: '', disabled: true }],
            startDate: [''],
            endDate: [''],
            leaveType: [''],
            leaveDuration: ['Full Day'],
            reason: [''],
            reportingManager: [''],
            department: [{ value: '', disabled: true }]
        });
    }

    initForm() {
        // Construct full name from components or fallback to emp_name
        const fullName = this.user.emp_first_name
            ? `${this.user.emp_first_name} ${this.user.emp_last_name || ''}`.trim()
            : (this.user.emp_name || 'N/A');

        // Handles both old and new backend field names
        const email = this.user.emp_email_id || this.user.emp_email || 'N/A';
        const designation = this.user.emp_designation || 'N/A';

        this.leaveForm = this.fb.group({
            fullName: [{ value: fullName, disabled: true }, Validators.required],
            emailId: [{ value: email, disabled: true }, [Validators.required, Validators.email]],
            employeeId: [{ value: this.user.emp_profile_id, disabled: true }, Validators.required],
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],
            leaveType: ['', Validators.required],
            leaveDuration: ['Full Day', Validators.required],
            reason: ['', [Validators.required, Validators.minLength(10)]],
            reportingManager: ['', Validators.required],
            department: [{ value: designation, disabled: true }, Validators.required]
        });
    }

    onSubmit() {
        if (this.leaveForm.invalid) {
            this.markFormGroupTouched(this.leaveForm);
            return;
        }

        this.isSubmitting = true;
        const formData = this.leaveForm.getRawValue();

        this.leaveService.submitLeaveRequest(formData).subscribe({
            next: (res) => {
                if (res.success) {
                    this.submitSuccess = true;
                    // Redirect after 1 second as requested
                    setTimeout(() => {
                        this.router.navigate(['/dashboard']);
                    }, 1000);
                }
                this.isSubmitting = false;
            },
            error: (err) => {
                console.error('Error submitting leave request:', err);
                const errorMsg = err.error?.message || 'Failed to submit leave request. Please try again.';
                alert(errorMsg);
                this.isSubmitting = false;
            }
        });
    }

    private markFormGroupTouched(formGroup: FormGroup) {
        Object.values(formGroup.controls).forEach(control => {
            control.markAsTouched();
            if ((control as any).controls) {
                this.markFormGroupTouched(control as any);
            }
        });
    }

    goBack() {
        this.router.navigate(['/dashboard']);
    }
}
