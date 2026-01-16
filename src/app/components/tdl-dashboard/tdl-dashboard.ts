import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../sidebar/sidebar';
import { BreakTimeService } from '../../services/break-time';
import { AttendanceService } from '../../services/attendance';
import { HolidayService } from '../../services/holiday';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-tdl-dashboard',
  standalone: true,
  imports: [CommonModule, Sidebar, NgxEchartsDirective, RouterLink, FormsModule],
  providers: [
    provideEchartsCore({
      echarts: () => import('echarts'),
    }),
  ],
  templateUrl: './tdl-dashboard.html',
  styleUrl: './tdl-dashboard.css',
})
export class TdlDashboard implements OnInit, OnDestroy {
  user: any = null;
  userInitials: string = '';
  firstName: string = '';

  // Clock
  currentDate: string = '';
  currentTime: string = '';
  private timer: any;

  dailyActivity: any = null;
  activities: any[] = [];
  isLoadingActivity: boolean = true;

  // Report/Analytics
  showReport: boolean = false;
  isLoadingReport: boolean = false;

  pieOptions: any;
  lineOptions: any;

  monthlyStats: any = {
    present: 0,
    absent: 0,
    totalDays: 0,
    workingDays: 0,
    nonWorking: 0
  };

  selectedMonth: string = '';
  selectedYear: string = '';
  years: number[] = [];
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

  constructor(
    private authService: AuthService,
    private breakTimeService: BreakTimeService,
    private attendanceService: AttendanceService,
    private holidayService: HolidayService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.startClock();
    this.user = this.authService.getUser();
    if (!this.user) {
      this.router.navigate(['/login']);
    } else {
      this.userInitials = this.user.emp_name ? this.user.emp_name.substring(0, 2).toUpperCase() : '??';
      this.firstName = this.user.emp_name ? this.user.emp_name.split(' ')[0] : 'User';
      this.initializeAnalyticsDate();
      this.loadDailyActivity();
      this.loadAnalytics(); // Load analytics on start
    }
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  startClock() {
    this.updateClock();
    this.timer = setInterval(() => {
      this.updateClock();
    }, 1000);
  }

  updateClock() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    this.currentDate = `${day} ${month} ${year}`;

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, '0');
    this.currentTime = `${hoursStr}:${minutes}:${seconds} ${ampm}`;

    this.cdr.detectChanges();
  }

  initializeAnalyticsDate() {
    const now = new Date();
    this.selectedYear = now.getFullYear().toString();
    this.selectedMonth = (now.getMonth() + 1).toString().padStart(2, '0');

    // Generate years
    const currentYear = now.getFullYear();
    for (let i = currentYear - 2; i <= currentYear + 1; i++) {
      this.years.push(i);
    }
  }

  onFilterChange() {
    this.loadAnalytics();
  }

  // Reload data when manually triggered
  refreshData() {
    this.loadDailyActivity();
    this.loadAnalytics();
  }

  loadDailyActivity() {
    this.isLoadingActivity = true;
    const today = new Date().toISOString().split('T')[0];

    this.breakTimeService.getDailyActivity(this.user.emp_profile_id, today).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.dailyActivity = res.data;
          this.processActivities(res.data);
        } else {
          this.activities = [];
        }
        this.isLoadingActivity = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading daily activity:', err);
        this.isLoadingActivity = false;
        this.activities = [];
        this.cdr.detectChanges();
      }
    });
  }

  processActivities(data: any) {
    const list = [];
    if (data.attendance.login_time) {
      list.push({
        title: 'Shift Started',
        time: data.attendance.login_time,
        raw: data.attendance.raw_login,
        icon: '🚀',
        type: 'login'
      });
    }

    const addBreak = (breakObj: any, label: string, icon: string) => {
      if (breakObj.start && breakObj.raw_start !== '00:00:00') {
        list.push({
          title: `${label} Started`,
          time: breakObj.start,
          raw: breakObj.raw_start,
          duration: breakObj.duration,
          icon: icon,
          type: 'break-start'
        });
      }
      if (breakObj.end && breakObj.raw_end !== '00:00:00') {
        list.push({
          title: `${label} Ended`,
          time: breakObj.end,
          raw: breakObj.raw_end,
          icon: '✅',
          type: 'break-end'
        });
      }
    };

    addBreak(data.breaks.tea_break_1, 'Tea Break 1', '☕');
    addBreak(data.breaks.lunch_break, 'Lunch Break', '🍲');
    addBreak(data.breaks.tea_break_2, 'Tea Break 2', '☕');

    if (data.attendance.logoff_time) {
      list.push({
        title: 'Shift Ended',
        time: data.attendance.logoff_time,
        raw: data.attendance.raw_logoff,
        icon: '🏠',
        type: 'logoff'
      });
    }

    this.activities = list.sort((a, b) => b.raw.localeCompare(a.raw));
  }

  private formatDateKey(dateInput: any): string {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleReport() {
    this.showReport = !this.showReport;
    if (this.showReport) {
      this.loadAnalytics();
    }
  }

  loadAnalytics() {
    if (!this.selectedYear || !this.selectedMonth) return;

    this.isLoadingReport = true;
    // Clear old options to show fresh state
    this.pieOptions = null;
    this.lineOptions = null;
    this.cdr.detectChanges();

    const year = parseInt(this.selectedYear);
    const month = parseInt(this.selectedMonth);
    const firstDay = `${this.selectedYear}-${this.selectedMonth}-01`;
    const lastDayObs = new Date(year, month, 0);
    const lastDay = `${this.selectedYear}-${this.selectedMonth}-${String(lastDayObs.getDate()).padStart(2, '0')}`;

    forkJoin({
      attendance: this.attendanceService.getAttendanceByDateRange(firstDay, lastDay, this.user.emp_profile_id),
      breaks: this.breakTimeService.getEmployeeBreaksByDateRange(this.user.emp_profile_id, firstDay, lastDay),
      holidays: this.holidayService.getHolidaysByMonth(year, month)
    }).subscribe({
      next: (results) => {
        if (results.attendance && results.attendance.data && results.breaks && results.breaks.data) {
          this.processAnalyticsData(
            results.attendance.data,
            results.breaks.data,
            results.holidays.data || [],
            lastDayObs.getDate(),
            year,
            month - 1
          );
        } else {
          console.warn('Incomplete analytics data received');
          this.monthlyStats = { present: 0, absent: 0, totalDays: lastDayObs.getDate(), workingDays: 0, nonWorking: 0 };
        }
        this.isLoadingReport = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Analytics Fetch Error:', err);
        this.isLoadingReport = false;
        this.cdr.detectChanges();
      }
    });
  }

  processAnalyticsData(attendance: any[], breaks: any[], holidays: any[], daysInMonth: number, year: number, month: number) {
    const holidayDates = new Set(holidays.map((h: any) => this.formatDateKey(h.holiday_date)));
    let sundays = 0;
    const workingDaysDates = new Set();

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateKey = this.formatDateKey(date);
      const isSunday = date.getDay() === 0;
      const isHoliday = holidayDates.has(dateKey);

      if (isSunday) {
        sundays++;
      } else if (!isHoliday) {
        workingDaysDates.add(dateKey);
      }
    }

    const targetWorkingDays = workingDaysDates.size;
    const totalNonWorking = daysInMonth - targetWorkingDays;

    const presentDays = attendance.filter(a => {
      const dateKey = this.formatDateKey(a.emp_login_date);
      return a.emp_login_status === 1 && workingDaysDates.has(dateKey);
    }).length;

    const absentDays = attendance.filter(a => {
      const dateKey = this.formatDateKey(a.emp_login_date);
      return a.emp_login_status === 0 && workingDaysDates.has(dateKey);
    }).length;

    const remainingWorkingDays = Math.max(0, targetWorkingDays - (presentDays + absentDays));

    this.monthlyStats = {
      present: presentDays,
      absent: absentDays,
      totalDays: daysInMonth,
      workingDays: targetWorkingDays,
      nonWorking: totalNonWorking
    };

    const breakMap = new Map();
    breaks.forEach(b => {
      const dateKey = this.formatDateKey(b.emp_login_date);
      const tea1 = this.calcMin(b.emp_tea_break_1_start_time, b.emp_tea_break_1_end_time);
      const lunch = this.calcMin(b.emp_lunch_break_start_time, b.emp_lunch_break_end_time);
      const tea2 = this.calcMin(b.emp_tea_break_2_start_time, b.emp_tea_break_2_end_time);
      breakMap.set(dateKey, Number(((tea1 + lunch + tea2) / 60).toFixed(2)));
    });

    const workingDaysTrend = attendance
      .filter(a => workingDaysDates.has(this.formatDateKey(a.emp_login_date)))
      .map(a => ({ ...a, dateKey: this.formatDateKey(a.emp_login_date) }))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    const labels = workingDaysTrend.map(r => {
      const d = new Date(r.emp_login_date);
      return `${String(d.getDate()).padStart(2, '0')} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]}`;
    });

    const workData = workingDaysTrend.map(r => Number(r.working_hours) || 0);
    const breakData = workingDaysTrend.map(r => breakMap.get(r.dateKey) || 0);

    this.pieOptions = {
      tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
      legend: { bottom: '5%', left: 'center', textStyle: { color: '#94a3b8' } },
      series: [{
        name: 'Attendance', type: 'pie', radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#0f172a', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold', color: '#fff' } },
        data: [
          { value: presentDays, name: 'Present', itemStyle: { color: '#10b981' } },
          { value: absentDays, name: 'Absent', itemStyle: { color: '#ef4444' } },
          { value: remainingWorkingDays, name: 'Remaining', itemStyle: { color: '#334155' } },
          { value: totalNonWorking, name: 'Holidays', itemStyle: { color: '#6366f1' } }
        ]
      }]
    };

    this.lineOptions = {
      tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#fff' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#475569' } } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, axisLine: { lineStyle: { color: '#475569' } } },
      series: [
        {
          name: 'Worked (Hrs)', type: 'line', data: workData, smooth: true,
          symbolSize: 8, lineStyle: { width: 3 }, itemStyle: { color: '#3b82f6' },
          areaStyle: { color: 'rgba(59, 130, 246, 0.1)' }
        },
        {
          name: 'Breaks (Hrs)', type: 'line', data: breakData, smooth: true,
          symbolSize: 8, lineStyle: { width: 3 }, itemStyle: { color: '#fbbf24' },
          areaStyle: { color: 'rgba(251, 191, 36, 0.1)' }
        }
      ]
    };

    this.cdr.detectChanges();
  }

  private calcMin(start: string, end: string): number {
    if (!start || !end || start === '00:00:00' || end === '00:00:00') return 0;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    return (eH * 60 + eM) - (sH * 60 + sM);
  }
}
