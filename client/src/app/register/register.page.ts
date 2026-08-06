import { Component } from '@angular/core';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonInput, IonItem, IonLabel,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonSpinner, IonNote, IonList, IonIcon,
  IonBackButton, IonButtons, ToastController
} from '@ionic/angular/standalone';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { personAdd, personCircle, arrowBack } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonInput, IonItem, IonLabel,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonSpinner, IonNote, IonList, IonIcon,
    IonBackButton, IonButtons,
    FormsModule, CommonModule
  ]
})
export class RegisterPage {
  email = '';
  password = '';
  confirmPassword = '';
  isLoading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ personAdd, personCircle, arrowBack });
  }

  // register.page.ts
async register() {
  if (this.password !== this.confirmPassword) {
    const toast = await this.toastCtrl.create({
      message: 'Passwords do not match',
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
    return;
  }

  this.isLoading = true;
  
  try {
    const isRegistered = await this.auth.register(this.email, this.password);
    
    if (isRegistered) {
      const toast = await this.toastCtrl.create({
        message: 'Registration successful!',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
      this.router.navigate(['/tabs/home'], { replaceUrl: true });
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    const toast = await this.toastCtrl.create({
      message: error.message || 'Registration failed. Please try again.',
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  } finally {
    this.isLoading = false;
  }
}
}