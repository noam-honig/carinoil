import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SuperPharmApiService {

  constructor(private http:HttpClient) { }

  public getOrders(){
    const { SUPERPHARMSHOPKEY, SUPERPHARMSHOPURL } = process.env;
    return this.http.get(SUPERPHARMSHOPURL, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": SUPERPHARMSHOPKEY,
      },
    });
  }
}
