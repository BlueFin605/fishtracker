import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-share-watermark',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './share-watermark.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./share-watermark.component.css'],
})
export class ShareWatermarkComponent {
  @Input() recipientEmail = '';
  @Input() senderName = '';
}
