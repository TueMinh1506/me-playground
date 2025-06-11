import {
  AfterViewInit,
  Component,
  ElementRef,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
  OnDestroy,
  signal,
  DestroyRef, ChangeDetectorRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { ChartComponent } from '../chart/chart.component';
import { ScreensizeService } from '../screensize.service';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../data.service';
interface DragItemPosition {
  itemId: string;
  placeholderId: string;
}
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface DragAnimationConfig {
  onPress: {
    scale: number;
    rotation: { min: number; max: number };
    duration: number;
  };
  onDrag: {
    highlightScale: number;
    placeholderScale: number;
    highlightColor: string;
    duration: number;
  };
  onRelease: {
    duration: number;
    successScale: number;
    successColor: string;
  };
}
interface PlaceholderObject {
  [key: string]: string;
}


const ANIMATION_CONFIG: DragAnimationConfig = {
  onPress: {
    scale: 1.3,
    rotation: { min: -1, max: 1 },
    duration: 0.1
  },
  onDrag: {
    highlightScale: 1.6,
    placeholderScale: 1.2,
    highlightColor: "#5eff5e",
    duration: 0.2
  },
  onRelease: {
    duration: 0.2,
    successScale: 1,
    successColor: "#5eff5e"
  }
};

const HIT_TEST_THRESHOLD = {
  DRAG: '90%',
  RELEASE: '20%'
} as const;

const DEFAULT_COLORS = {
  NORMAL: "#87928b",
  SUCCESS: "#5eff5e"
} as const;

@Component({
  selector: 'app-playground',
  imports: [ChartComponent, MatIconModule, CommonModule],
  templateUrl: './playground.component.html',
  styleUrl: './playground.component.css'
})
export class PlaygroundComponent implements AfterViewInit, OnDestroy {
  // ViewChild references
  @ViewChild('imgGroup', { static: false }) imgGroup!: ElementRef<HTMLDivElement>;
  @ViewChild('placeAble', { static: false }) placeAble!: ElementRef<HTMLDivElement>;
  @ViewChildren('dragItem') dragItems!: QueryList<ElementRef<HTMLDivElement>>;
  @ViewChildren('placeholder') placeholders!: QueryList<ElementRef<HTMLDivElement>>;
  @ViewChild('instructionText', { static: false }) instructionText!: ElementRef<HTMLDivElement>;

  items = [
    {
      id: 1,
      name: "item-1",
      svgIcon: `<svg width="16" height="32" viewBox="0 0 16 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="0.5" y="0.5" width="15" height="31" rx="0.5" stroke="black"/>
                                <line x1="1.52588e-05" y1="9.40477" x2="15.5493" y2="9.40477" stroke="black"/>
                                <line x1="3.20422" y1="3.04762" x2="3.20422" y2="7.87302" stroke="black"/>
                                <line x1="3.20422" y1="16" x2="3.20422" y2="20.8254" stroke="black"/>
                                </svg>`
    },
    {
      id: 2,
      name: "item-2",
      svgIcon: `<svg width="16" height="32" viewBox="0 0 16 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0.5" y="0.5" width="15" height="31" rx="0.5" stroke="black"/><line x1="7.5" y1="9.56187e-08" x2="7.5" y2="32" stroke="black"/><line x1="5.5" y1="14" x2="5.5" y2="19.2913" stroke="black"/><line x1="9.5" y1="14" x2="9.5" y2="19.2913" stroke="black"/><mask id="path-5-inside-1_92_16" fill="white"><rect x="10.0571" y="7.30708" width="4.11429" height="3.27559" rx="0.5"/></mask><rect x="10.0571" y="7.30708" width="4.11429" height="3.27559" rx="0.5" stroke="black" stroke-width="2" mask="url(#path-5-inside-1_92_16)"/></svg>`
    },
    {
      id: 3,
      name: "item-3",
      svgIcon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0.5" y="0.5" width="23" height="23" rx="0.5" stroke="black"/><line y1="4" x2="23.6883" y2="4" stroke="black"/><line y1="20.8976" x2="23.6883" y2="20.8976" stroke="black"/><path d="M3 2.25H4.55844" stroke="black"/><line x1="6" y1="2.5" x2="7.55844" y2="2.5" stroke="black"/><line x1="9" y1="2.5" x2="10.5584" y2="2.5" stroke="black"/><line x1="19.5" y1="2.5" x2="21.0584" y2="2.5" stroke="black"/><circle cx="17.25" cy="2.25" r="0.75" fill="black"/><path d="M11.8443 6.86145C15.5632 6.86151 18.5131 9.64975 18.5132 13.0118C18.5132 16.374 15.5633 19.1622 11.8443 19.1622C8.12518 19.1622 5.17532 16.3741 5.17532 13.0118C5.17545 9.64972 8.12526 6.86145 11.8443 6.86145Z" stroke="black"/><line y1="-0.5" x2="4.90984" y2="-0.5" transform="matrix(0.761788 -0.647826 0.70286 0.711328 9 13.6807)" stroke="black"/></svg>`
    },
    {
      id: 4,
      name: "item-4",
      svgIcon: `<svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0.5" y="2.25275" width="23" height="22.2473" rx="0.5" stroke="black"/><line y1="5.76917" x2="24" y2="5.76917" stroke="black"/><line y1="22.2593" x2="24" y2="22.2593" stroke="black"/><rect x="4.19232" y="9.25494" width="15.9231" height="11.3239" rx="0.5" stroke="black"/><line y1="-0.5" x2="1.50247" y2="-0.5" transform="matrix(0.739501 -0.673156 0.739501 0.673156 7.5 13.6915)" stroke="black"/><line y1="-0.5" x2="4.50741" y2="-0.5" transform="matrix(0.739501 -0.673156 0.739501 0.673156 7.5 16.8307)" stroke="black"/><line x1="3" y1="4.26369" x2="4.5" y2="4.26369" stroke="black"/><line x1="6" y1="4.26369" x2="7.5" y2="4.26369" stroke="black"/><line x1="9" y1="4.26369" x2="10.5" y2="4.26369" stroke="black"/><line x1="3" y1="1.25275" x2="9" y2="1.25275" stroke="black"/><path d="M15 1H21" stroke="black"/><ellipse cx="17.25" cy="4.01094" rx="0.75" ry="0.752735" fill="black"/><ellipse cx="20.25" cy="4.01094" rx="0.75" ry="0.752735" fill="black"/></svg>`
    },
    {
      id: 5,
      name: "item-5",
      svgIcon: `<svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0.5" y="2.25275" width="23" height="22.2473" rx="0.5" stroke="black"/><line y1="5.76917" x2="24" y2="5.76917" stroke="black"/><line x1="4.5" y1="9.5" x2="19.5" y2="9.5" stroke="black"/><line y1="22.2593" x2="24" y2="22.2593" stroke="black"/><line x1="3" y1="4.26369" x2="4.5" y2="4.26369" stroke="black"/><line x1="6" y1="4.26369" x2="7.5" y2="4.26369" stroke="black"/><line x1="9" y1="4.26369" x2="10.5" y2="4.26369" stroke="black"/><line x1="3" y1="1.25275" x2="9" y2="1.25275" stroke="black"/><path d="M15 1H21" stroke="black"/><ellipse cx="17.25" cy="4.01094" rx="0.75" ry="0.752735" fill="black"/><ellipse cx="20.25" cy="4.01094" rx="0.75" ry="0.752735" fill="black"/></svg>`
    },
    {
      id: 6,
      name: "item-6",
      svgIcon: `<svg width="24" height="17" viewBox="0 0 24 17" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0.5" y="0.5" width="23" height="12.4603" stroke="black"/><rect x="10.881" y="13.8412" width="2.2381" height="0.761905" stroke="black" stroke-width="0.761905"/><rect x="6.91744" y="15.3016" width="10.4651" height="0.634921" stroke="black" stroke-width="0.634921"/></svg>`
    },
    {
      id: 7,
      name: "item-7",
      svgIcon: `<svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0.5" y="0.5" width="23" height="15" stroke="black"/><line x1="17.2711" x2="17.2711" y2="16" stroke="black"/><rect x="2.23492" y="2.91508" width="12.3012" height="10.1698" stroke="black"/><line y1="-0.5" x2="1.75061" y2="-0.5" transform="matrix(0.691716 -0.722169 0.691716 0.722169 4.5 6.50943)" stroke="black"/><line y1="-0.5" x2="3.57309" y2="-0.5" transform="matrix(0.728765 -0.684764 0.652931 0.757418 4.5 8.84673)" stroke="black"/><line x1="19.5" y1="4.3" x2="21.75" y2="4.3" stroke="black"/><line x1="19.5" y1="11.8" x2="21.75" y2="11.8" stroke="black" stroke-width="2"/><ellipse cx="20.25" cy="7.19999" rx="0.75" ry="0.8" fill="black"/></svg>`
    },
    {
      id: 8,
      name: "item-8",
      svgIcon: `<svg width="19" height="25" viewBox="0 0 19 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.32876 24.5V5.71429C3.24274 4.14286 3.8965 1 7.19973 1C10.503 1 11.7589 4.14286 11.9739 5.71429M11.9739 5.71429C10.8126 6.38095 8.51585 9.08571 8.61908 14.5714C8.74811 21.4286 13.0062 23.8571 15.4578 23.8571V3.85714C14.7266 3.90476 13.0062 4.34286 11.9739 5.71429Z" stroke="black"/><path d="M0 24.5L6.5 24.5" stroke="black"/><line x1="16.732" y1="4.14287" x2="16.732" y2="23.5714" stroke="black"/><circle cx="15.7642" cy="22.5" r="2.5" fill="black"/></svg>`
    },
    {
      id: 9,
      name: "item-9",
      svgIcon: `<svg width="16" height="24" viewBox="0 0 16 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7.5" stroke="black"/><circle cx="8" cy="8" r="0.5" stroke="black"/><path d="M8 2.5C8.33309 2.5 8.69571 2.70275 8.99805 3.15625C9.29802 3.60625 9.5 4.25657 9.5 5C9.5 5.74343 9.29802 6.39375 8.99805 6.84375C8.69571 7.29725 8.33309 7.5 8 7.5C7.66691 7.5 7.30429 7.29725 7.00195 6.84375C6.70198 6.39375 6.5 5.74343 6.5 5C6.5 4.25657 6.70198 3.60625 7.00195 3.15625C7.30429 2.70275 7.66691 2.5 8 2.5Z" stroke="black"/><path d="M8.83932 8.74242C9.00688 8.45453 9.36451 8.24312 9.90854 8.20995C10.4484 8.17706 11.112 8.32962 11.7545 8.70359C12.3971 9.07756 12.8575 9.57926 13.0955 10.0649C13.3354 10.5543 13.3282 10.9697 13.1607 11.2576C12.9931 11.5455 12.6355 11.7569 12.0914 11.79C11.5516 11.8229 10.888 11.6704 10.2454 11.2964C9.60292 10.9224 9.14247 10.4207 8.90445 9.93511C8.66458 9.44569 8.67176 9.0303 8.83932 8.74242Z" stroke="black"/><path d="M7.66686 8.93211C7.85528 9.2068 7.8932 9.62051 7.69024 10.1264C7.48882 10.6283 7.0668 11.1627 6.45373 11.5832C5.84066 12.0037 5.19014 12.205 4.64936 12.2122C4.10437 12.2194 3.73206 12.0351 3.54364 11.7604C3.35523 11.4857 3.31731 11.072 3.52027 10.5661C3.72168 10.0642 4.1437 9.52981 4.75677 9.10928C5.36984 8.68875 6.02037 8.48747 6.56114 8.48029C7.10613 8.47308 7.47844 8.65743 7.66686 8.93211Z" stroke="black"/><rect x="4.32143" y="23.0357" width="8.24603" height="0.642857" stroke="black" stroke-width="0.642857"/><rect x="8.25" y="15.25" width="0.5" height="7.5" stroke="black" stroke-width="0.5"/></svg>`
    }
  ];
  _placeholders = [
    { id: 1, itemId: null as number | null },
    { id: 2, itemId: null as number | null },
    { id: 3, itemId: null as number | null },
    { id: 4, itemId: null as number | null },
    { id: 5, itemId: null as number | null },
    { id: 6, itemId: null as number | null },
    { id: 7, itemId: null as number | null },
  ];
  _instructionText = ["Welcome to an impedance measurement simulation!",
    "Begin by dragging devices into the socket.",
    "Well done! Add more devices to observe changes in the results.",
    "Now, check out the measurement results to see what's happening!"
  ]
  // Computed properties for responsive design
  readonly isMobile = computed(() => this.screensize.screenSize().width < 768);
  readonly isTablet = computed(() =>
    this.screensize.screenSize().width >= 768 &&
    this.screensize.screenSize().width < 1024
  );
  readonly isDesktop = computed(() => this.screensize.screenSize().width >= 1024);
  readonly placeholderObject = computed<PlaceholderObject>(() =>
    Object.fromEntries(this.placeholderOccupancy()) as PlaceholderObject
  );

  // State management
  private readonly itemPositions = signal<Map<string, string>>(new Map());
  private readonly placedItems = signal<Set<string>>(new Set());
  private readonly placeholderOccupancy = signal<Map<string, string>>(new Map()); // placeholder -> item mapping

  // Draggable instances to cleanup
  private draggableInstances: Draggable[] = [];

  // Animation counters
  private dragCounters = new Map<string, number>();

  constructor(
    private screensize: ScreensizeService,
    private destroyRef: DestroyRef,
    private dataService: DataService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {
    gsap.registerPlugin(Draggable);
  }

  ngAfterViewInit(): void {
    this.changeText(this.instructionText.nativeElement, this._instructionText[0])
    this.initializeDragAndDrop();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
  private initializeDragAndDrop(): void {
    const dragItemsArray = this.dragItems.toArray();
    const placeholdersArray = this.placeholders.toArray();

    // Initialize item positions
    this.initializeItemPositions(dragItemsArray);

    // Create draggable instances
    this.createDraggableInstances(dragItemsArray, placeholdersArray);
  }

  private initializeItemPositions(items: ElementRef<HTMLDivElement>[]): void {
    const positions = new Map<string, string>();
    items.forEach(item => {
      const itemId = this.getItemId(item.nativeElement);
      positions.set(itemId, '');
      this.dragCounters.set(itemId, 0);
    });
    this.itemPositions.set(positions);

    // Initialize placeholder occupancy
    this.placeholderOccupancy.set(new Map());
  }

  private createDraggableInstances(
    items: ElementRef<HTMLDivElement>[],
    placeholders: ElementRef<HTMLDivElement>[]
  ): void {
    items.forEach((item, index) => {
      const draggableInstance = Draggable.create(item.nativeElement, {
        type: 'x,y',
        onPress: () => this.handleDragStart(item, items),
        onDrag: () => this.handleDrag(item, placeholders),
        onRelease: () => this.handleDragEnd(item, items, placeholders, index)
      })[0];

      this.draggableInstances.push(draggableInstance);
    });
  }

  private handleDragStart(
    currentItem: ElementRef<HTMLDivElement>,
    allItems: ElementRef<HTMLDivElement>[]
  ): void {
    const { scale, rotation, duration } = ANIMATION_CONFIG.onPress;

    // Animate current item
    gsap.to(currentItem.nativeElement, {
      opacity: 1,
      duration,
      scale,
      rotate: `random(${rotation.min}, ${rotation.max})`,
      zIndex: 100
    });

    // Fade other items
    this.animateItemOpacity(allItems, currentItem);
  }

  private handleDrag(
    currentItem: ElementRef<HTMLDivElement>,
    placeholders: ElementRef<HTMLDivElement>[]
  ): void {
    const itemId = this.getItemId(currentItem.nativeElement);
    let collisionFound = false;

    placeholders.forEach(placeholder => {
      const isColliding = Draggable.hitTest(
        currentItem.nativeElement,
        placeholder.nativeElement,
        HIT_TEST_THRESHOLD.DRAG
      );

      if (isColliding) {

        this.handleCollision(currentItem, placeholder);
        collisionFound = true;

        const foundKey = Object.keys(this.placeholderObject()).find(key => this.placeholderObject()[key] === currentItem.nativeElement.className);
        if (foundKey) {
          this.updatePlaceholderOccupancy(foundKey, ''),
            gsap.to(`.${foundKey}`, {
              duration: ANIMATION_CONFIG.onDrag.duration,
              scale: 1,
              ease: 'power2.out',
              backgroundColor: "#e9ffef"
            })
        }
      }
    });

    if (!collisionFound) {
      this.handleNoCollision(currentItem, placeholders, itemId);
    }
  }

  private handleDragEnd(
    currentItem: ElementRef<HTMLDivElement>,
    allItems: ElementRef<HTMLDivElement>[],
    placeholders: ElementRef<HTMLDivElement>[],
    itemIndex: number
  ): void {
    const itemId = this.getItemId(currentItem.nativeElement);
    let placed = false;

    // Check for successful placement
    placeholders.forEach(placeholder => {
      const isColliding = Draggable.hitTest(
        placeholder.nativeElement,
        currentItem.nativeElement,
        HIT_TEST_THRESHOLD.RELEASE
      );

      if (isColliding && !placed) {
        this.handleSuccessfulPlacement(currentItem, placeholder, itemId, allItems);
        placed = true;
      }
    });

    // If not placed, reset to original position
    if (!placed) {
      // console.log(this.placeholderObject())

      const foundKey = Object.keys(this.placeholderObject()).find(key => this.placeholderObject()[key] === currentItem.nativeElement.className);
      if (foundKey) {
        this.updatePlaceholderOccupancy(foundKey, ''),

          gsap.to(`.${foundKey}`, {
            duration: ANIMATION_CONFIG.onDrag.duration,
            scale: 1,
            ease: 'power2.out',
            backgroundColor: "#e9ffef",
          })
      }

      this.resetItemPosition(currentItem, itemId);
      this.dataService.setPlacedItems(Array.from(this.placeholderOccupancy()))
      console.log(this.dataService.getPlacedItems())
      gsap.to(currentItem.nativeElement.querySelector('.icon'), { opacity: 1, duration: 0.3 });

      //////////////////////// here 

    }

    // Reset all items opacity and rotation
    this.resetAllItemsAppearance(allItems);
  }

  private handleCollision(
    item: ElementRef<HTMLDivElement>,
    placeholder: ElementRef<HTMLDivElement>
  ): void {
    const { highlightScale, placeholderScale, highlightColor, duration } = ANIMATION_CONFIG.onDrag;

    gsap.to(item.nativeElement, {
      duration,
      scale: highlightScale,
      backgroundColor: highlightColor,
    });

    gsap.to(placeholder.nativeElement, {
      duration,
      scale: placeholderScale,
      ease: 'power2.out',
    });
    // Reset counter
    const itemId = this.getItemId(item.nativeElement);
    this.dragCounters.set(itemId, 0);
  }

  private handleNoCollision(
    item: ElementRef<HTMLDivElement>,
    placeholders: ElementRef<HTMLDivElement>[],
    itemId: string
  ): void {
    const counter = (this.dragCounters.get(itemId) || 0) + 1;
    this.dragCounters.set(itemId, counter);

    if (counter > 3) {
      gsap.to(item.nativeElement, {
        duration: ANIMATION_CONFIG.onDrag.duration,
        scale: 1,
        ease: 'power4.out',
        backgroundColor: DEFAULT_COLORS.NORMAL,
      });

      placeholders.forEach(placeholder => {
        if (!this.placeholderOccupancy().has(placeholder.nativeElement.className)) {
          gsap.to(placeholder.nativeElement, {
            duration: ANIMATION_CONFIG.onDrag.duration,
            scale: 1,
            ease: 'power2.out',
            backgroundColor: "#e9ffef",
            onComplete: () => this.removePlaceholderItem(placeholder.nativeElement.className)
          });
        } else {
          gsap.to(placeholder.nativeElement, {
            duration: ANIMATION_CONFIG.onDrag.duration,
            scale: 1,
            ease: 'power2.out',
            backgroundColor: DEFAULT_COLORS.SUCCESS,
            // onComplete: () => this.updatePlaceholderItem(placeholder.nativeElement.className, item.nativeElement.className)
          });
          // this.updatePlaceholderItem(placeholder.nativeElement.className, item.nativeElement.className)
        }
      });


    }
  }

  private handleSuccessfulPlacement(
    item: ElementRef<HTMLDivElement>,
    placeholder: ElementRef<HTMLDivElement>,
    itemId: string,
    allItems: ElementRef<HTMLDivElement>[]
  ): void {
    const placeholderId = this.getPlaceholderId(placeholder.nativeElement);

    // Check if placeholder already has an item
    const occupiedItem = this.placeholderOccupancy().get(placeholderId);

    if (occupiedItem && occupiedItem !== itemId) {
      // Remove the previous item from this placeholder
      this.handleItemReplacement(occupiedItem, allItems, placeholderId);
    }

    // Remove current item from its previous position (if any)
    this.removeItemFromPreviousPosition(itemId);

    // Update positions and occupancy
    this.updateItemPosition(itemId, placeholderId);
    this.updatePlaceholderOccupancy(placeholderId, itemId);

    // Update placed items set
    const currentPlacedItems = new Set(this.placedItems());
    currentPlacedItems.add(itemId);
    this.placedItems.set(currentPlacedItems);

    // Animate successful placement
    const { duration, successScale, successColor } = ANIMATION_CONFIG.onRelease;

    gsap.to(item.nativeElement, {
      duration: 0.4,
      opacity: 0,
      scale: 1,
      backgroundColor: successColor,
    });

    gsap.to(placeholder.nativeElement, {
      duration,
      scale: 1.1,
      ease: 'power2.out',
      backgroundColor: successColor,
      onComplete: () => this.updatePlaceholderItem(placeholder.nativeElement.className, item.nativeElement.className)
    });
    gsap.to(item.nativeElement.querySelector('.icon'), { opacity: 0, duration: 0.3 });
    this.cdr.detectChanges()


    ////////////////////////////////////////////a


    console.log('Item placed successfully:', { itemId, placeholderId });
    console.log('Current positions:', this.itemPositions());
    console.log('Placeholder occupancy:', this.placeholderOccupancy());
    this.dataService.setPlacedItems(Array.from(this.placeholderOccupancy()))
    console.log(this.dataService.getPlacedItems())
  }

  private updatePlaceholderItem(position: string, itemId: string) {
    const match1 = position.match(/-(\d+)$/)
    const number1 = match1 ? parseInt(match1[1], 10) : NaN;
    const match2 = itemId.match(/-(\d+)$/);
    const number2 = match2 ? parseInt(match2[1], 10) : NaN;
    this._placeholders[number1 - 1].itemId = number2 - 1
  }
  private removePlaceholderItem(position: string) {
    const match1 = position.match(/-(\d+)$/)
    const number1 = match1 ? parseInt(match1[1], 10) : NaN;
    this._placeholders[number1 - 1].itemId = null
  }
  private resetItemPosition(item: ElementRef<HTMLDivElement>, itemId: string): void {
    // Remove from previous position
    this.removeItemFromPreviousPosition(itemId);

    // Remove from placed items
    const currentPlacedItems = new Set(this.placedItems());
    currentPlacedItems.delete(itemId);
    this.placedItems.set(currentPlacedItems);

    // Reset position in map
    this.updateItemPosition(itemId, '');

    // Animate back to original position
    gsap.to(item.nativeElement, {
      duration: ANIMATION_CONFIG.onRelease.duration,
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      rotate: 0,
      backgroundColor: DEFAULT_COLORS.NORMAL,
    });
  }

  private animateItemOpacity(
    allItems: ElementRef<HTMLDivElement>[],
    currentItem: ElementRef<HTMLDivElement>
  ): void {

    gsap.to(allItems.map(el => el.nativeElement), {
      duration: ANIMATION_CONFIG.onPress.duration,
      opacity: (index: number, target: HTMLElement) => {
        const isCurrentItem = target === currentItem.nativeElement;
        const hasExcludedClass = this.dataService.getPlacedItems().some(className =>
          currentItem.nativeElement.classList.contains(className)
        );
        // target === currentItem.nativeElement ? 1 : 0.3
        return isCurrentItem && !hasExcludedClass ? 1 : 0.2;
      }

    });
  }

  private resetAllItemsAppearance(allItems: ElementRef<HTMLDivElement>[]): void {
    // gsap.to(allItems.map(el => el.nativeElement), {
    //   duration: ANIMATION_CONFIG.onRelease.duration,
    //   opacity: 1,
    //   rotate: 0,
    //   ease: 'elastic.out(.45)'
    // });
    const elementsToAnimate = allItems
      .map(item => item.nativeElement)
      .filter(element => !this.dataService.getPlacedItems().some(c => element.classList.contains(c)));

    gsap.to(elementsToAnimate, {
      duration: ANIMATION_CONFIG.onRelease.duration,
      opacity: 1,
      rotate: 0,
      ease: 'elastic.out(.45)'
    });
  }

  private updateItemPosition(itemId: string, placeholderId: string): void {
    const currentPositions = new Map(this.itemPositions());
    currentPositions.set(itemId, placeholderId);
    this.itemPositions.set(currentPositions);
  }

  private updatePlaceholderOccupancy(placeholderId: string, itemId: string): void {
    const currentOccupancy = new Map(this.placeholderOccupancy());
    if (itemId === '') {
      currentOccupancy.delete(placeholderId);
    } else {
      currentOccupancy.set(placeholderId, itemId);
    }
    this.placeholderOccupancy.set(currentOccupancy);
  }

  private removeItemFromPreviousPosition(itemId: string): void {
    const currentPositions = this.itemPositions();
    const previousPlaceholderId = currentPositions.get(itemId);

    if (previousPlaceholderId) {
      // Remove from placeholder occupancy
      this.updatePlaceholderOccupancy(previousPlaceholderId, '');
    }
  }

  private handleItemReplacement(
    replacedItemId: string,
    allItems: ElementRef<HTMLDivElement>[],
    placeholderId: string
  ): void {
    // Find the DOM element of the item being replaced
    const replacedItemElement = allItems.find(item =>
      this.getItemId(item.nativeElement) === replacedItemId
    );

    if (replacedItemElement) {
      console.log(`Replacing item ${replacedItemId} from placeholder ${placeholderId}`);

      // Remove from placed items set
      const currentPlacedItems = new Set(this.placedItems());
      currentPlacedItems.delete(replacedItemId);
      this.placedItems.set(currentPlacedItems);

      // Update item position to empty
      this.updateItemPosition(replacedItemId, '');

      // Animate the replaced item back to original position
      gsap.to(replacedItemElement.nativeElement, {
        duration: ANIMATION_CONFIG.onRelease.duration,
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        rotate: 0,
        backgroundColor: DEFAULT_COLORS.NORMAL,
        ease: 'back.out(1.7)',
        onComplete: () => {
          console.log(`Item ${replacedItemId} has been returned to original position`);
        }
      });

      // Optional: Add a visual effect to show the item is being "pushed out"
      gsap.fromTo(replacedItemElement.nativeElement,
        {
          scale: 1,
          backgroundColor: DEFAULT_COLORS.NORMAL,
          opacity: 1
        },
        {
          duration: 0.3,
          scale: ANIMATION_CONFIG.onPress.scale + 0.2,
          backgroundColor: '#ff6b6b', // Red color to indicate displacement
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut',
        }


      );
      gsap.to(replacedItemElement.nativeElement.querySelector('.icon'), { opacity: 1, duration: 0.3 })
    }
  }

  private changeText(element: HTMLElement, text: string) {
    if (element.textContent) {
      gsap.to(element, {
        duration: 0.5,
        opacity: 0,
        y: -20,
        onComplete: () => {
          element.textContent = text;

          gsap.to(element, {
            duration: 0.5,
            opacity: 1,
            y: 0
          });
        }
      });
    }

  }
  private getItemId(element: HTMLElement): string {
    return element.className.slice(0, 6) || element.id || `item-${Math.random()}`;
  }

  private getPlaceholderId(element: HTMLElement): string {
    return element.className || element.id || `placeholder-${Math.random()}`;
  }

  private cleanup(): void {
    // Destroy all draggable instances
    this.draggableInstances.forEach(instance => {
      if (instance && typeof instance.kill === 'function') {
        instance.kill();
      }
    });
    this.draggableInstances = [];

    // Clear maps and sets
    this.dragCounters.clear();
  }

  // Public methods 
  public getPlacedItems(): Set<string> {
    return this.placedItems();
  }

  public getItemPositions(): Map<string, string> {
    return this.itemPositions();
  }

  public resetAllItems(): void {
    this.dragItems.forEach(item => {
      const itemId = this.getItemId(item.nativeElement);
      this.resetItemPosition(item, itemId);
    });

    // Clear placeholder occupancy
    this.placeholderOccupancy.set(new Map());
  }

  // Helper method to check completion
  public isAllItemsPlaced(): boolean {
    return this.placedItems().size === this.dragItems.length;
  }

  // Get placeholder occupancy for debugging
  public getPlaceholderOccupancy(): Map<string, string> {
    return this.placeholderOccupancy();
  }

  // Check if a specific placeholder is occupied
  public isPlaceholderOccupied(placeholderId: string): boolean {
    return this.placeholderOccupancy().has(placeholderId);
  }

  // Get item currently occupying a placeholder
  public getItemInPlaceholder(placeholderId: string): string | undefined {
    return this.placeholderOccupancy().get(placeholderId);
  }
}

// Utility functions
export class DOMUtils {
  static addClass(el: HTMLElement, className: string): void {
    el.classList.add(className);
  }

  static removeClass(el: HTMLElement, className: string): void {
    if (this.hasClass(el, className)) {
      el.classList.remove(className);
    }
  }

  static hasClass(el: HTMLElement, className: string): boolean {
    return el.classList.contains(className);
  }

  static toggleClass(el: HTMLElement, className: string): void {
    el.classList.toggle(className);
  }
}

export class ArrayUtils {
  static removeItem<T>(arr: T[], itemToRemove: T): T[] {
    const index = arr.indexOf(itemToRemove);
    if (index > -1) {
      arr.splice(index, 1);
    }
    return arr;
  }

  static moveItem<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
    const item = arr.splice(fromIndex, 1)[0];
    arr.splice(toIndex, 0, item);
    return arr;
  }
}