import { Component, inject } from '@angular/core';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonButton, IonIcon, IonMenuButton 
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { BlockchainService } from '../../services/blockchain.service';
import { addIcons } from 'ionicons';
import { personCircle } from 'ionicons/icons';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons,
    IonButton, IonIcon, IonMenuButton
  ]
})
export class HeaderComponent {
  public blockchain = inject(BlockchainService);
  private router = inject(Router);

  constructor() {
    addIcons({ personCircle });
  }

  navigateToSettings() {
    this.router.navigate(['/profile']);
  }
}