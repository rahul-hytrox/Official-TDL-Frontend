import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Employee {
  emp_profile_id: string;
  emp_first_name: string;
  emp_middle_name?: string;
  emp_last_name: string;
  emp_name?: string;
  emp_dob: string;
  emp_contact_number: string;
  emp_email_id: string;
  emp_designation: string;
  emp_join_date: string;
  emp_pan_number?: string;
  emp_adhar_number?: string;
  emp_role: 'administrator' | 'employee';
  is_active?: number | boolean;
  age?: number;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) { }

  getTodaysBirthdays(): Observable<any> {
    return this.http.get(`${this.apiUrl}/birthdays/today`);
  }

  getBirthdaysByMonth(month: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/birthdays`, { params: { month: month.toString() } });
  }

  getAllEmployees(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getEmployeeById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createEmployee(employeeData: any): Observable<any> {
    return this.http.post(this.apiUrl, employeeData);
  }

  updateEmployee(id: string, employeeData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, employeeData);
  }

  deleteEmployee(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
