import { Injectable, signal, OnDestroy, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScreensizeService implements OnDestroy {
  private resizeObserver: ResizeObserver | null = null;
  
  screenSize = signal({
    width: window.innerWidth,
    height: window.innerHeight
  });
  // Computed properties for responsive design
  readonly isMobile = computed(() => this.screenSize().width < 768);
  readonly isTablet = computed(() =>
    this.screenSize().width >= 768 &&
    this.screenSize().width < 1024
  );
  readonly isDesktop = computed(() => this.screenSize().width >= 1024);

  constructor() {
    this.initResizeObserver();
  }

  private initResizeObserver() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.updateScreenSize);
      this.resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          this.screenSize.set({
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
        }
      });
      this.resizeObserver.observe(document.body);
    }
  }
  private updateScreenSize = () => {
    this.screenSize.set({
      width: window.innerWidth,
      height: window.innerHeight
    });
  };
  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.updateScreenSize);
    }
  }
}
