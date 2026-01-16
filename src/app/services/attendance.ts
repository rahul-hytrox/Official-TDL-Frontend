import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/attendance`;

  constructor(private http: HttpClient) { }

  getTodayAttendance(): Observable<any> {
    return this.http.get(`${this.apiUrl}/today`);
  }

  getAttendanceByDate(date: string): Observable<any> {
    const params = new HttpParams().set('date', date);
    return this.http.get(`${this.apiUrl}/by-date`, { params });
  }

  getAttendanceByDateRange(startDate: string, endDate: string, empProfileId: string): Observable<any> {
    let params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate)
      .set('emp_profile_id', empProfileId);
    return this.http.get(`${this.apiUrl}/date-range`, { params });
  }

  getAllAttendanceByDateRange(startDate: string, endDate: string): Observable<any> {
    let params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);
    return this.http.get(`${this.apiUrl}/all-date-range`, { params });
  }

  addLogin(data: { emp_profile_id: string, login_date: string, login_time: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-login`, data);
  }

  addLogoff(data: { emp_profile_id: string, logoff_date: string, logoff_time: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-logoff`, data);
  }

  markAbsent(data: { emp_profile_id: string, absent_date: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/mark-absent`, data);
  }
}
