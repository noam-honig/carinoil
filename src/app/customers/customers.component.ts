import { Component, OnInit } from '@angular/core';
import { GridSettings } from '@remult/angular';
import { Remult } from 'remult';
import { Customer } from './customer';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit {

  constructor(private remult: Remult) { }
  customers = new GridSettings(this.remult.repo(Customer), {
    allowCrud: true,
    allowDelete: false
  });
  ngOnInit(): void {
  }

}
