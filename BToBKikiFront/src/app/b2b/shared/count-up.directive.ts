import { Directive, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';

@Directive({
  selector: '[appCountUp]',
  standalone: true
})
export class CountUpDirective implements OnChanges, OnDestroy {
  @Input('appCountUp') targetValue: number | null | undefined = 0;
  @Input() countDuration = 650;
  @Input() countSuffix = '';
  @Input() countPrefix = '';

  private el = inject(ElementRef<HTMLElement>);
  private rafId: number | null = null;
  private currentDisplayed = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if ('targetValue' in changes) {
      this.animateTo(Number(this.targetValue ?? 0));
    }
  }

  ngOnDestroy(): void {
    if (this.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId);
    }
  }

  private animateTo(target: number): void {
    if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') {
      this.renderValue(target);
      return;
    }

    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || this.countDuration <= 0) {
      this.currentDisplayed = target;
      this.renderValue(target);
      return;
    }

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }

    const startVal = this.currentDisplayed;
    const delta = target - startVal;
    const startTime = performance.now();
    const duration = this.countDuration;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(startVal + delta * eased);
      this.currentDisplayed = val;
      this.renderValue(val);

      if (progress < 1) {
        this.rafId = requestAnimationFrame(step);
      } else {
        this.currentDisplayed = target;
        this.renderValue(target);
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(step);
  }

  private renderValue(val: number): void {
    const formatted = Math.round(val)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    this.el.nativeElement.textContent = `${this.countPrefix}${formatted}${this.countSuffix}`;
  }
}
