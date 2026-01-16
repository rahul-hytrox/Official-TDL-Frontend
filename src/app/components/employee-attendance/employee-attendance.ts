import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../sidebar/sidebar';
import { EmployeeService, Employee } from '../../services/employee';
import { AttendanceService } from '../../services/attendance';
import { BreakTimeService } from '../../services/break-time';

@Component({
    selector: 'app-employee-attendance',
    standalone: true,
    imports: [Sidebar, CommonModule, FormsModule],
    templateUrl: './employee-attendance.html',
    styleUrl: './employee-attendance.css'
})
export class EmployeeAttendance implements OnInit {
    activeSection: 'login' | 'lunch' | 'tea' = 'login';
    employees: Employee[] = [];
    isLoading: boolean = false;
    showModal: boolean = false;
    modalType: 'login' | 'logoff' | 'absent' | 'lunch' | 'tea1' | 'tea2' = 'login';
    selectedEmployee: Employee | null = null;
    attendanceStatusMap: Map<string, number> = new Map(); // empId -> status (1: Present, 0: Absent)

    // Form Data
    formData = {
        date: new Date().toISOString().split('T')[0],
        time: '',
        startTime: '',
        endTime: ''
    };

    // Toast
    toast = {
        show: false,
        message: '',
        type: 'success'
    };

    constructor(
        private employeeService: EmployeeService,
        private attendanceService: AttendanceService,
        private breakTimeService: BreakTimeService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadEmployees();
        this.loadAttendanceStatus();
    }

    loadEmployees() {
        this.isLoading = true;
        this.employeeService.getAllEmployees().subscribe({
            next: (res) => {
                if (res.success) {
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

    loadAttendanceStatus() {
        this.attendanceService.getAttendanceByDate(this.formData.date).subscribe({
            next: (res) => {
                if (res.success) {
                    this.attendanceStatusMap.clear();
                    res.data.forEach((item: any) => {
                        this.attendanceStatusMap.set(item.emp_profile_id, item.emp_login_status);
                    });
                }
                this.cdr.detectChanges();
            }
        });
    }

    setSection(section: 'login' | 'lunch' | 'tea') {
        this.activeSection = section;
        this.loadAttendanceStatus();
    }

    openModal(type: 'login' | 'logoff' | 'absent' | 'lunch' | 'tea1' | 'tea2', employee: Employee) {
        this.modalType = type;
        this.selectedEmployee = employee;
        this.showModal = true;

        // Reset form
        this.formData = {
            date: new Date().toISOString().split('T')[0],
            time: '',
            startTime: '',
            endTime: ''
        };
    }

    closeModal() {
        this.showModal = false;
        this.selectedEmployee = null;
    }

    submitAction() {
        if (!this.selectedEmployee) return;

        const empId = this.selectedEmployee.emp_profile_id;

        switch (this.modalType) {
            case 'login':
                this.attendanceService.addLogin({
                    emp_profile_id: empId,
                    login_date: this.formData.date,
                    login_time: this.formData.time
                }).subscribe(res => this.handleResponse(res));
                break;
            case 'logoff':
                this.attendanceService.addLogoff({
                    emp_profile_id: empId,
                    logoff_date: this.formData.date,
                    logoff_time: this.formData.time
                }).subscribe(res => this.handleResponse(res));
                break;
            case 'absent':
                // Mark as absent in both attendance and breaks
                const absentData = {
                    emp_profile_id: empId,
                    absent_date: this.formData.date
                };

                this.attendanceService.markAbsent(absentData).subscribe(() => {
                    this.breakTimeService.markAllBreaksAbsent(absentData).subscribe(res => this.handleResponse(res));
                });
                break;
            case 'lunch':
                this.breakTimeService.recordLunchBreak({
                    emp_profile_id: empId,
                    emp_login_date: this.formData.date,
                    start_time: this.formData.startTime,
                    end_time: this.formData.endTime
                }).subscribe(res => this.handleResponse(res));
                break;
            case 'tea1':
                this.breakTimeService.recordTeaBreak1({
                    emp_profile_id: empId,
                    emp_login_date: this.formData.date,
                    start_time: this.formData.startTime,
                    end_time: this.formData.endTime
                }).subscribe(res => this.handleResponse(res));
                break;
            case 'tea2':
                this.breakTimeService.recordTeaBreak2({
                    emp_profile_id: empId,
                    emp_login_date: this.formData.date,
                    start_time: this.formData.startTime,
                    end_time: this.formData.endTime
                }).subscribe(res => this.handleResponse(res));
                break;
        }
    }

    handleResponse(res: any) {
        if (res.success) {
            this.showToast(res.message || 'Action successful');
            this.loadAttendanceStatus();
            this.closeModal();
        } else {
            this.showToast(res.message || 'Something went wrong', 'error');
        }
    }

    isEmployeeAbsent(empProfileId: string): boolean {
        return this.attendanceStatusMap.get(empProfileId) === 0;
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

    getModalTitle(): string {
        switch (this.modalType) {
            case 'login': return 'Employee Login';
            case 'logoff': return 'Employee Logoff';
            case 'absent': return 'Mark Employee Absent';
            case 'lunch': return 'Lunch Break';
            case 'tea1': return 'Tea Break First';
            case 'tea2': return 'Tea Break Second';
            default: return '';
        }
    }
}
