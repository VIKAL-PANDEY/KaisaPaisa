import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { MobileNavComponent } from './shared/components/mobile-nav/mobile-nav';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    NavbarComponent,
    MobileNavComponent
  ],
  template: `
    @if (authService.isAuthenticated()) {
      <div class="app-container">
        <app-sidebar></app-sidebar>
        <main class="main-content">
          <app-navbar></app-navbar>
          <router-outlet></router-outlet>
        </main>
        <app-mobile-nav></app-mobile-nav>
      </div>
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styleUrl: './app.css'
})
export class App {
  authService = inject(AuthService);
}
