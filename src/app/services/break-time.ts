import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BreakTimeService {
  private apiUrl = `${environment.apiUrl}/breaks`;

  constructor(private http: HttpClient) { }

  getDailyActivity(empProfileId: string, date: string): Observable<any> {
    const params = new HttpParams()
      .set('emp_profile_id', empProfileId)
      .set('date', date);
    return this.http.get(`${this.apiUrl}/daily-activity`, { params });
  }

  recordTeaBreak1(data: { emp_profile_id: string, emp_login_date: string, start_time: string, end_time: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/tea-break-1`, data);
  }

  recordTeaBreak2(data: { emp_profile_id: string, emp_login_date: string, start_time: string, end_time: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/tea-break-2`, data);
  }

  recordLunchBreak(data: { emp_profile_id: string, emp_login_date: string, start_time: string, end_time: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/lunch-break`, data);
  }

  markAllBreaksAbsent(data: { emp_profile_id: string, absent_date: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/mark-all-absent`, data);
  }

  getEmployeeBreaksByDateRange(empProfileId: string, startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('emp_profile_id', empProfileId)
      .set('start_date', startDate)
      .set('end_date', endDate);
    return this.http.get(`${this.apiUrl}/employee`, { params });
  }

  getAllBreaksByDateRange(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);
    return this.http.get(`${this.apiUrl}/all`, { params });
  }
}
