import { Component, Input, OnChanges, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AnalyticsService } from '../../services/analytics.service';
import { CategorySpending } from '../../models/subscription.model';
import { CategoryNamePipe } from '../../pipes/category-name.pipe';

interface ChartSlice extends CategorySpending {
  percentage: number;
  dashArray: string;
  dashOffset: number;
}

@Component({
    selector: 'app-category-spending-chart',
    imports: [CommonModule, TranslateModule, CategoryNamePipe],
    templateUrl: './category-spending-chart.component.html',
    styleUrl: './category-spending-chart.component.css'
})
export class CategorySpendingChartComponent implements OnInit, OnChanges {
  private analyticsService = inject(AnalyticsService);

  @Input({ required: true }) userId!: number;
  // أي رقم بيتغيّر هنا (زي عداد بسيط) بيخلي الـ Chart يعيد تحميل بياناته
  @Input() refreshTrigger = 0;

  slices: ChartSlice[] = [];
  total = 0;
  loading = true;

  readonly radius = 70;
  readonly circumference = 2 * Math.PI * 70;

  ngOnInit(): void {
    this.load();
  }

  ngOnChanges(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.analyticsService.getSpendingByCategory(this.userId).subscribe((data) => {
      this.total = data.reduce((sum, d) => sum + d.monthlyTotal, 0);

      let cumulativePercentage = 0;
      this.slices = data.map((d) => {
        const percentage = this.total > 0 ? (d.monthlyTotal / this.total) * 100 : 0;
        const dashArray = `${(percentage / 100) * this.circumference} ${this.circumference}`;
        const dashOffset = -1 * (cumulativePercentage / 100) * this.circumference;
        cumulativePercentage += percentage;

        return { ...d, percentage, dashArray, dashOffset };
      });

      this.loading = false;
    });
  }
}
