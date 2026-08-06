import { Component, inject, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, IonButton,
  IonIcon, IonItem, IonLabel, IonList, IonBadge, IonAvatar,
  IonGrid, IonRow, IonCol, IonText, IonSelect, IonSelectOption,
  IonRange, IonNote, ToastController, IonModal, IonButtons, IonProgressBar
} from '@ionic/angular/standalone';
import { BlockchainService } from '../services/blockchain.service';
import { AuthService } from '../services/auth.service';
import { addIcons } from 'ionicons';
import { 
  trashBin, wallet, leaf, cash, shieldCheckmark, 
  reloadCircle, arrowForward, location, close, informationCircle 
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
import * as L from 'leaflet';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { icon, Marker } from 'leaflet';

// Fix default marker icons
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
Marker.prototype.options.icon = iconDefault;

interface SmartBin {
  id: string;
  name: string;
  location: [number, number];
  type: 'plastic' | 'glass' | 'paper' | 'metal' | 'mixed';
  capacity: number;
  description: string;
  lastUpdated: Date;
}

interface MapConfig {
  layers: L.TileLayer[];
  zoom: number;
  center: L.LatLngTuple;
}

@Component({
  selector: 'app-recycle-rewards',
  templateUrl: './recycle-rewards.page.html',
  styleUrls: ['./recycle-rewards.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonButton,
    IonIcon, IonItem, IonLabel, IonList, IonBadge, IonAvatar,
    IonGrid, IonRow, IonCol, IonText, IonSelect, IonSelectOption,
    IonRange, IonNote, IonModal, IonButtons, IonProgressBar, 
    LeafletModule
  ]
})
export class RecycleRewardsPage implements AfterViewInit {
  @ViewChild('fullscreenMap', { static: false }) fullscreenMapElement!: ElementRef;
  private fullscreenMapInstance: L.Map | null = null;
  private map: L.Map | null = null;

  public blockchain = inject(BlockchainService);
  private toastCtrl = inject(ToastController);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  selectedMaterial: string = '';
  weight: number = 1;
  isMapModalOpen = false;
  selectedBin: SmartBin | null = null;

  stats = [
    { label: 'Total Recycled', value: '24.5 kg', highlight: false },
    { label: 'Total Earned', value: '490 HBAR', highlight: true },
    { label: 'CO2 Saved', value: '58 kg', highlight: false },
    { label: 'Current Streak', value: '7 days', highlight: false }
  ];

  recyclingHistory = [
    { material: 'plastic', weight: 2.5, reward: 50, date: new Date() },
    { material: 'glass', weight: 1.8, reward: 36, date: new Date(Date.now() - 86400000) },
    { material: 'paper', weight: 3.2, reward: 32, date: new Date(Date.now() - 172800000) }
  ];

  // Tunisia-focused map configuration
  mapOptions: MapConfig = {
    layers: [
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      })
    ],
    zoom: 8,
    center: [34.0, 9.5] as L.LatLngTuple // Centered on Tunisia
  };

  // Smart bins in Tunisia locations
  smartBins: SmartBin[] = [
    {
      id: 'bin-tn-1',
      name: 'Tunis Recycling Hub',
      location: [36.8065, 10.1815], // Tunis
      type: 'mixed',
      capacity: 65,
      description: 'Main recycling center in Tunis with 24/7 access',
      lastUpdated: new Date()
    },
    {
      id: 'bin-tn-2',
      name: 'Sousse Beach Bin',
      location: [35.8254, 10.6369], // Sousse
      type: 'plastic',
      capacity: 35,
      description: 'Beachside plastic collection point',
      lastUpdated: new Date(Date.now() - 3600000)
    },
    {
      id: 'bin-tn-3',
      name: 'Sfax Commercial District',
      location: [34.7406, 10.7603], // Sfax
      type: 'paper',
      capacity: 80,
      description: 'Paper recycling for business district',
      lastUpdated: new Date(Date.now() - 7200000)
    },
    {
      id: 'bin-tn-4',
      name: 'Djerba Island Bin',
      location: [33.8078, 10.8451], // Djerba
      type: 'glass',
      capacity: 45,
      description: 'Tourist area glass recycling',
      lastUpdated: new Date(Date.now() - 10800000)
    }
  ];

  constructor() {
    addIcons({ 
      trashBin, wallet, leaf, cash, shieldCheckmark, 
      reloadCircle, arrowForward, location, close, informationCircle
    });
  }

  ngAfterViewInit(): void {
    // Regular map is initialized through (leafletMapReady) event
  }

  onMapReady(map: L.Map) {
    this.map = map;
    this.addBinMarkers();
    this.cdr.detectChanges();
  }

  openFullscreenMap() {
    this.isMapModalOpen = true;
    
    setTimeout(() => {
      if (!this.fullscreenMapInstance && this.fullscreenMapElement?.nativeElement) {
        this.initFullscreenMap();
      } else if (this.fullscreenMapInstance) {
        this.fullscreenMapInstance.invalidateSize();
      }
    }, 300);
  }

  private initFullscreenMap() {
    if (!this.fullscreenMapElement?.nativeElement) return;

    if (this.fullscreenMapInstance) {
      this.fullscreenMapInstance.remove();
    }

    this.fullscreenMapInstance = L.map(this.fullscreenMapElement.nativeElement, {
      zoomControl: true,
      preferCanvas: true,
      renderer: L.canvas()
    }).setView(this.mapOptions.center, 10); // Slightly zoomed in for fullscreen

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.fullscreenMapInstance);

    this.addBinMarkersToFullscreenMap();

    setTimeout(() => {
      this.fullscreenMapInstance?.invalidateSize();
    }, 100);
  }

  private addBinMarkers() {
    if (!this.map) return;

    const binIcons = {
      plastic: L.icon({
        iconUrl: 'assets/images/bin-plastic.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      }),
      glass: L.icon({
        iconUrl: 'assets/images/bin-glass.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      }),
      paper: L.icon({
        iconUrl: 'assets/images/bin-paper.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      }),
      metal: L.icon({
        iconUrl: 'assets/images/bin-metal.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      }),
      mixed: L.icon({
        iconUrl: 'assets/images/bin-mixed.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      })
    };

    this.smartBins.forEach(bin => {
      const marker = L.marker(bin.location, {
        icon: binIcons[bin.type]
      }).addTo(this.map!);

      // Create detailed popup content
      const popupContent = `
        <div class="bin-popup">
          <h3>${bin.name}</h3>
          <p><strong>Type:</strong> ${bin.type.toUpperCase()}</p>
          <p><strong>Location:</strong> ${bin.description}</p>
          <div class="capacity-display">
            <p><strong>Capacity:</strong> ${bin.capacity}%</p>
            <div class="capacity-bar" style="width:${bin.capacity}%"></div>
          </div>
          <p class="last-updated">Updated: ${this.formatTimeSinceUpdate(bin.lastUpdated)}</p>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 250,
        className: 'custom-popup'
      });

      marker.on('click', () => {
        this.selectedBin = bin;
        this.cdr.detectChanges();
      });
    });

    if (this.smartBins.length > 0) {
      const bounds = L.latLngBounds(this.smartBins.map(bin => bin.location));
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  private addBinMarkersToFullscreenMap() {
    if (!this.fullscreenMapInstance) return;

    const binIcons = {
      plastic: L.icon({
        iconUrl: 'assets/images/bin-plastic.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      }),
      glass: L.icon({
        iconUrl: 'assets/images/bin-glass.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      }),
      paper: L.icon({
        iconUrl: 'assets/images/bin-paper.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      }),
      metal: L.icon({
        iconUrl: 'assets/images/bin-metal.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      }),
      mixed: L.icon({
        iconUrl: 'assets/images/bin-mixed.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      })
    };

    this.smartBins.forEach(bin => {
      const marker = L.marker(bin.location, {
        icon: binIcons[bin.type]
      }).addTo(this.fullscreenMapInstance!);

      const popupContent = `
        <div class="bin-popup">
          <h3>${bin.name}</h3>
          <p><strong>Type:</strong> ${bin.type.toUpperCase()}</p>
          <p><strong>Location:</strong> ${bin.description}</p>
          <div class="capacity-display">
            <p><strong>Capacity:</strong> ${bin.capacity}%</p>
            <div class="capacity-bar" style="width:${bin.capacity}%"></div>
          </div>
          <p class="last-updated">Updated: ${this.formatTimeSinceUpdate(bin.lastUpdated)}</p>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });
    });
  }

  private formatTimeSinceUpdate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  }

  onMapModalDismiss() {
    this.isMapModalOpen = false;
    if (this.fullscreenMapInstance) {
      this.fullscreenMapInstance.remove();
      this.fullscreenMapInstance = null;
    }
  }

  async connectWallet() {
    try {
      const address = await this.blockchain.connectWallet();
      if (!address || !address.startsWith('0x')) {
        throw new Error('Invalid wallet address');
      }
      this.showToast('Wallet connected successfully!');
    } catch (error) {
      console.error('Wallet connection error:', error);
      this.showToast('Error connecting wallet');
    }
  }

  calculateReward(): number {
    if (!this.selectedMaterial) return 0;
    
    const rates: {[key: string]: number} = {
      plastic: 20,
      glass: 18,
      paper: 10,
      metal: 25
    };
    
    return Math.round(this.weight * rates[this.selectedMaterial]);
  }

  async submitRecycling() {
    if (!this.selectedMaterial) return;
    
    const reward = this.calculateReward();
    const newEntry = {
      material: this.selectedMaterial,
      weight: this.weight,
      reward: reward,
      date: new Date()
    };

    try {
      await this.saveRecycle(this.selectedMaterial, this.weight, reward);
      this.recyclingHistory.unshift(newEntry);
      this.showToast(`You earned ${reward} EBT for recycling!`);
    } catch (error) {
      this.showToast('Failed to save recycling data. Please try again.', 'danger');
      console.error('Recycle submission error:', error);
    } finally {
      this.selectedMaterial = '';
      this.weight = 1;
    }
  }

  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color
    });
    await toast.present();
  }

  async saveRecycle(material: string, weight: number, pointsEarned: number) {
    const token = await this.auth.getToken();
    const url = `${environment.apiUrl}/activity/recycle`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ material, weight, pointsEarned })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Recycle save error:', error);
      throw error;
    }
  }

  getBinTypeColor(type: string): string {
    const colors: Record<string, string> = {
      plastic: 'primary',
      glass: 'success',
      paper: 'warning',
      metal: 'medium',
      mixed: 'tertiary'
    };
    return colors[type] || 'primary';
  }
}