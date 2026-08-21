import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { Category } from '../../models/subscription.model';
import { CategoryNamePipe } from '../../pipes/category-name.pipe';

const DEFAULT_COLORS = ['#35D0C6', '#F5B841', '#4ADE80', '#818CF8', '#38BDF8', '#FB7185', '#94A3B8'];

@Component({
  selector: 'app-category-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, CategoryNamePipe],
  templateUrl: './category-manager.component.html',
  styleUrl: './category-manager.component.css'
})
export class CategoryManagerComponent implements OnChanges {
  private categoryService = inject(CategoryService);
  private toastService = inject(ToastService);
  private confirmDialogService = inject(ConfirmDialogService);
  private translate = inject(TranslateService);

  @Input() open = false;
  @Output() closed = new EventEmitter<void>();
  // بيتبعت لما أي تغيير يحصل (إضافة/تعديل/حذف) عشان الداشبورد يحدّث قائمة التصنيفات عنده
  @Output() changed = new EventEmitter<void>();

  categories: Category[] = [];
  colors = DEFAULT_COLORS;

  editingId: number | null = null;
  formName = '';
  formColor = DEFAULT_COLORS[0];
  formIcon = '📁';

  ngOnChanges(): void {
    if (this.open) {
      this.loadCategories();
    }
  }

  private loadCategories(): void {
    this.categoryService.getAll().subscribe((categories) => {
      this.categories = categories;
    });
  }

  startAdd(): void {
    this.editingId = null;
    this.formName = '';
    this.formColor = DEFAULT_COLORS[0];
    this.formIcon = '📁';
  }

  startEdit(category: Category): void {
    this.editingId = category.id;
    this.formName = category.name;
    this.formColor = category.color;
    this.formIcon = category.icon;
  }

  save(): void {
    if (!this.formName.trim()) return;

    const dto = { name: this.formName.trim(), color: this.formColor, icon: this.formIcon || '📁' };

    if (this.editingId) {
      this.categoryService.update(this.editingId, dto).subscribe({
        next: () => {
          this.toastService.show('categories.updated');
          this.loadCategories();
          this.changed.emit();
          this.startAdd();
        },
        error: () => this.toastService.show('categories.saveError', 'error')
      });
    } else {
      this.categoryService.create(dto).subscribe({
        next: () => {
          this.toastService.show('categories.added');
          this.loadCategories();
          this.changed.emit();
          this.startAdd();
        },
        error: () => this.toastService.show('categories.saveError', 'error')
      });
    }
  }

  async delete(category: Category): Promise<void> {
    const message = this.translate.instant('categories.confirmDelete', { name: category.name });
    const confirmed = await this.confirmDialogService.confirm(message);
    if (!confirmed) return;

    this.categoryService.delete(category.id).subscribe({
      next: () => {
        this.toastService.show('categories.deleted');
        this.loadCategories();
        this.changed.emit();
        if (this.editingId === category.id) this.startAdd();
      },
      error: () => this.toastService.show('categories.deleteError', 'error')
    });
  }

  close(): void {
    this.closed.emit();
  }
}
