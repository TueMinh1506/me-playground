import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlaygroundComponent } from './playground/playground.component';
import { LoadingComponent } from './loading/loading.component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PlaygroundComponent, LoadingComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'me-playground';
  loading = signal(true);
  onProgress(progress: number) {
    console.log(`Progress: ${progress}%`);
  }

  onComplete() {
    this.loading.set(false);
  }
}

