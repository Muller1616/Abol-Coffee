import { motion } from 'framer-motion'
import { LayoutDashboard, Layers, Coffee, Settings, QrCode, Smartphone, ImagePlus, EyeOff, Download, DollarSign } from 'lucide-react'
import { useState } from 'react'

type PreviewTab = 'dashboard' | 'categories' | 'items' | 'settings' | 'qr' | 'preview'

const PREVIEW_TABS = [
  { id: 'dashboard' as PreviewTab, label: 'Dashboard Overview', icon: LayoutDashboard },
  { id: 'categories' as PreviewTab, label: 'Manage Categories', icon: Layers },
  { id: 'items' as PreviewTab, label: 'Menu Items & Prices', icon: Coffee },
  { id: 'settings' as PreviewTab, label: 'Restaurant Settings', icon: Settings },
  { id: 'qr' as PreviewTab, label: 'QR Code Download', icon: QrCode },
  { id: 'preview' as PreviewTab, label: 'Guest Smartphone View', icon: Smartphone },
]

export function PreviewSection() {
  const [activeTab, setActiveTab] = useState<PreviewTab>('dashboard')

  return (
    <section id="preview" className="relative bg-[#06120f] py-24 text-white sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-300"
          >
            <span>Console & Menu Experience</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl"
          >
            Restaurant Dashboard & Menu Preview
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-base text-white/70 sm:text-lg"
          >
            See exactly how you manage your restaurant's digital menu and how it appears to your customers.
          </motion.p>

          {/* Interactive Feature Highlights Bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-amber-300">
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 border border-white/10">
              <Layers className="h-3.5 w-3.5 text-emerald-400" /> Manage Categories
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 border border-white/10">
              <DollarSign className="h-3.5 w-3.5 text-amber-400" /> Update Prices
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 border border-white/10">
              <ImagePlus className="h-3.5 w-3.5 text-teal-400" /> Upload Images
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 border border-white/10">
              <EyeOff className="h-3.5 w-3.5 text-red-400" /> Hide Unavailable Items
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 border border-white/10">
              <Download className="h-3.5 w-3.5 text-amber-400" /> Download QR Code
            </span>
          </div>
        </div>

        {/* Tab Navigation Pills */}
        <div className="mt-10 flex overflow-x-auto justify-start sm:justify-center gap-2 pb-2 no-scrollbar">
          {PREVIEW_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'bg-white/10 text-white/80 hover:bg-white/15 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Display Area */}
        <div className="mt-8 flex justify-center">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-5xl overflow-hidden rounded-4xl border-4 border-white/15 bg-slate-950 text-white shadow-2xl"
          >
            {/* Window Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#06120f] px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-red-400/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                <span className="ml-2 text-xs font-bold text-white/90">
                  Abol Coffee Console — {PREVIEW_TABS.find((t) => t.id === activeTab)?.label}
                </span>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-400/30">
                Live System Preview
              </span>
            </div>

            {/* Window Content Body */}
            <div className="p-6 sm:p-8 bg-[#091a15]">
              {/* TAB 1: Dashboard Overview */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-xs text-white/60">Total Active Items</p>
                      <p className="mt-2 text-3xl font-extrabold text-amber-300">32 Items</p>
                      <p className="mt-1 text-[11px] text-emerald-400">✓ Synchronized in real time</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-xs text-white/60">Active Categories</p>
                      <p className="mt-2 text-3xl font-extrabold text-amber-300">5 Sections</p>
                      <p className="mt-1 text-[11px] text-emerald-400">Coffee, Pastries, Fresh Juice...</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-xs text-white/60">Restaurant Status</p>
                      <p className="mt-2 text-3xl font-extrabold text-emerald-400">ACTIVE</p>
                      <p className="mt-1 text-[11px] text-white/60">Public menu live & accessible</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h4 className="text-sm font-bold text-white">Recent Admin Activity</h4>
                    <ul className="mt-4 space-y-3 text-xs text-white/80">
                      <li className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span>Updated price for "Special Macchiato" to 150 ETB</span>
                        <span className="text-[10px] text-white/50">2 mins ago</span>
                      </li>
                      <li className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span>Added new item "Artisanal Butter Croissant"</span>
                        <span className="text-[10px] text-white/50">1 hour ago</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Downloaded high-resolution PNG QR Code for table prints</span>
                        <span className="text-[10px] text-white/50">Yesterday</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 2: Categories */}
              {activeTab === 'categories' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">Category Management</h4>
                      <p className="text-xs text-white/60">Create, reorder, and toggle category visibility</p>
                    </div>
                    <span className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950">
                      + Add Category
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {['☕ Coffee & Espresso', '🥐 Artisanal Pastries', '🍹 Cold Refreshers', '🍰 House Desserts'].map((cat) => (
                      <div key={cat} className="flex items-center justify-between rounded-xl bg-white/10 p-3.5 text-xs">
                        <span className="font-bold text-white">{cat}</span>
                        <div className="flex items-center gap-3">
                          <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                            Visible
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: Menu Items */}
              {activeTab === 'items' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">Menu Item & Price Management</h4>
                      <p className="text-xs text-white/60">Update prices in ETB, upload dish photos, and toggle stock</p>
                    </div>
                    <span className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950">
                      + Create Item
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl bg-white/10 p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">☕</span>
                        <div>
                          <p className="text-xs font-bold text-white">Special Macchiato</p>
                          <p className="text-[10px] text-amber-300 font-bold">150 ETB</p>
                        </div>
                      </div>
                      <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300">
                        In Stock
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-white/10 p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">𫞂</span>
                        <div>
                          <p className="text-xs font-bold text-white">Jebena Traditional Brew</p>
                          <p className="text-[10px] text-amber-300 font-bold">180 ETB</p>
                        </div>
                      </div>
                      <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300">
                        In Stock
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Restaurant Settings */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white border-b border-white/10 pb-3">
                    Restaurant Settings & Opening Hours
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2 text-xs">
                    <div className="space-y-2 rounded-xl bg-white/5 p-4">
                      <p className="font-bold text-amber-300">Restaurant Name</p>
                      <p className="text-white">Abol Coffee & Roastery</p>
                    </div>
                    <div className="space-y-2 rounded-xl bg-white/5 p-4">
                      <p className="font-bold text-amber-300">Phone & Location</p>
                      <p className="text-white">+251 911 234 567 • Bole Road, Addis Ababa</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: QR Code Download */}
              {activeTab === 'qr' && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-white p-2 shadow-xl">
                    <QrCode className="h-24 w-24 text-slate-900" />
                  </div>
                  <h4 className="mt-4 text-base font-bold text-white">Permanent Restaurant QR Code</h4>
                  <p className="mt-1 max-w-sm text-xs text-white/60">
                    Print this QR code for table stands and counter cards. It never changes even when you edit prices!
                  </p>
                </div>
              )}

              {/* TAB 6: Guest Smartphone View */}
              {activeTab === 'preview' && (
                <div className="mx-auto max-w-md rounded-2xl bg-white p-4 text-slate-900 shadow-xl">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Abol Coffee</p>
                      <p className="text-[10px] text-slate-500">Guest Mobile Smartphone Browser View</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Live Menu
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between rounded-xl bg-slate-50 p-2.5 text-xs">
                      <span>☕ Special Macchiato</span>
                      <span className="font-bold text-primary">150 ETB</span>
                    </div>
                    <div className="flex justify-between rounded-xl bg-slate-50 p-2.5 text-xs">
                      <span>𫞂 Jebena Brew</span>
                      <span className="font-bold text-primary">180 ETB</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
