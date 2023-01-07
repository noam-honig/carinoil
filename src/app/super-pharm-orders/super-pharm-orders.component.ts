import { Component, OnInit } from '@angular/core';
import { SuperPharmApiService } from '../services/super-pharm-services/super-pharm-api.service';

@Component({
  selector: 'app-super-pharm-orders',
  templateUrl: './super-pharm-orders.component.html',
  styleUrls: ['./super-pharm-orders.component.scss']
})
export class SuperPharmOrdersComponent implements OnInit {

  newdata:any;

  constructor(private api:SuperPharmApiService) { }

  ngOnInit(): void {
    this.api.getOrders().subscribe(data => {
      console.log(data);
      this.newdata = data;
    })
  }

}
