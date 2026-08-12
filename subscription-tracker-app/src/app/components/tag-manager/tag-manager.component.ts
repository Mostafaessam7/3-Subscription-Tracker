import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TagService } from '../../services/tag.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { Tag } from '../../models/subscription.model';

const DEFAULT_COLORS = ['#818CF8', '#35D0C6', '#F5B841', '#4ADE80', '#FB7185', '#38BDF8'];

@Component({
  selector: 'app-tag-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './tag-manager.component.html',
  styleUrl: './tag-manager.component.css'
})
export class TagManagerComponent implements OnChanges {
  private tagService = inject(TagService);
  private toastService = inject(ToastService);
  private confirmDialogService = inject(ConfirmDialogService);
  private translate = inject(TranslateService);

  @Input() open = false;
  @Output() closed = new EventEmitter<void>();
  @Output() changed = new EventEmitter<void>();

  tags: Tag[] = [];
  colors = DEFAULT_COLORS;

  editingId: number | null = null;
  formName = '';
  formColor = DEFAULT_COLORS[0];

  ngOnChanges(): void {
    if (this.open) {
      this.load();
    }
  }

  private load(): void {
    this.tagService.getAll().subscribe((tags) => (this.tags = tags));
  }

  startAdd(): void {
    this.editingId = null;
    this.formName = '';
    this.formColor = DEFAULT_COLORS[0];
  }

  startEdit(tag: Tag): void {
    this.editingId = tag.id;
    this.formName = tag.name;
    this.formColor = tag.color;
  }

  save(): void {
    if (!this.formName.trim()) return;
    const dto = { name: this.formName.trim(), color: this.formColor };

    const request$: Observable<Tag | void> = this.editingId
      ? this.tagService.update(this.editingId, dto)
      : this.tagService.create(dto);

    request$.subscribe({
      next: () => {
        this.toastService.show(this.editingId ? 'tags.updated' : 'tags.added');
        this.load();
        this.changed.emit();
        this.startAdd();
      },
      error: () => this.toastService.show('tags.saveError', 'error')
    });
  }

  async delete(tag: Tag): Promise<void> {
    const message = this.translate.instant('tags.confirmDelete', { name: tag.name });
    const confirmed = await this.confirmDialogService.confirm(message);
    if (!confirmed) return;

    this.tagService.delete(tag.id).subscribe({
      next: () => {
        this.toastService.show('tags.deleted');
        this.load();
        this.changed.emit();
        if (this.editingId === tag.id) this.startAdd();
      },
      error: () => this.toastService.show('tags.deleteError', 'error')
    });
  }

  close(): void {
    this.closed.emit();
  }
}
