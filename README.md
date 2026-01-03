<p align="center">
  <img src="https://raw.githubusercontent.com/your-username/your-repo/main/assets/banner.png" alt="TiffinTales Banner" />
</p>

<h1 align="center">🍱 TiffinTales</h1>

<p align="center">
  A hyperlocal tiffin & grocery delivery ecosystem connecting home chefs with busy professionals.
</p>

<p align="center">
  <a href="https://drive.google.com/file/d/1PSu0GwwNXMmHxcADTxF7kFhHuUYcI4G4/view?usp=sharing">
    📲 Download APK
  </a>
</p>

---

## 🚀 Elevator Pitch

**TiffinTales** is a multi-role food delivery platform designed for local tiffin providers and urban professionals who want reliable, affordable, home-style meals.  
It enables seamless ordering and real-time tracking through a scalable mobile-first architecture.

---

## ✨ Key Features

- 📦 **Real-time Order Tracking**  
  Live order updates powered by Supabase Realtime subscriptions.

- 🔐 **Role-Based Authentication**  
  Separate flows for **Customers**, **Chefs**, and **Delivery Riders** with protected routes.

- 📱 **Offline-First Experience**  
  Local caching using AsyncStorage for network-resilient usage.

- 🧩 **Custom UI Components**  
  Buttons, modals, carousels, inputs, and loaders built from scratch (no UI kits).

- 🗺️ **Permissions & Device APIs**  
  Location, camera, and storage permissions integrated cleanly.

- ⚡ **Performance Optimized**  
  Memoization, reduced re-renders, and smooth 60fps animations.

---

## 🏗️ Architecture Overview

```text
┌──────────────────────┐        ┌──────────────────────┐
│  React Native App    │        │   Admin Web Panel    │
│  (Users / Chefs /    │        │     (Next.js)        │
│   Riders)            │        └──────────┬───────────┘
└──────────┬───────────┘                   │
           │                                │
           └───────────────┬────────────────┘
                           │
                   ┌───────▼────────┐
                   │    Supabase     │
                   │ Auth • DB       │
                   │ Realtime        │
                   │ Storage         │
                   └────────────────┘
