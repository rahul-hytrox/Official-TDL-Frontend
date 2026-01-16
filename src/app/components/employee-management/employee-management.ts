import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../sidebar/sidebar';
import { EmployeeService, Employee } from '../../services/employee';

@Component({
    selector: 'app-employee-management',
    standalone: true,
    imports: [Sidebar, CommonModule, FormsModule, TitleCasePipe],
    templateUrl: './employee-management.html',
    styleUrl: './employee-management.css'
})
export class EmployeeManagement implements OnInit {
    employees: Employee[] = [];
    isLoading: boolean = false;
    showModal: boolean = false;
    modalMode: 'add' | 'edit' = 'add';

    // Form Data
    formData: any = {
        emp_profile_id: '',
        emp_first_name: '',
        emp_middle_name: '',
        emp_last_name: '',
        emp_dob: '',
        emp_contact_number: '',
        emp_email_id: '',
        emp_designation: '',
        emp_join_date: '',
        emp_pan_number: '',
        emp_adhar_number: '',
        emp_password: '',
        emp_role: 'employee',
        is_active: 1
    };

    // Toast
    toast = {
        show: false,
        message: '',
        type: 'success'
    };

    constructor(
        private employeeService: EmployeeService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadEmployees();
    }

    loadEmployees() {
        this.isLoading = true;
        this.employeeService.getAllEmployees().subscribe({
            next: (res) => {
                if (res.success) {
                    // Filter is_active status 1 (though backend already filters)
                    this.employees = res.data.filter((e: any) => e.is_active === 1 || e.is_active === true || e.is_active === undefined);
                    // Actually, looking at backend, it returns only is_active = TRUE rows.
                    this.employees = res.data;
                }
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error loading employees:', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    openAddModal() {
        this.modalMode = 'add';
        this.resetForm();
        this.showModal = true;
    }

    openEditModal(employee: any) {
        this.modalMode = 'edit';
        this.isLoading = true;
        this.employeeService.getEmployeeById(employee.emp_profile_id).subscribe({
            next: (res) => {
                if (res.success) {
                    const data = res.data;
                    // Format dates for input[type="date"]
                    if (data.emp_dob) data.emp_dob = new Date(data.emp_dob).toISOString().split('T')[0];
                    if (data.emp_join_date) data.emp_join_date = new Date(data.emp_join_date).toISOString().split('T')[0];

                    this.formData = { ...data, emp_password: '' }; // Don't show password
                    this.showModal = true;
                }
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.showToast('Error fetching employee details', 'error');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    closeModal() {
        this.showModal = false;
        this.resetForm();
    }

    resetForm() {
        this.formData = {
            emp_profile_id: '',
            emp_first_name: '',
            emp_middle_name: '',
            emp_last_name: '',
            emp_dob: '',
            emp_contact_number: '',
            emp_email_id: '',
            emp_designation: '',
            emp_join_date: '',
            emp_pan_number: '',
            emp_adhar_number: '',
            emp_password: '',
            emp_role: 'employee',
            is_active: 1
        };
    }

    submitForm() {
        if (this.modalMode === 'add') {
            this.employeeService.createEmployee(this.formData).subscribe({
                next: (res) => {
                    if (res.success) {
                        this.showToast('Employee added successfully');
                        this.loadEmployees();
                        this.closeModal();
                    }
                },
                error: (err) => {
                    this.showToast(err.error?.message || 'Error adding employee', 'error');
                }
            });
        } else {
            // For update, we might not want to send empty password
            const updateData = { ...this.formData };
            if (!updateData.emp_password) delete updateData.emp_password;

            this.employeeService.updateEmployee(this.formData.emp_profile_id, updateData).subscribe({
                next: (res) => {
                    if (res.success) {
                        this.showToast('Employee updated successfully');
                        this.loadEmployees();
                        this.closeModal();
                    }
                },
                error: (err) => {
                    this.showToast(err.error?.message || 'Error updating employee', 'error');
                }
            });
        }
    }

    deleteEmployee(id: string) {
        if (confirm('Are you sure you want to delete this employee?')) {
            this.employeeService.deleteEmployee(id).subscribe({
                next: (res) => {
                    if (res.success) {
                        this.showToast('Employee deleted successfully');
                        this.loadEmployees();
                    }
                },
                error: (err) => {
                    this.showToast('Error deleting employee', 'error');
                }
            });
        }
    }

    showToast(message: string, type: string = 'success') {
        this.toast = {
            show: true,
            message: message,
            type: type
        };
        this.cdr.detectChanges();
        setTimeout(() => {
            this.toast.show = false;
            this.cdr.detectChanges();
        }, 2500);
    }
}
