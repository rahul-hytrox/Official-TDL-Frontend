import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LeaveRequest {
    fullName: string;
    emailId: string;
    employeeId: string;
    startDate: string;
    endDate: string;
    leaveType: string;
    leaveDuration: string;
    reason: string;
    reportingManager: string;
    department: string;
}

@Injectable({
    providedIn: 'root'
})
export class LeaveService {
    private apiUrl = `${environment.apiUrl}/leave`;
    private leaveCache: any[] | null = null;
    private lastFetchTime: number = 0;
    private readonly CACHE_DURATION = 30000; // 30 seconds

    constructor(private http: HttpClient) { }

    submitLeaveRequest(leaveData: LeaveRequest): Observable<any> {
        return this.http.post(`${this.apiUrl}/request`, leaveData).pipe(
            tap(() => this.leaveCache = null) // Clear cache on new request
        );
    }

    // Get employee's leave history (with basic caching)
    getEmployeeLeaves(empProfileId: string, forceRefresh = false): Observable<any> {
        const now = Date.now();
        if (!forceRefresh && this.leaveCache && (now - this.lastFetchTime < this.CACHE_DURATION)) {
            return of({ success: true, data: this.leaveCache });
        }

        return this.http.get(`${this.apiUrl}/employee/${empProfileId}`).pipe(
            tap((res: any) => {
                if (res.success) {
                    this.leaveCache = res.data;
                    this.lastFetchTime = Date.now();
                }
            })
        );
    }

    // Admin: Get all leave applications
    getAllLeaves(): Observable<any> {
        return this.http.get(`${this.apiUrl}/all`);
    }

    // Update leave status and type (Admin)
    updateLeaveStatus(id: number, status: string, leaveType?: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/status/${id}`, { status, leaveType }).pipe(
            tap(() => this.leaveCache = null) // Clear cache
        );
    }
}
