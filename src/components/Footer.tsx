import React from 'react';
import { Phone, Clock, MapPin } from 'lucide-react';
import { ScreenName } from '../types';
import { tendozBrandLogoImg } from '../data/initialData';

interface FooterProps {
  onNavigate?: (screen: ScreenName) => void;
  onReplayLaunchSkeleton?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onReplayLaunchSkeleton }) => {
  return (
    <footer className="w-full bg-white text-neutral-900 border-t border-neutral-200/80 pt-6 pb-28 font-sans select-none">
      <div className="max-w-xl mx-auto px-4 sm:px-6 space-y-6">

        {/* ============================================================ */}
        {/* 1. TOP OVERVIEW CARD                                         */}
        {/* ============================================================ */}
        <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-3xl p-4 sm:p-5 shadow-2xs">
          <h2 className="text-base sm:text-lg font-black text-black tracking-tight leading-snug mb-3">
            Flavorful Handcrafted Fast Food & Crispy Broast, Ready for You at Tendoz
          </h2>

          <div className="bg-white border border-neutral-200/70 rounded-2xl p-4 sm:p-4.5 shadow-2xs">
            <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed font-normal">
              Enjoy an authentic fast food dining experience at{' '}
              <strong className="text-[#DC2626] font-bold">Tendoz</strong>. From juicy
              handcrafted Burgers and cheesy stone-baked Pizza to loaded crispy Wraps,
              spice-injected golden broast, and loaded crispy fries, we bring you bold
              cravings prepared fresh daily with premium ingredients and signature
              sauces. Visit us in Sahiwal or order online!
            </p>
          </div>
        </div>

        {/* Separator Line */}
        <div className="w-full h-px bg-neutral-200/80" />

        {/* ============================================================ */}
        {/* 2. BRAND LOGO & TITLE ROW                                    */}
        {/* ============================================================ */}
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div className="shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 aspect-square rounded-2xl overflow-hidden flex items-center justify-center bg-white border border-neutral-200/80 shadow-2xs">
              <img
                src={tendozBrandLogoImg}
                alt="Tendoz Logo"
                className="w-full h-full object-contain select-none"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div>
            <h3 className="font-black text-lg sm:text-xl text-neutral-900 tracking-tight leading-tight">
              Tendoz 
            </h3>
            <p className="text-xs sm:text-[13px] font-extrabold text-[#DC2626] uppercase tracking-wider leading-none mt-1">
              Crispy Cheesey & Saucy
            </p>
            <p className="text-[11px] sm:text-xs text-neutral-500 font-medium mt-1">
              Near Pilot Girls School, Sahiwal, Punjab
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. STORE INFO & CONTACT CARD                                  */}
        {/* ============================================================ */}
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
          
          {/* 1. PHONE */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#DC2626] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Phone className="w-4.5 h-4.5 fill-current stroke-none" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  PHONE
                </span>
                <a
                  href="tel:03200089000"
                  className="font-black text-sm sm:text-base text-neutral-900 hover:text-[#DC2626] transition-colors tracking-tight block truncate"
                >
                  03200089000
                </a>
              </div>
            </div>

            <a
              href="tel:03200089000"
              className="px-3.5 py-1.5 rounded-full bg-red-50 text-[#DC2626] hover:bg-[#DC2626] hover:text-white border border-red-200/60 text-[11px] font-bold shrink-0 transition-colors shadow-2xs"
            >
              Tap to Call
            </a>
          </div>

          {/* Divider */}
          <div className="h-px bg-neutral-100" />

          {/* 2. OPENING HOURS */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#FFCE00]/25 border border-[#FFCE00]/60 text-[#900000] flex items-center justify-center shrink-0">
                <Clock className="w-4.5 h-4.5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  OPENING HOURS
                </span>
                <span className="font-black text-sm text-neutral-900 tracking-tight block truncate">
                  10:30 AM – 2:30 AM
                </span>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-[#FFCE00]/20 text-[#8B0000] border border-[#FFCE00]/50 text-[11px] font-extrabold shrink-0">
              Open Daily
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-neutral-100" />

          {/* 3. ADDRESS */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 text-[#DC2626] flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                ADDRESS
              </span>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Tendoz+Sahiwal+Near+Pilot+Girls+School+Sahiwal+Punjab"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-xs sm:text-[13px] text-neutral-900 hover:text-[#DC2626] transition-colors leading-snug mt-0.5 block hover:underline"
              >
                Tendoz Sahiwal, Near Pilot Girls School, Sahiwal, Punjab.
              </a>
            </div>
          </div>

        </div>

        {/* ============================================================ */}
        {/* 4. FOLLOW US & SOCIAL MEDIA ICONS ROW                        */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <h4 className="font-bold text-neutral-900 text-sm tracking-tight">
            Follow Us
          </h4>

          {/* Neatly grouped with consistent spacing and authentic standard vectors */}
          <div className="flex items-center gap-3">
            {/* Instagram Circle Button */}
            <a
              href="https://www.instagram.com/tendoz.official?psln=a2J5aXNhMWhjbGZv"
              target="_blank"
              rel="noopener noreferrer"
              title="Instagram @tendoz.official"
              aria-label="Follow Tendoz on Instagram"
              className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-all shrink-0"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 shrink-0"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>

            {/* Facebook Circle Button (Authentic Standard Facebook 'f' Vector) */}
            <a
              href="https://www.facebook.com/share/1Ro9HvmYUM/"
              target="_blank"
              rel="noopener noreferrer"
              title="Facebook Tendoz"
              aria-label="Follow Tendoz on Facebook"
              className="w-11 h-11 rounded-full bg-[#1877F2] hover:bg-[#166fe5] text-white flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-all shrink-0"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 shrink-0"
              >
                <path d="M14 13.5h2.5l1-4H14v-2c0-1.03.54-1.5 1.75-1.5H17.5V2.5c-.75-.12-1.78-.2-2.8-.2-3.2 0-5.2 1.84-5.2 5.2v2H6.5v4h3V22h4.5v-8.5z" />
              </svg>
            </a>

            {/* TikTok Circle Button (Authentic Standard TikTok Note Vector - Black Background) */}
            <a
              href="https://www.tiktok.com/@tendoz.official?lang=en&is_from_webapp=1&sender_device=mobile&sender_web_id=7694526960625960454"
              target="_blank"
              rel="noopener noreferrer"
              title="TikTok @tendoz.official"
              aria-label="Follow Tendoz on TikTok"
              className="w-11 h-11 rounded-full bg-black hover:bg-neutral-900 text-white flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-all shrink-0"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 shrink-0"
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
              </svg>
            </a>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 5. MINIMAL BOTTOM LINKS                                      */}
        {/* ============================================================ */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400 font-medium">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate && onNavigate('home')}
              className="hover:text-neutral-700 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => onNavigate && onNavigate('home')}
              className="hover:text-neutral-700 transition-colors cursor-pointer"
            >
              FAQs
            </button>
            <span>•</span>
            <button
              onClick={() => onNavigate && onNavigate('admin')}
              className="hover:text-neutral-700 transition-colors cursor-pointer"
            >
              Admin
            </button>
          </div>
          <p className="text-[11px] text-neutral-400">
            © {new Date().getFullYear()} Tendoz. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
};
