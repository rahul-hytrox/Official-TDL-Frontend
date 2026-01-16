import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { TitleCasePipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [Sidebar, TitleCasePipe, DatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  employee: any = null;
  isLoading: boolean = true;
  userInitials: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    const user = this.authService.getUser();
    if (!user || !user.emp_profile_id) {
      this.router.navigate(['/login']);
      return;
    }

    this.userInitials = user.emp_name ? user.emp_name.substring(0, 2).toUpperCase() : '??';

    this.authService.getEmployeeProfile(user.emp_profile_id).subscribe({
      next: (res) => {
        if (res.success) {
          this.employee = res.data;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching profile:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
