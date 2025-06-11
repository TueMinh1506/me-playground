import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlaygroundComponent } from './playground/playground.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PlaygroundComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'me-playground';
}
