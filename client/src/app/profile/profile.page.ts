import { Component, OnInit, OnDestroy, inject, HostBinding } from '@angular/core';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, IonButton,
  IonIcon, IonItem, IonLabel, IonBadge, IonAvatar,
  IonButtons, IonBackButton, ToastController
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { BlockchainService } from '../services/blockchain.service';
import { addIcons } from 'ionicons';
import { camera, wallet, logOut, key, mail, person, leaf } from 'ionicons/icons';
import { ShortenAddressPipe } from '../pipes/shorten-address.pipe';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonButton,
    IonIcon, IonItem, IonLabel, IonBadge, IonAvatar,
    IonButtons, IonBackButton,
    CommonModule, ShortenAddressPipe
  ]
})
export class ProfilePage implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private blockchain = inject(BlockchainService);
  private toastCtrl = inject(ToastController);

  @HostBinding('class') className = 'profile-page-enter';
  profileImage = 'assets/images/default-avatar.png';
  walletAddress: string | null = null;
  userName = 'EcoUser';
  userEmail = '';
  ecoPoints = 0;
  ebtBalance = '0.0000';

  private subs: Subscription[] = [];

  constructor() {
    addIcons({ camera, wallet, logOut, key, mail, person, leaf });
  }

  async ngOnInit() {
    this.applyUser(this.auth.getCurrentUser());
    this.subs.push(this.auth.currentUser$.subscribe(user => this.applyUser(user)));

    this.walletAddress = this.blockchain.walletAddress || this.auth.getCurrentUser()?.walletAddress || null;
    this.ebtBalance = this.blockchain.ebtBalance;

    this.subs.push(this.blockchain.onWalletConnected.subscribe(address => {
      this.walletAddress = address;
      this.updateBalance();
    }));
    this.subs.push(this.blockchain.onWalletDisconnected.subscribe(() => {
      this.walletAddress = this.auth.getCurrentUser()?.walletAddress || null;
      this.ebtBalance = '0.0000';
    }));
    this.subs.push(this.blockchain.onBalanceChanged.subscribe(balance => {
      this.ebtBalance = balance;
    }));

    this.updateBalance();
  }

  ngOnDestroy() {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  private applyUser(user: any) {
    if (!user) return;
    this.userEmail = user.email || '';
    this.ecoPoints = user.ecoPoints ?? 0;
    if (user.email) {
      this.userName = user.email.split('@')[0];
    }
    if (user.walletAddress && !this.blockchain.walletAddress) {
      this.walletAddress = user.walletAddress;
    }
  }

  private async updateBalance() {
    if (!this.walletAddress) {
      this.ebtBalance = '0.0000';
      return;
    }
    try {
      await this.blockchain.updateBalance();
      this.ebtBalance = this.blockchain.ebtBalance;
    } catch (error) {
      console.error('Balance update error:', error);
    }
  }

  async connectWallet() {
    try {
      await this.blockchain.connectWallet();
      this.showToast('Wallet connected successfully!');
    } catch (error) {
      this.showToast('Error connecting wallet');
      console.error(error);
    }
  }

  async disconnectWallet() {
    try {
      await this.blockchain.disconnectWallet();
      this.showToast('Wallet disconnected');
      this.walletAddress = null;
    } catch (error) {
      this.showToast('Error disconnecting wallet');
      console.error(error);
    }
  }

  changeProfilePicture() {
    this.showToast('Profile picture change coming soon!');
  }

  changePassword() {
    this.showToast('Password change coming soon!');
  }

  logout() {
    this.auth.logout();
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }
}
