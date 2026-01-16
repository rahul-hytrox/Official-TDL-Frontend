import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../sidebar/sidebar';
import { AttendanceService } from '../../services/attendance';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [Sidebar, CommonModule, FormsModule, DatePipe],
  templateUrl: './attendance.html',
  styleUrl: './attendance.css'
})
export class Attendance implements OnInit {
  // Tabs
  activeTab: 'my' | 'today' | 'daily' | 'range' = 'my';

  // Data
  todayStats: any = {
    present_count: 0,
    absent_count: 0,
    total_employees: 0
  };
  todayList: any[] = [];
  myAttendance: any[] = [];
  dailyAttendance: any[] = [];
  rangeAttendance: Record<string, any[]> = {};

  // Pagination for All History
  pagedRangeAttendance: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 5; // 5 days per page
  totalPages: number = 1;
  hasMore: boolean = false;
  hasPrev: boolean = false;
  allDates: string[] = [];

  // States
  isLoading: boolean = false;

  // Filters
  selectedDate: string = new Date().toISOString().split('T')[0];

  // Range filters
  rangeStart: string = '';
  rangeEnd: string = '';

  // My Attendance filters
  myStart: string = '';
  myEnd: string = '';

  currentUser: any = null;

  constructor(
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getUser();

    // Set default ranges (current month) in local time
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // First day of current month: YYYY-MM-01
    const firstDayStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;

    // Last day of current month
    const lastDay = new Date(year, month + 1, 0).getDate();
    const lastDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    this.myStart = firstDayStr;
    this.myEnd = lastDayStr;
    this.rangeStart = firstDayStr;
    this.rangeEnd = lastDayStr;

    this.loadActiveTab();
  }

  setTab(tab: 'my' | 'today' | 'daily' | 'range') {
    this.activeTab = tab;
    this.loadActiveTab();
  }

  loadActiveTab() {
    this.isLoading = true;
    this.cdr.detectChanges();

    switch (this.activeTab) {
      case 'today':
        this.loadTodayStatus();
        break;
      case 'my':
        this.loadMyAttendance();
        break;
      case 'daily':
        this.loadDailyReport();
        break;
      case 'range':
        this.loadRangeReport();
        break;
    }
  }

  loadTodayStatus() {
    this.attendanceService.getTodayAttendance().subscribe({
      next: (res) => {
        if (res.success) {
          this.todayList = res.data;
          let present = 0;
          let absent = 0;
          this.todayList.forEach(item => {
            if (item.emp_login_status === 1) present++;
            else if (item.emp_login_status === 0) absent++;
          });
          this.todayStats = {
            present_count: present,
            absent_count: absent,
            total_employees: res.count
          };
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading today stats:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadMyAttendance() {
    if (!this.currentUser) {
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    this.attendanceService.getAttendanceByDateRange(this.myStart, this.myEnd, this.currentUser.emp_profile_id).subscribe({
      next: (res) => {
        if (res.success) {
          this.myAttendance = res.data;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading my attendance:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadDailyReport() {
    this.attendanceService.getAttendanceByDate(this.selectedDate).subscribe({
      next: (res) => {
        if (res.success) {
          this.dailyAttendance = res.data;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading daily report:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadRangeReport() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.attendanceService.getAllAttendanceByDateRange(this.rangeStart, this.rangeEnd).subscribe({
      next: (res) => {
        if (res.success) {
          const groupedData = res.data;
          // Sort dates in descending order
          this.allDates = Object.keys(groupedData).sort((a, b) => b.localeCompare(a));
          this.totalPages = Math.ceil(this.allDates.length / this.itemsPerPage);
          this.currentPage = 1;
          this.rangeAttendance = groupedData; // Store the raw grouped data
          this.updatePagedData();
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading range report:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updatePagedData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const pagedDates = this.allDates.slice(startIndex, endIndex);

    const structuredData: any[] = [];
    pagedDates.forEach(date => {
      structuredData.push({ type: 'header', date: date });
      this.rangeAttendance[date].forEach((record: any) => {
        structuredData.push({ type: 'record', ...record });
      });
    });

    this.pagedRangeAttendance = structuredData;
    this.hasMore = this.currentPage < this.totalPages;
    this.hasPrev = this.currentPage > 1;
    this.cdr.detectChanges();
  }

  nextPage() {
    if (this.hasMore) {
      this.currentPage++;
      this.updatePagedData();
    }
  }

  prevPage() {
    if (this.hasPrev) {
      this.currentPage--;
      this.updatePagedData();
    }
  }
}
