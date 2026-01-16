import { Routes } from '@angular/router';
import { TdlDashboard } from './components/tdl-dashboard/tdl-dashboard';
import { Login } from './components/login/login';
import { Profile } from './components/profile/profile';
import { Holidays } from './components/holidays/holidays';
import { Birthdays } from './components/birthdays/birthdays';
import { Attendance } from './components/attendance/attendance';
import { EmployeeAttendance } from './components/employee-attendance/employee-attendance';
import { EmployeeManagement } from './components/employee-management/employee-management';
import { EmployeeReportList } from './components/employee-report-list/employee-report-list';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: Login },
    { path: 'dashboard', component: TdlDashboard, canActivate: [authGuard] },
    { path: 'profile', component: Profile, canActivate: [authGuard] },
    { path: 'holidays', component: Holidays, canActivate: [authGuard] },
    { path: 'birthdays', component: Birthdays, canActivate: [authGuard] },
    { path: 'attendance', component: Attendance, canActivate: [authGuard] },
    { path: 'management/employees', component: EmployeeManagement, canActivate: [authGuard] },
    { path: 'management/attendance', component: EmployeeAttendance, canActivate: [authGuard] },
    { path: 'management/reports', component: EmployeeReportList, canActivate: [authGuard] },
    { path: 'leave-app-form', loadComponent: () => import('./components/leave-app-form/leave-app-form').then(m => m.LeaveAppForm), canActivate: [authGuard] },
    { path: 'leave-list', loadComponent: () => import('./components/leave-list/leave-list').then(m => m.LeaveList), canActivate: [authGuard] },
    { path: '**', redirectTo: 'login' }
];
