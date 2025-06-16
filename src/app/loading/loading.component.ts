import { Component, OnInit, AfterViewInit, OnDestroy, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { gsap } from 'gsap';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  imports: [CommonModule],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.css'
})
export class LoadingComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() text: string = 'LOADING';
  @Input() autoStart: boolean = true;
  @Input() duration: number = 10000; // ms
  @Input() primaryColor: string = '#ff6b6b';
  @Input() isVisible: boolean = true;
  
  @Output() progressChange = new EventEmitter<number>();
  @Output() complete = new EventEmitter<void>();

  @ViewChild('loaderContainer', { static: false }) loaderContainer!: ElementRef;
  @ViewChild('karaokeText', { static: false }) karaokeText!: ElementRef;
  @ViewChild('svgFill', { static: false }) svgFill!: ElementRef;

  currentProgress: number = 0;
  isAnimating: boolean = false;

  private animationFrameId?: number;

  constructor() {}

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (!this.svgFill?.nativeElement) {
        console.warn('svgFill element not found! Check HTML template.');
      }
      if (!this.karaokeText?.nativeElement) {
        console.warn('karaokeText element not found! Check HTML template.');
      }

      if (this.autoStart) {
        this.startAnimation();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  public startAnimation(): void {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    this.currentProgress = 0;
  
    this.startProgressAnimation();
  }

  public stopAnimation(): void {
    this.isAnimating = false;
    this.cleanup();
  }

  private startProgressAnimation(): void {
    const startTime = Date.now();
    const animate = () => {
      if (!this.isAnimating) return;

      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / this.duration) * 100, 100);
      
      this.updateProgress(progress);
      
      if (progress < 100) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.completeAnimation();
      }

      // if (progress > 50 && progress < 65) {
      //   gsap.to('.karaoke-text', {
      //     scale: 1.1,
      //     duration: 0.3,
      //     yoyo: true,
      //     repeat: 3,
      //     ease: 'power2.inOut',
      //   });
      // }
    };
    
    animate();
  }

  private updateProgress(progress: number): void {
    const roundedProgress = Math.floor(progress);
    
    if (roundedProgress !== this.currentProgress) {
      this.currentProgress = roundedProgress;
      
      // Update heart fill (clip-path y position)
      if (this.svgFill?.nativeElement) {
        gsap.to(this.svgFill.nativeElement, {
          attr: { y: 100 - progress },
          duration: 0.3,
          ease: 'power2.out',
        });
      }

      // Update text fill
      if (this.karaokeText?.nativeElement) {
        gsap.to(this.karaokeText.nativeElement, {
          '--fill-width': progress + '%',
          duration: 0.3,
          ease: 'power2.out',
        });
      }
      
      this.progressChange.emit(progress);
    }
  }

  private completeAnimation(): void {
    this.isAnimating = false;
  //   gsap.to(this.svgFill.nativeElement, {
  //   attr: {y: '+=5'},
  //   yoyo: true,
  //   repeat: 3,
  //   duration: 0.2,
  //   ease: 'sine.inOut'
  // });
  this.fadeOut();
    
    this.fadeOut();
  }

  private fadeOut(): void {
    gsap.to(this.loaderContainer.nativeElement, {
      scale: 0.8,
      opacity: 0,
      duration: 1,
      ease: 'power2.out',
      onComplete: () => {
        this.isVisible = false;
        this.complete.emit();
      }
    });
  }

  private cleanup(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  public setText(newText: string): void {
    this.text = newText;
  }

  public setProgress(progress: number): void {
    this.updateProgress(Math.max(0, Math.min(100, progress)));
  }
}