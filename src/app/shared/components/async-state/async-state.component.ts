import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
@Component({
  selector: 'app-async-state',
  templateUrl: './async-state.component.html',
  styleUrl: './async-state.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsyncStateComponent {
  readonly state = input<'loading' | 'empty' | 'error'>('empty');
  readonly message = input.required<string>();
  readonly retry = output<void>();
}
