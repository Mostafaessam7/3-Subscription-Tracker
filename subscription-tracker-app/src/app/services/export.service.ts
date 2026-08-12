import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Subscription } from '../models/subscription.model';
import { billingCycleKey } from '../utils/billing-cycle.util';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  // بيصدّر لملف CSV بيتفتح مباشرة في Excel - أبسط وأضمن طريقة من غير مكتبات .xlsx معقدة
  // (لو احتجت شكل .xlsx حقيقي بعدين، الخطوة الطبيعية هي مكتبة SheetJS بدل الـ CSV البسيط ده)
  exportToCsv(subscriptions: Subscription[], filename: string, translate: (key: string) => string): void {
    const headers = [
      translate('form.name'),
      translate('form.price'),
      translate('form.billingCycle'),
      translate('form.category'),
      translate('form.status'),
      translate('detail.nextRenewal')
    ];

    const rows = subscriptions.map((s) => [
      s.name,
      s.price.toString(),
      translate(billingCycleKey(s.billingCycle)),
      s.category?.name ?? translate('form.noCategory'),
      translate(this.statusKey(s.status)),
      s.nextRenewalDate.substring(0, 10)
    ]);

    // \uFEFF (BOM) في الأول عشان Excel يقرأ الحروف العربية صح من غير ما تتحول لرموز غريبة
    const csvContent = '\uFEFF' + [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `${filename}.csv`);
  }

  exportToPdf(subscriptions: Subscription[], filename: string, translate: (key: string) => string): void {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(filename, 14, 16);

    const headers = [[
      translate('form.name'),
      translate('form.price'),
      translate('form.billingCycle'),
      translate('form.category'),
      translate('form.status'),
      translate('detail.nextRenewal')
    ]];

    const rows = subscriptions.map((s) => [
      s.name,
      s.price.toString(),
      translate(billingCycleKey(s.billingCycle)),
      s.category?.name ?? translate('form.noCategory'),
      translate(this.statusKey(s.status)),
      s.nextRenewalDate.substring(0, 10)
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 22,
      styles: { fontSize: 9 }
    });

    doc.save(`${filename}.pdf`);
  }

  private statusKey(status: number): string {
    switch (status) {
      case 1: return 'status.expired';
      case 2: return 'status.cancelled';
      default: return 'status.active';
    }
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
