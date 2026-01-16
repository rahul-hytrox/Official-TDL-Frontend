import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Holiday {
  id?: number;
  holiday_name: string;
  holiday_date: string;
  holiday_description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HolidayService {
  private apiUrl = `${environment.apiUrl}/holidays`;

  constructor(private http: HttpClient) { }

  getAllHolidays(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getHolidaysByYear(year: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/year`, { params: { year: year.toString() } });
  }

  getHolidaysByMonth(year: number, month: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/month`, {
      params: {
        year: year.toString(),
        month: month.toString()
      }
    });
  }

  addHoliday(holiday: Holiday): Observable<any> {
    return this.http.post(this.apiUrl, holiday);
  }

  updateHoliday(id: number, holiday: Holiday): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, holiday);
  }

  deleteHoliday(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
