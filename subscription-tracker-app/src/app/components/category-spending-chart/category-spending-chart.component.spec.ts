import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { CategorySpendingChartComponent } from './category-spending-chart.component';
import { CategorySpending } from '../../models/subscription.model';
import { environment } from '../../../environments/environment';

describe('CategorySpendingChartComponent', () => {
  let component: CategorySpendingChartComponent;
  let fixture: ComponentFixture<CategorySpendingChartComponent>;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/analytics`;

  const fakeData: CategorySpending[] = [
    { categoryName: 'ترفيه', color: '#35D0C6', icon: '🎬', monthlyTotal: 300, subscriptionCount: 2 },
    { categoryName: 'عمل', color: '#818CF8', icon: '💼', monthlyTotal: 100, subscriptionCount: 1 }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategorySpendingChartComponent, HttpClientTestingModule, TranslateModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(CategorySpendingChartComponent);
    component = fixture.componentInstance;
    component.userId = 1;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('بيتعمله Create بنجاح، وبيحمّل بيانات الإنفاق حسب التصنيف', () => {
    httpMock.expectOne(`${baseUrl}/spending-by-category/1`).flush(fakeData);

    expect(component.total).toBe(400);
    expect(component.slices.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('النسب المئوية بتتحسب صح لكل شريحة', () => {
    httpMock.expectOne(`${baseUrl}/spending-by-category/1`).flush(fakeData);

    expect(component.slices[0].percentage).toBe(75);
    expect(component.slices[1].percentage).toBe(25);
  });

  it('total بيبقى 0 والنسب 0% لو مفيش بيانات خالص', () => {
    httpMock.expectOne(`${baseUrl}/spending-by-category/1`).flush([]);

    expect(component.total).toBe(0);
    expect(component.slices).toEqual([]);
  });

  it('ngOnChanges بيعيد تحميل البيانات', () => {
    httpMock.expectOne(`${baseUrl}/spending-by-category/1`).flush(fakeData);

    component.ngOnChanges();
    httpMock.expectOne(`${baseUrl}/spending-by-category/1`).flush([]);

    expect(component.total).toBe(0);
  });
});
