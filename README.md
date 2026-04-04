<p align="center">
  <img src="https://raw.githubusercontent.com/your-username/your-repo/main/assets/banner.png" alt="TiffinTales Banner" />
</p>

<h1 align="center">🍱 TiffinTales</h1>

<p align="center">
  A high-performance, multi-sided marketplace connecting local home chefs with urban professionals.
</p>

<p align="center">
  <a href="https://drive.google.com/file/d/1PSu0GwwNXMmHxcADTxF7kFhHuUYcI4G4/view?usp=sharing">
    <b>📲 Download Production APK</b>
  </a>
</p>

---

## 🚀 Executive Summary

**TiffinTales** is a hyperlocal food delivery ecosystem engineered for scale. Building a delivery platform requires handling complex, asynchronous state across multiple actors. TiffinTales solves this by providing a unified, real-time infrastructure that seamlessly orchestrates separate flows for **Customers**, **Kitchens**, and **Delivery Fleet Partners**.

---

## 🧠 Core Engineering Achievements

* ⚡ **Multi-Sided Realtime Infrastructure:** Leveraged Supabase WebSockets to implement sub-second, multi-way order synchronization. When a chef updates an order status, the customer and assigned rider UIs update instantly without polling.
* 🛡️ **Zero-Dependency Design System:** Bypassed heavy, off-the-shelf UI kits (like NativeBase or UI Kitten). Designed and engineered a proprietary component library from scratch to ensure strict memory management and sustained 60fps animations.
* 📡 **Network-Resilient UX:** Engineered an offline-first caching layer using `AsyncStorage`. The application degrades gracefully in low-connectivity zones, allowing users to browse cached menus without network timeouts.
* 🗺️ **Native Device Orchestration:** Built secure, lifecycle-aware integrations for native device APIs, including precise geolocation tracking, camera access, and local file storage.
* 🔐 **Granular RBAC (Role-Based Access Control):** Implemented strict routing and authentication barriers at the database level to ensure data isolation between the three distinct user roles.

---

## 🏗️ Systems Architecture

```text
┌──────────────────────┐        ┌──────────────────────┐
│  React Native App    │        │   Admin Web Panel    │
│  (Users / Chefs /    │        │     (Next.js)        │
│   Riders)            │        │                      │
└──────────┬───────────┘        └──────────┬───────────┘
           │                               │
           └───────────────┬───────────────┘
                           │
                   ┌───────▼────────┐
                   │   Supabase     │
                   │ ◦ Auth & RLS   │
                   │ ◦ PostgreSQL   │
                   │ ◦ Realtime WS  │
                   │ ◦ Edge Storage │
                   └────────────────┘
