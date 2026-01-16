import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../sidebar/sidebar';
import { EmployeeService, Employee } from '../../services/employee';

@Component({
  selector: 'app-birthdays',
  standalone: true,
  imports: [Sidebar, DatePipe, FormsModule],
  templateUrl: './birthdays.html',
  styleUrl: './birthdays.css'
})
export class Birthdays implements OnInit {
  todaysBirthdays: Employee[] = [];
  monthlyBirthdays: Employee[] = [];
  isLoadingToday: boolean = true;
  isLoadingMonthly: boolean = false;
  hasSearchedMonthly: boolean = false;

  selectedMonth: number = new Date().getMonth() + 1;
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

  constructor(
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadTodaysBirthdays();
    this.loadMonthlyBirthdays();
  }

  loadTodaysBirthdays() {
    this.isLoadingToday = true;
    this.employeeService.getTodaysBirthdays().subscribe({
      next: (res) => {
        if (res.success) {
          this.todaysBirthdays = res.data;
        }
        this.isLoadingToday = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching today\'s birthdays:', err);
        this.isLoadingToday = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadMonthlyBirthdays() {
    this.isLoadingMonthly = true;
    this.hasSearchedMonthly = true;
    this.employeeService.getBirthdaysByMonth(this.selectedMonth).subscribe({
      next: (res) => {
        if (res.success) {
          this.monthlyBirthdays = res.data;
        }
        this.isLoadingMonthly = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching monthly birthdays:', err);
        this.isLoadingMonthly = false;
        this.cdr.detectChanges();
      }
    });
  }

  onMonthChange() {
    this.loadMonthlyBirthdays();
  }
}
