import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../sidebar/sidebar';
import { HolidayService, Holiday } from '../../services/holiday';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-holidays',
  standalone: true,
  imports: [Sidebar, DatePipe, FormsModule],
  templateUrl: './holidays.html',
  styleUrl: './holidays.css'
})
export class Holidays implements OnInit {
  holidays: Holiday[] = [];
  isLoading: boolean = true;
  isAdmin: boolean = false;

  // Filtering
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number | 'all' = 'all';
  years: number[] = [];
  months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  // Form handling
  isModalOpen: boolean = false;
  isEditMode: boolean = false;
  currentHoliday: Holiday = {
    holiday_name: '',
    holiday_date: '',
    holiday_description: ''
  };

  constructor(
    private holidayService: HolidayService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.generateYearList();
    this.loadHolidays();
  }

  generateYearList() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 2; i <= currentYear + 5; i++) {
      this.years.push(i);
    }
  }

  loadHolidays() {
    this.isLoading = true;

    let holidayObservable;
    if (this.selectedMonth === 'all') {
      holidayObservable = this.holidayService.getHolidaysByYear(this.selectedYear);
    } else {
      holidayObservable = this.holidayService.getHolidaysByMonth(this.selectedYear, this.selectedMonth as number);
    }

    holidayObservable.subscribe({
      next: (res) => {
        if (res.success) {
          this.holidays = res.data;
        } else {
          this.holidays = [];
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching holidays:', err);
        this.holidays = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFilterChange() {
    this.loadHolidays();
  }

  openAddModal() {
    this.isEditMode = false;
    this.currentHoliday = {
      holiday_name: '',
      holiday_date: '',
      holiday_description: ''
    };
    this.isModalOpen = true;
  }

  openEditModal(holiday: Holiday) {
    this.isEditMode = true;
    const date = new Date(holiday.holiday_date);
    const formattedDate = date.toISOString().split('T')[0];

    this.currentHoliday = { ...holiday, holiday_date: formattedDate };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  onSubmit() {
    if (this.isEditMode && this.currentHoliday.id) {
      this.holidayService.updateHoliday(this.currentHoliday.id, this.currentHoliday).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadHolidays();
            this.closeModal();
          }
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to update holiday');
        }
      });
    } else {
      this.holidayService.addHoliday(this.currentHoliday).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadHolidays();
            this.closeModal();
          }
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to add holiday');
        }
      });
    }
  }

  deleteHoliday(id: number) {
    if (confirm('Are you sure you want to delete this holiday?')) {
      this.holidayService.deleteHoliday(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadHolidays();
          }
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to delete holiday');
        }
      });
    }
  }
}
