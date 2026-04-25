import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-share-watermark',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './share-watermark.component.html',
  styleUrls: ['./share-watermark.component.css'],
})
export class ShareWatermarkComponent {
  @Input() recipientEmail = '';
  @Input() senderName = '';
}
