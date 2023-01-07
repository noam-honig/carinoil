import { TestBed } from '@angular/core/testing';

import { SuperPharmApiService } from './super-pharm-api.service';

describe('SuperPharmApiService', () => {
  let service: SuperPharmApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SuperPharmApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
