import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../sidebar/sidebar';
import { EmployeeService } from '../../services/employee';
import { AttendanceService } from '../../services/attendance';
import { HolidayService } from '../../services/holiday';
import { LeaveService } from '../../services/leave';
import { BreakTimeService } from '../../services/break-time';
import { forkJoin } from 'rxjs';

interface EmployeeReport {
    sr_no: number;
    emp_profile_id: string;
    emp_name: string;
    total_days: number;
    present: number;
    pl: number;
    sl: number;
    lop: number;
    paid_days: number;
}

@Component({
    selector: 'app-employee-report-list',
    standalone: true,
    imports: [Sidebar, CommonModule, FormsModule],
    templateUrl: './employee-report-list.html',
    styleUrl: './employee-report-list.css'
})
export class EmployeeReportList implements OnInit {
    selectedMonth: string = '';
    selectedYear: string = '';
    reports: EmployeeReport[] = [];
    isLoading: boolean = false;
    hasSubmitted: boolean = false;
    noRecordsFound: boolean = false;
    currentHolidays: any[] = [];
    allLeaves: any[] = [];

    // For month picker
    years: number[] = [];
    // ... (months mapping remains the same)
    months = [
        { value: '01', label: 'January' },
        { value: '02', label: 'February' },
        { value: '03', label: 'March' },
        { value: '04', label: 'April' },
        { value: '05', label: 'May' },
        { value: '06', label: 'June' },
        { value: '07', label: 'July' },
        { value: '08', label: 'August' },
        { value: '09', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' }
    ];

    // Toast
    toast = {
        show: false,
        message: '',
        type: 'success'
    };

    constructor(
        private employeeService: EmployeeService,
        private attendanceService: AttendanceService,
        private holidayService: HolidayService,
        private leaveService: LeaveService,
        private breakTimeService: BreakTimeService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.initializeDate();
        this.generateYears();
    }

    // ... (initializeDate, generateYears, onMonthChange, onSubmit remain the same)
    initializeDate() {
        const now = new Date();
        this.selectedYear = now.getFullYear().toString();
        this.selectedMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    }

    generateYears() {
        const currentYear = new Date().getFullYear();
        for (let year = 2020; year <= currentYear + 1; year++) {
            this.years.push(year);
        }
    }

    onMonthChange() {
        this.hasSubmitted = false;
        this.noRecordsFound = false;
        this.reports = [];
    }

    onSubmit() {
        if (this.selectedMonth && this.selectedYear) {
            this.loadReports();
        }
    }

    loadReports() {
        if (!this.selectedMonth || !this.selectedYear) {
            return;
        }

        this.isLoading = true;
        this.hasSubmitted = true;
        this.noRecordsFound = false;
        this.reports = [];

        const yearMonth = `${this.selectedYear}-${this.selectedMonth}`;
        const year = parseInt(this.selectedYear);
        const month = parseInt(this.selectedMonth);

        // Fetch everything in parallel or sequence
        this.employeeService.getAllEmployees().subscribe({
            next: (empRes) => {
                if (empRes.success && empRes.data && empRes.data.length > 0) {
                    const employees = empRes.data;

                    forkJoin({
                        holidays: this.holidayService.getHolidaysByMonth(year, month),
                        leaves: this.leaveService.getAllLeaves(),
                        attendance: this.attendanceService.getAllAttendanceByDateRange(`${yearMonth}-01`, this.getLastDayOfMonth(yearMonth)),
                        breaks: this.breakTimeService.getAllBreaksByDateRange(`${yearMonth}-01`, this.getLastDayOfMonth(yearMonth))
                    }).subscribe({
                        next: (results) => {
                            this.currentHolidays = results.holidays.data || [];
                            this.allLeaves = results.leaves.data || [];
                            this.processReportData(employees, results.attendance.data, this.currentHolidays, this.allLeaves, results.breaks.data || {});
                            this.isLoading = false;
                            this.cdr.detectChanges();
                        },
                        error: () => this.isLoading = false
                    });
                } else {
                    this.noRecordsFound = true;
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            }
        });
    }

    processReportData(employees: any[], attendanceData: any, holidays: any[], leaves: any[], breaksData: any) {
        const year = parseInt(this.selectedYear);
        const month = parseInt(this.selectedMonth);
        const totalDays = this.getDaysInMonth(this.selectedYear, this.selectedMonth);

        // Normalize Attendance
        let flatAttendance: any[] = [];
        if (attendanceData && typeof attendanceData === 'object' && !Array.isArray(attendanceData)) {
            Object.values(attendanceData).forEach((records: any) => {
                if (Array.isArray(records)) flatAttendance = [...flatAttendance, ...records];
            });
        } else if (Array.isArray(attendanceData)) {
            flatAttendance = attendanceData;
        }

        // Normalize Breaks
        let flatBreaks: any[] = [];
        if (breaksData && typeof breaksData === 'object' && !Array.isArray(breaksData)) {
            Object.values(breaksData).forEach((records: any) => {
                if (Array.isArray(records)) flatBreaks = [...flatBreaks, ...records];
            });
        } else if (Array.isArray(breaksData)) {
            flatBreaks = breaksData;
        }

        this.reports = employees.sort((a, b) => a.emp_profile_id.localeCompare(b.emp_profile_id)).map((emp, index) => {
            const empId = emp.emp_profile_id;

            // 1. Manual Leaves from Application Form
            const empLeaves = leaves.filter(l =>
                l.emp_profile_id === empId &&
                l.status === 'Approved' &&
                new Date(l.start_date).getMonth() + 1 === month &&
                new Date(l.start_date).getFullYear() === year
            );

            const pl = this.calculateLeaveCount(empLeaves, 'Paid leave');
            const sl = this.calculateLeaveCount(empLeaves, 'Sick leave');
            const manualLop = this.calculateLeaveCount(empLeaves, 'LOP');

            // 2. Automated LOP from Attendance Rules
            const empAttendance = flatAttendance.filter(a => a.emp_profile_id === empId && a.emp_login_status === 1);
            let lateCount = 0;
            let autoLop = 0;

            empAttendance.forEach(att => {
                // Rule: Late Arrival after 09:11 AM
                if (att.emp_login_time && att.emp_login_time > '09:11:00') {
                    lateCount++;
                }

                // Rule: Working hours less than 4hrs excluding breaks
                if (att.emp_login_time && att.emp_logoff_time) {
                    const loginDate = att.emp_login_date.split('T')[0];
                    const dayBreaks = flatBreaks.find(b =>
                        b.emp_profile_id === empId &&
                        (b.emp_login_date === loginDate || (b.emp_login_date && b.emp_login_date.startsWith(loginDate)))
                    );

                    const grossHours = this.calculateHoursWorked(att.emp_login_time, att.emp_logoff_time);
                    const totalBreakHours = dayBreaks ? this.calculateTotalBreakHours(dayBreaks) : 0;
                    const netWork = grossHours - totalBreakHours;

                    if (netWork < 4) {
                        autoLop += 0.5;
                    }
                }
            });

            // 4th late arrival onwards = 0.5 LOP penalty per incidence
            const lateLop = Math.max(0, lateCount - 3) * 0.5;
            const totalLop = manualLop + lateLop + autoLop;

            const present = totalDays - (pl + sl + totalLop);
            const paid_days = totalDays - totalLop;

            return {
                sr_no: index + 1,
                emp_profile_id: empId,
                emp_name: `${emp.emp_first_name || ''} ${emp.emp_last_name || ''}`.trim(),
                total_days: totalDays,
                present: present,
                pl: pl,
                sl: sl,
                lop: totalLop,
                paid_days: paid_days
            };
        });

        if (this.reports.length === 0) this.noRecordsFound = true;
    }

    calculateTotalBreakHours(b: any): number {
        const t1 = b.emp_tea_break_1_start_time && b.emp_tea_break_1_end_time ? this.calculateHoursWorked(b.emp_tea_break_1_start_time, b.emp_tea_break_1_end_time) : 0;
        const lunch = b.emp_lunch_break_start_time && b.emp_lunch_break_end_time ? this.calculateHoursWorked(b.emp_lunch_break_start_time, b.emp_lunch_break_end_time) : 0;
        const t2 = b.emp_tea_break_2_start_time && b.emp_tea_break_2_end_time ? this.calculateHoursWorked(b.emp_tea_break_2_start_time, b.emp_tea_break_2_end_time) : 0;
        return (t1 || 0) + (lunch || 0) + (t2 || 0);
    }

    calculateLeaveCount(leaves: any[], type: string): number {
        return leaves
            .filter(l => l.leave_type === type)
            .reduce((total, l) => total + (l.leave_duration === 'Half Day' ? 0.5 : 1), 0);
    }

    calculateWorkingDays(year: number, month: number, holidays: any[]): number {
        const daysInMonth = new Date(year, month, 0).getDate();
        let workingDays = 0;

        // Create a set of holiday dates for quick lookup
        const holidayDates = new Set(
            holidays.map(h => {
                const date = new Date(h.holiday_date);
                return date.toISOString().split('T')[0];
            })
        );

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dayOfWeek = date.getDay();
            const dateStr = date.toISOString().split('T')[0];

            // Skip Saturdays (6) and Sundays (0)
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                continue;
            }

            // Skip holidays
            if (holidayDates.has(dateStr)) {
                continue;
            }

            workingDays++;
        }

        return workingDays;
    }

    calculateAttendanceDays(attendanceRecords: any[]): number {
        let totalDays = 0;

        console.log('Calculating attendance for records:', attendanceRecords);

        attendanceRecords.forEach(att => {
            // Only count if employee is present (emp_login_status = 1)
            if (att.emp_login_status === 1) {
                // Check if it's a full day or half day based on login/logoff times
                if (att.emp_login_time && att.emp_logoff_time) {
                    const hoursWorked = this.calculateHoursWorked(att.emp_login_time, att.emp_logoff_time);

                    console.log(`Login: ${att.emp_login_time}, Logoff: ${att.emp_logoff_time}, Hours: ${hoursWorked}`);

                    // If worked less than 4 hours, count as 0.5 day
                    // If worked 4-6 hours, count as 0.5 day (half day)
                    // If worked more than 6 hours, count as 1 full day
                    if (hoursWorked < 4) {
                        totalDays += 0.5;
                    } else if (hoursWorked >= 4 && hoursWorked < 6) {
                        totalDays += 0.5;
                    } else if (hoursWorked >= 6) {
                        totalDays += 1;
                    }
                } else if (att.emp_login_time && !att.emp_logoff_time) {
                    // Only login, no logoff - count as 0.5 day
                    totalDays += 0.5;
                } else {
                    // If no times but status is present, count as full day
                    totalDays += 1;
                }
            }
        });

        console.log('Total attendance days:', totalDays);
        return parseFloat(totalDays.toFixed(1));
    }

    calculateHoursWorked(loginTime: string, logoffTime: string): number {
        // Parse TIME format from MySQL (HH:MM:SS)
        const loginParts = loginTime.split(':');
        const logoffParts = logoffTime.split(':');

        const loginHours = parseInt(loginParts[0]);
        const loginMinutes = parseInt(loginParts[1]);
        const loginSeconds = parseInt(loginParts[2] || '0');

        const logoffHours = parseInt(logoffParts[0]);
        const logoffMinutes = parseInt(logoffParts[1]);
        const logoffSeconds = parseInt(logoffParts[2] || '0');

        // Convert to total minutes
        const loginTotalMinutes = (loginHours * 60) + loginMinutes + (loginSeconds / 60);
        const logoffTotalMinutes = (logoffHours * 60) + logoffMinutes + (logoffSeconds / 60);

        // Calculate difference in hours
        const hoursWorked = (logoffTotalMinutes - loginTotalMinutes) / 60;

        return hoursWorked;
    }

    parseTime(timeStr: string): number {
        // This function is no longer used but kept for compatibility
        const today = new Date().toISOString().split('T')[0];
        return new Date(`${today}T${timeStr}`).getTime();
    }

    getDaysInMonth(year: string, month: string): number {
        return new Date(parseInt(year), parseInt(month), 0).getDate();
    }

    getLastDayOfMonth(yearMonth: string): string {
        const [year, month] = yearMonth.split('-');
        const lastDay = this.getDaysInMonth(year, month);
        return `${yearMonth}-${lastDay.toString().padStart(2, '0')}`;
    }

    exportToPDF() {
        if (this.reports.length === 0) {
            this.showToast('No data to export', 'error');
            return;
        }

        // Create printable HTML content
        const monthName = this.getSelectedMonthName();
        const printContent = this.generatePrintableHTML(monthName);

        // Open print dialog
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();

            // Wait for content to load then print
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);

            this.showToast('Opening print dialog...', 'success');
        } else {
            this.showToast('Please allow popups to export PDF', 'error');
        }
    }

    generatePrintableHTML(monthName: string): string {
        const rows = this.reports.map(r => `
            <tr>
                <td style="text-align: center;">${r.sr_no}</td>
                <td style="white-space: nowrap;">${r.emp_profile_id}</td>
                <td>${r.emp_name}</td>
                <td style="text-align: center;">${r.total_days}</td>
                <td style="text-align: center;">${r.present}</td>
                <td style="text-align: center;">${r.pl}</td>
                <td style="text-align: center;">${r.sl}</td>
                <td style="text-align: center;">${r.lop}</td>
                <td style="text-align: center; font-weight: bold;">${r.paid_days}</td>
                <td style="width: 100px; height: 35px;"></td>
            </tr>
        `).join('');

        const holidayRows = this.currentHolidays.length > 0 ? this.currentHolidays.map(h => {
            const date = new Date(h.holiday_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            return `
                <tr>
                    <td style="text-align: center; width: 150px;">${date}</td>
                    <td>${h.holiday_name}</td>
                </tr>
            `;
        }).join('') : '<tr><td colspan="2" style="text-align: center; color: #718096; padding: 15px;">No holidays found for this month</td></tr>';

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Monthly Attendance Report - ${monthName} ${this.selectedYear}</title>
                <style>
                    @page { 
                        size: A4 landscape; 
                        margin: 10mm; 
                    }
                    body { 
                        font-family: 'Segoe UI', Arial, sans-serif; 
                        margin: 0; 
                        padding: 10px;
                        font-size: 9pt; 
                        color: #333;
                    }
                    .header-container {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #2563eb;
                        padding-bottom: 10px;
                    }
                    h1 { font-size: 18pt; margin: 0; color: #1e293b; }
                    h2 { font-size: 12pt; margin: 5px 0 0 0; color: #475569; }
                    
                    .section-title {
                        font-size: 11pt;
                        font-weight: 700;
                        margin: 20px 0 10px 0;
                        color: #1e293b;
                        border-bottom: 1px solid #e2e8f0;
                        padding-bottom: 5px;
                    }
                    table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 20px; }
                    th, td { border: 1px solid #cbd5e1; padding: 6px; word-wrap: break-word; }
                    th { background-color: #f1f5f9; color: #1e293b; font-weight: 600; text-transform: uppercase; font-size: 8pt; }
                    
                    .main-table th:nth-child(1) { width: 30px; }
                    .main-table th:nth-child(2) { width: 80px; }
                    .main-table th:nth-child(3) { width: auto; }
                    .main-table th:nth-child(4), 
                    .main-table th:nth-child(5),
                    .main-table th:nth-child(6),
                    .main-table th:nth-child(7),
                    .main-table th:nth-child(8),
                    .main-table th:nth-child(9) { width: 45px; }
                    .main-table th:nth-child(10) { width: 90px; }

                    tr:nth-child(even) { background-color: #f8fafc; }
                </style>
            </head>
            <body>
                <div class="header-container">
                    <h1>Monthly Attendance & Leave Report</h1>
                    <h2>${monthName} ${this.selectedYear}</h2>
                </div>

                <div class="section-title">📊 Employee Detailed Summary</div>
                <table class="main-table">
                    <thead>
                        <tr>
                            <th>Sr.</th>
                            <th>Emp ID</th>
                            <th>Employee Name</th>
                            <th>Total Days</th>
                            <th>Pres</th>
                            <th>PL</th>
                            <th>SL</th>
                            <th>LOP</th>
                            <th>Paid Days</th>
                            <th>Sign</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>

                <div class="section-title">📌 Monthly Holidays</div>
                <table class="holiday-table">
                    <thead>
                        <tr>
                            <th style="width: 150px;">Date</th>
                            <th>Holiday Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${holidayRows}
                    </tbody>
                </table>
            </body>
            </html>
        `;
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
        }, 3000);
    }

    getSelectedMonthName(): string {
        const month = this.months.find(m => m.value === this.selectedMonth);
        return month ? month.label : '';
    }
}
