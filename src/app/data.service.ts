import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private placedItems = signal<any[]>([])!;
  
  getPlacedItems(): any[] {
    if(this.placedItems()) {
      return this.placedItems();
    } else {
      return [];
    }
    
  }

  setPlacedItems(items: any[]): void {
  let _array: any = []
  items.forEach((item)=>{
    _array.push(item[1])
  })
    this.placedItems.set(_array);
  }
}
