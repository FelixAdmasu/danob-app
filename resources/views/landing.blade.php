<!DOCTYPE html><html lang="en" class="scroll-smooth"><head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <title>HEAL.ELITE | Modern Natural Therapy</title>
  <link href="https://fonts.googleapis.com" rel="preconnect">
  <link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect">
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&amp;family=Playfair+Display:ital,wght@0,400;0,700;1,400&amp;family=Albert+Sans:wght@300;400;500;600&amp;display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet">
  <script src="https://unpkg.com/@phosphor-icons/web"></script>

  <style>
    .animate-on-scroll-hidden { opacity: 0; transform: translateY(30px); transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-on-scroll-visible { opacity: 1; transform: translateY(0); }
    
    .stagger-1 { transition-delay: 0.1s; }
    .stagger-2 { transition-delay: 0.2s; }
    .stagger-3 { transition-delay: 0.3s; }
    .stagger-4 { transition-delay: 0.4s; }

    header { 
      transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease;
      transform: translate(-50%, 40px);
      opacity: 0;
    }

    /* Scrolled header state */
    #navbar.scrolled {
      background-color: #004953 !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      border-color: rgba(0, 0, 0, 0.05) !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 8px 40px rgba(0, 73, 83, 0.2) !important;
      border-radius: 9999px !important;
    }

    /* Custom Selection Color */
    ::selection { background-color: #004953; color: #F9F7F2; }

    /* Mobile Menu Transition */
    #mobile-menu {
      transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      clip-path: circle(0% at 90% 5%);
      visibility: hidden;
    }
    #mobile-menu.active {
      clip-path: circle(150% at 90% 5%);
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }

    .mobile-link-item {
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    #mobile-menu.active .mobile-link-item {
      opacity: 1;
      transform: translateY(0);
    }

    /* Dropdown styles */
    .dropdown-menu {
      opacity: 0;
      visibility: hidden;
      transform: translateY(8px);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
    }
    .dropdown-trigger:hover .dropdown-menu,
    .dropdown-trigger:focus-within .dropdown-menu {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
      pointer-events: auto;
    }
  </style>
   
<style type="text/tailwindcss">@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  #app-root {
    @apply text-text-secondary;
  }
  
  h1, h2, h3 {
    @apply font-primary;
  }
}</style><script src="https://cdn.tailwindcss.com"></script><script>tailwind.config = {
  important: '#app-root',
  theme: {
    extend: {
      colors: {
        'brand-primary': '#004953', // Midnight Green
        'brand-secondary': '#F9F7F2', // Beige
        'brand-accent': '#F0ECE6', // Modern Stone/Beige from new style
        'neutral-background': '#F9F7F2', // Beige
        'neutral-surface': 'rgba(247, 240, 232, 0)',
        'text-primary': '#3E2723', // Brown for headings
        'text-secondary': '#5D4037', // Lighter Brown for body
        'text-onPrimary': '#FFFFFF', // Pure white text on dark backgrounds
        'text-muted': '#AEAEAE',
      },
      fontFamily: {
        'primary': ['Playfair Display', 'serif'],
        'secondary': ['Inter Tight', 'sans-serif'],
        'accent': ['Albert Sans', 'sans-serif'],
      },
      borderRadius: {
        'custom': '18.8225px',
        'btn': '117.641px',
        'xl': '20px',
        '2xl': '24px',
      },
      spacing: {
        's': '16px',
        'm': '24px',
        'l': '32px',
        'xl': '48px',
        'section': '128px',
      },
      boxShadow: {
        'cta': '0 10px 30px rgba(0, 73, 83, 0.2)',
        'card': '0 20px 40px rgba(62, 39, 35, 0.05)',
        'card-active': '0 8px 20px rgba(0, 0, 0, 0.1)',
        'img-stack': '-2px 4px 15px rgba(0, 0, 0, 0.25)',
      }
    }
  }
}</script></head>

<body id="app-root">
  <div class="font-secondary bg-neutral-background text-text-secondary overflow-x-hidden min-h-screen flex flex-col w-full relative">
    
    <header class="fixed top-4 md:top-6 left-1/2 z-[100] group/header w-[calc(100%-24px)] md:w-full max-w-[1440px] px-0 md:px-6 -translate-x-1/2" id="main-header">
      <div class="flex flex-col gap-3">
        <!-- Main Navbar -->
        <nav id="navbar" class="h-14 md:h-20 bg-brand-primary/95 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-between px-3 md:px-5 shadow-2xl transition-all duration-300 ease-in-out group-hover/header:-translate-y-1">
          <!-- Left: Brand & Links -->
          <div class="flex items-center gap-2 md:gap-4">
            <a href="/" class="relative group/logo">
              <div class="w-9 h-9 md:w-12 md:h-12 bg-brand-secondary rounded-full flex items-center justify-center text-brand-primary font-primary text-lg md:text-2xl shadow-lg group-hover/logo:rotate-[360deg] transition-transform duration-1000">H</div>
            </a>
            <div class="h-6 md:h-8 w-px bg-white/10 mx-1 md:mx-2"></div>
            <!-- Desktop Links -->
            <div class="hidden lg:flex items-center gap-1">
              <a href="#therapies" class="flex items-center gap-2 text-brand-secondary/80 hover:text-brand-secondary transition-colors text-[11px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full hover:bg-white/5">
                <i class="ph-bold ph-leaf"></i>
                Therapies
              </a>
              <a href="#philosophy" class="flex items-center gap-2 text-brand-secondary/80 hover:text-brand-secondary transition-colors text-[11px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full hover:bg-white/5">
                <i class="ph-bold ph-brain"></i>
                Philosophy
              </a>
              <a href="#pricing" class="flex items-center gap-2 text-brand-secondary/80 hover:text-brand-secondary transition-colors text-[11px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full hover:bg-white/5">
                <i class="ph-bold ph-crown"></i>
                Access
              </a>

              <!-- Analyze Dropdown -->
              <div class="relative dropdown-trigger">
                <button class="flex items-center gap-2 text-brand-secondary/80 hover:text-brand-secondary transition-colors text-[11px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full hover:bg-white/5">
                  <i class="ph-bold ph-chart-line-up"></i>
                  Analyze
                  <i class="ph-bold ph-caret-down text-[8px] ml-0.5 transition-transform dropdown-icon"></i>
                </button>
                <div class="dropdown-menu absolute top-full left-0 mt-2 w-64 bg-brand-secondary/95 backdrop-blur-md rounded-2xl border border-brand-primary/10 shadow-2xl p-4 z-50">
                  <a href="#philosophy" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-brand-primary/5 transition-colors group/item">
                    <div class="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover/item:bg-brand-primary group-hover/item:text-brand-secondary transition">
                      <i class="ph-bold ph-activity"></i>
                    </div>
                    <div>
                      <div class="text-sm font-semibold text-text-primary">System Diagnostics</div>
                      <div class="text-[10px] text-text-secondary">Biological baseline analysis</div>
                    </div>
                  </a>
                  <a href="#philosophy" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-brand-primary/5 transition-colors group/item">
                    <div class="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover/item:bg-brand-primary group-hover/item:text-brand-secondary transition">
                      <i class="ph-bold ph-chart-bar"></i>
                    </div>
                    <div>
                      <div class="text-sm font-semibold text-text-primary">Progress Metrics</div>
                      <div class="text-[10px] text-text-secondary">Track your recovery journey</div>
                    </div>
                  </a>
                  <a href="#philosophy" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-brand-primary/5 transition-colors group/item">
                    <div class="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover/item:bg-brand-primary group-hover/item:text-brand-secondary transition">
                      <i class="ph-bold ph-file-text"></i>
                    </div>
                    <div>
                      <div class="text-sm font-semibold text-text-primary">Clinical Reports</div>
                      <div class="text-[10px] text-text-secondary">Detailed health summaries</div>
                    </div>
                  </a>
                  <div class="border-t border-brand-primary/10 mt-2 pt-2">
                    <a href="#contact" class="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary text-brand-secondary rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform">
                      <i class="ph-bold ph-arrow-right"></i>
                      Request Analysis
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <!-- Mobile Brand Text -->
            <a href="/" class="lg:hidden font-primary text-base md:text-lg font-bold text-brand-secondary tracking-tighter ml-1">HEAL.ELITE</a>
          </div>

          <!-- Right: Actions -->
          <div class="flex items-center gap-1 md:gap-3">
            <button class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 text-brand-secondary/80 flex items-center justify-center hover:text-brand-secondary hover:bg-white/10 transition-all group/search">
              <i class="ph ph-magnifying-glass text-lg md:text-xl"></i>
            </button>
            <div class="h-6 md:h-8 w-px bg-white/10 mx-1 md:mx-2 hidden sm:block"></div>
            <a href="#contact" class="hidden sm:block bg-brand-secondary text-brand-primary text-[10px] md:text-[11px] font-bold uppercase tracking-widest px-6 md:px-8 py-3 md:py-3.5 rounded-full hover:bg-white transition-all shadow-xl shadow-black/20 active:scale-95">
              Request Access
            </a>
            
            <!-- Mobile Menu Toggle -->
            <button id="mobile-menu-toggle" class="lg:hidden text-brand-secondary p-1 md:p-2 focus:outline-none flex items-center justify-center relative z-[200]">
              <span class="material-symbols-outlined text-2xl md:text-3xl">menu</span>
            </button>
          </div>
        </nav>

        <!-- Desktop Mega-Menu Drawer -->
        <div class="relative w-full hidden lg:block">
          <div class="absolute left-0 right-0 top-0 bg-brand-secondary/95 backdrop-blur-md rounded-[2.5rem] border border-brand-primary/10 opacity-0 -translate-y-4 pointer-events-none group-hover/header:opacity-100 group-hover/header:pointer-events-auto group-hover/header:translate-y-0 shadow-2xl transition-all duration-500 p-10">
            <div class="grid grid-cols-4 gap-12">
              <div class="col-span-1">
                <div class="text-[10px] font-bold text-brand-primary/70 uppercase tracking-[0.3em] mb-8">Clinical Focus</div>
                <div class="flex flex-col gap-5">
                  <a href="#" class="group/link flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary group-hover/link:bg-brand-primary group-hover/link:text-brand-secondary transition duration-300"><i class="ph-bold ph-needle"></i></div>
                    <span class="text-sm font-semibold text-text-primary">Acupuncture Studio</span>
                  </a>
                  <a href="#" class="group/link flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary group-hover/link:bg-brand-primary group-hover/link:text-brand-secondary transition duration-300"><i class="ph-bold ph-flask"></i></div>
                    <span class="text-sm font-semibold text-text-primary">Botanical Lab</span>
                  </a>
                  <a href="#" class="group/link flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary group-hover/link:bg-brand-primary group-hover/link:text-brand-secondary transition duration-300"><i class="ph-bold ph-person-simple-run"></i></div>
                    <span class="text-sm font-semibold text-text-primary">Structural Flow</span>
                  </a>
                </div>
              </div>
              <div class="col-span-1 border-l border-brand-primary/10 pl-12">
                <div class="text-[10px] font-bold text-brand-primary/70 uppercase tracking-[0.3em] mb-8">Resources</div>
                <div class="flex flex-col gap-5">
                  <a href="#" class="text-sm font-semibold text-text-secondary hover:text-brand-primary transition">Our Philosophy</a>
                  <a href="#" class="text-sm font-semibold text-text-secondary hover:text-brand-primary transition">Clinical Data</a>
                  <a href="#" class="text-sm font-semibold text-text-secondary hover:text-brand-primary transition">Facility Tour</a>
                  <a href="#" class="text-sm font-semibold text-text-secondary hover:text-brand-primary transition">Help Desk</a>
                </div>
              </div>
              <div class="col-span-2 bg-brand-primary/5 rounded-[32px] p-8 flex flex-col justify-between border border-brand-primary/5">
                <div>
                  <span class="bg-brand-primary text-brand-secondary text-[9px] font-bold px-3 py-1.5 rounded-full uppercase mb-4 inline-block tracking-widest">Biological Insight</span>
                  <h4 class="text-2xl font-primary italic text-text-primary mb-3">The Neuroscience of Flow</h4>
                  <p class="text-sm text-text-secondary leading-relaxed mb-6 opacity-80">Discover how our protocol optimizes neural coherence through synchronized sensory deprivation and somatic work.</p>
                </div>
                <a href="#" class="text-brand-primary font-bold text-xs flex items-center gap-3 group/btn uppercase tracking-widest">
                  Read Protocol <i class="ph-bold ph-arrow-right group-hover/btn:translate-x-2 transition-transform"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Mobile Menu Overlay -->
    <div id="mobile-menu" class="fixed inset-0 bg-brand-secondary z-[200] flex flex-col items-center justify-center opacity-0 pointer-events-none">
      <button id="mobile-menu-close" class="absolute top-8 right-8 text-brand-primary p-2 flex items-center justify-center">
        <span class="material-symbols-outlined text-4xl">close</span>
      </button>
      
      <div class="flex flex-col items-center gap-8 text-center px-6 w-full max-w-sm">
        <div class="mobile-link-item delay-[100ms] mb-4">
          <a href="/" class="font-primary text-4xl font-bold text-brand-primary tracking-tighter inline-block">HEAL.ELITE</a>
        </div>
        
        <nav class="flex flex-col items-center gap-5 w-full">
          <div class="mobile-link-item delay-[200ms] w-full">
            <a href="#therapies" class="text-xl font-primary text-text-primary hover:text-brand-primary transition-colors mobile-link block py-2 border-b border-brand-primary/5">Therapies</a>
          </div>
          <div class="mobile-link-item delay-[300ms] w-full">
            <a href="#philosophy" class="text-xl font-primary text-text-primary hover:text-brand-primary transition-colors mobile-link block py-2 border-b border-brand-primary/5">Philosophy</a>
          </div>
          <div class="mobile-link-item delay-[400ms] w-full">
            <a href="#pricing" class="text-xl font-primary text-text-primary hover:text-brand-primary transition-colors mobile-link block py-2 border-b border-brand-primary/5">Access</a>
          </div>

          <!-- Mobile Analyze Dropdown -->
          <div class="mobile-link-item delay-[450ms] w-full">
            <div class="text-xl font-primary text-text-primary hover:text-brand-primary transition-colors block py-2 border-b border-brand-primary/5 cursor-pointer" id="mobile-analyze-toggle">
              <span class="flex items-center justify-between">
                Analyze
                <span class="material-symbols-outlined text-lg transition-transform" id="mobile-analyze-icon">expand_more</span>
              </span>
            </div>
            <div class="overflow-hidden transition-all duration-500 max-h-0" id="mobile-analyze-submenu">
              <div class="pl-4 py-2 space-y-1">
                <a href="#philosophy" class="mobile-link block py-2 text-sm font-semibold text-text-secondary hover:text-brand-primary transition-colors">System Diagnostics</a>
                <a href="#philosophy" class="mobile-link block py-2 text-sm font-semibold text-text-secondary hover:text-brand-primary transition-colors">Progress Metrics</a>
                <a href="#philosophy" class="mobile-link block py-2 text-sm font-semibold text-text-secondary hover:text-brand-primary transition-colors">Clinical Reports</a>
              </div>
            </div>
          </div>
          
          <div class="mobile-link-item delay-[500ms] w-full grid grid-cols-1 gap-4 mt-4">
            <div class="text-[10px] font-bold text-brand-primary/50 uppercase tracking-[0.3em] mb-2">Modalities</div>
            <a href="#" class="text-sm font-semibold text-text-secondary mobile-link">Acupuncture Studio</a>
            <a href="#" class="text-sm font-semibold text-text-secondary mobile-link">Botanical Lab</a>
            <a href="#" class="text-sm font-semibold text-text-secondary mobile-link">Structural Flow</a>
          </div>

          <div class="mobile-link-item delay-[600ms] mt-8 w-full">
            <a href="#contact" class="bg-brand-primary text-brand-secondary block w-full py-4 rounded-full text-[12px] font-bold uppercase tracking-widest mobile-link shadow-xl">Request Access</a>
          </div>
        </nav>
        
        <div class="mobile-link-item delay-[700ms] mt-8 pt-8 border-t border-brand-primary/10 w-full">
          <p class="text-[9px] font-bold uppercase tracking-[0.3em] text-brand-primary/50">Established in Modern Antiquity</p>
        </div>
      </div>
    </div>

    <main class="flex-grow"><section class="relative min-h-screen w-full bg-neutral-background flex flex-col items-center pt-40 lg:pt-56 pb-12 lg:pb-24 px-4 lg:px-[36px] overflow-hidden" id="hero">
  <div class="w-full max-w-[1505px] mx-auto flex flex-col items-center">
    
    <div class="w-full mb-12 lg:mb-24">
      <h1 data-animation-on-scroll="" data-editable="text" data-path="hero.heading" class="text-3xl md:text-5xl lg:text-7xl leading-[1.1] md:leading-[1] text-text-primary text-center font-primary tracking-tight">
        YOUR VITALITY IS PRECIOUS.<br class="hidden md:block"> WE RESTORE IT.
      </h1>
    </div>

    <div class="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-0 items-end">
      
      <div class="lg:col-span-4 space-y-6 lg:space-y-8 px-2 lg:pl-[38px]">
        <p data-editable="text" data-path="hero.subtext" class="text-[16px] lg:text-[17.6px] leading-[1.6] text-text-secondary max-w-[412px]">
          Beyond temporary fixes. We combine ancestral healing modalities with modern diagnostic insight to recalibrate your biological clock and mental fortitude.
        </p>
        <a href="#therapies" data-editable="text" data-path="hero.cta" class="inline-flex items-center justify-center bg-brand-primary text-text-onPrimary rounded-btn px-8 lg:px-[35px] py-3 lg:py-[11.7px] min-h-[56px] lg:min-h-[62px] min-w-full sm:min-w-[209px] transition-transform hover:scale-105 shadow-cta uppercase font-bold tracking-widest text-[11px] lg:text-[13px]">
          Explore Modalities
        </a>
      </div>

      <div class="lg:col-span-8 flex flex-wrap lg:flex-nowrap justify-center lg:justify-end gap-4 md:gap-6 pb-12 lg:pb-0 px-2">
        
        <!-- Image 1 - Wellness Sanctuary -->
        <div data-animation-on-scroll="" class="relative w-[45%] sm:w-[220px] h-[280px] sm:h-[320px] rounded-custom overflow-hidden shadow-2xl transform lg:translate-y-12 group/reveal">
          <img src="https://images.pexels.com/photos/3958517/pexels-photo-3958517.jpeg?w=600&h=800&fit=crop" alt="Natural Botanicals" class="w-full h-full object-cover">
          <div class="absolute inset-0 grid grid-cols-3 grid-rows-4 pointer-events-none">
            <div class="bg-neutral-background transition-all duration-500 delay-[100ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[400ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[200ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[600ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[300ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[700ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[150ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[500ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[250ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[800ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[350ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[450ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
          </div>
        </div>

        <!-- Image 2 - Herbal Medicine -->
        <div data-animation-on-scroll="" class="relative w-[45%] sm:w-[220px] h-[280px] sm:h-[320px] rounded-custom overflow-hidden shadow-2xl transform lg:translate-y-4 group/reveal stagger-2">
          <img src="https://images.pexels.com/photos/5480036/pexels-photo-5480036.jpeg?w=600&h=800&fit=crop" alt="The Sanctuary" class="w-full h-full object-cover">
          <div class="absolute inset-0 grid grid-cols-3 grid-rows-4 pointer-events-none">
            <div class="bg-neutral-background transition-all duration-500 delay-[500ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[200ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[600ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[100ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[700ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[300ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[800ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[400ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[150ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[900ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[250ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[350ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
          </div>
        </div>

        <!-- Image 3 - Acupuncture -->
        <div data-animation-on-scroll="" class="relative hidden sm:block w-full sm:w-[220px] h-[320px] rounded-custom overflow-hidden shadow-2xl group/reveal stagger-3">
          <img src="https://images.pexels.com/photos/7176137/pexels-photo-7176137.jpeg?w=600&h=800&fit=crop" alt="Clinical Precision" class="w-full h-full object-cover">
          <div class="absolute inset-0 grid grid-cols-3 grid-rows-4 pointer-events-none">
            <div class="bg-neutral-background transition-all duration-500 delay-[300ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[700ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[200ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[800ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[100ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[600ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[400ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[900ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[150ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[500ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[350ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
            <div class="bg-neutral-background transition-all duration-500 delay-[450ms] group-[.animate-on-scroll-visible]/reveal:opacity-0 group-[.animate-on-scroll-visible]/reveal:scale-0"></div>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>

<!-- Philosophy Section -->
<section class="py-20 lg:py-32 px-6 bg-brand-secondary overflow-hidden" id="philosophy">
  <div class="max-w-[1505px] mx-auto">
    <div class="mb-16 lg:mb-24 text-center max-w-3xl mx-auto">
      <h6 data-animation-on-scroll="" class="text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.4em] text-brand-primary mb-6">Our Protocol</h6>
      <h2 data-animation-on-scroll="" class="text-3xl md:text-5xl lg:text-6xl font-primary text-text-primary leading-[1.1] mb-8 stagger-1">THE PATH TO PEAK RADIANCE.</h2>
      <p data-animation-on-scroll="" class="text-text-secondary text-base lg:text-lg leading-relaxed stagger-2">
        We've digitized the wisdom of centuries to provide a systematic, data-driven approach to cellular restoration and neurological flow.
      </p>
    </div>

    <div class="hidden lg:grid grid-cols-2 border border-brand-primary/10 rounded-[40px] overflow-hidden h-[600px] bg-white shadow-card" data-animation-on-scroll="">
      
      <!-- Left Side: Tabs -->
      <div class="border-r border-brand-primary/10 flex flex-col bg-white">
        <!-- Step 1 -->
        <button type="button" data-step-tab="0" class="relative w-full text-left py-10 px-12 flex items-start gap-8 border-b border-brand-primary/5 transition-all duration-300 group">
          <div class="pointer-events-none absolute bottom-0 left-0 h-[2px] bg-brand-primary/10 w-full overflow-hidden">
              <div data-step-progress="" class="h-full bg-brand-primary w-full origin-left transition-transform duration-[4000ms] linear scale-x-0"></div>
          </div>
          <div class="shrink-0 mt-1 text-brand-primary">
            <span class="material-symbols-outlined">biotech</span>
          </div>
          <div>
            <h3 class="font-primary text-lg font-semibold text-text-primary tracking-tight">1. Biological Intelligence</h3>
            <div class="overflow-hidden transition-all duration-500 max-h-0 opacity-0 step-detail">
              <p class="text-[14px] pt-3 text-text-secondary leading-relaxed">Advanced functional diagnostics. We map your DNA, microbiome, and blood chemistry to define the baseline for your recovery.</p>
            </div>
          </div>
        </button>

        <!-- Step 2 -->
        <button type="button" data-step-tab="1" class="relative w-full text-left py-10 px-12 flex items-start gap-8 border-b border-brand-primary/5 transition-all duration-300 group">
          <div class="pointer-events-none absolute bottom-0 left-0 h-[2px] bg-brand-primary/10 w-full overflow-hidden">
              <div data-step-progress="" class="h-full bg-brand-primary w-full origin-left transition-transform duration-[4000ms] linear scale-x-0"></div>
          </div>
          <div class="shrink-0 mt-1 text-brand-primary">
            <span class="material-symbols-outlined">design_services</span>
          </div>
          <div>
            <h3 class="font-primary text-lg font-semibold text-text-primary tracking-tight">2. Custom Protocol Design</h3>
            <div class="overflow-hidden transition-all duration-500 max-h-0 opacity-0 step-detail">
              <p class="text-[14px] pt-3 text-text-secondary leading-relaxed">Personalized therapeutic compounding. We select specific acupuncture vectors and botanical extracts tailored to your unique biology.</p>
            </div>
          </div>
        </button>

        <!-- Step 3 -->
        <button type="button" data-step-tab="2" class="relative w-full text-left py-10 px-12 flex items-start gap-8 border-b border-brand-primary/5 transition-all duration-300 group">
          <div class="pointer-events-none absolute bottom-0 left-0 h-[2px] bg-brand-primary/10 w-full overflow-hidden">
              <div data-step-progress="" class="h-full bg-brand-primary w-full origin-left transition-transform duration-[4000ms] linear scale-x-0"></div>
          </div>
          <div class="shrink-0 mt-1 text-brand-primary">
            <span class="material-symbols-outlined">auto_fix_high</span>
          </div>
          <div>
            <h3 class="font-primary text-lg font-semibold text-text-primary tracking-tight">3. Therapeutic Implementation</h3>
            <div class="overflow-hidden transition-all duration-500 max-h-0 opacity-0 step-detail">
              <p class="text-[14px] pt-3 text-text-secondary leading-relaxed">Synchronized modalities. Experience deep cellular work as we treat you in our private sanctuary, optimizing for neurological restoration.</p>
            </div>
          </div>
        </button>

        <!-- Step 4 -->
        <button type="button" data-step-tab="3" class="relative w-full text-left py-10 px-12 flex items-start gap-8 border-b last:border-b-0 border-brand-primary/5 transition-all duration-300 group">
          <div class="pointer-events-none absolute bottom-0 left-0 h-[2px] bg-brand-primary/10 w-full overflow-hidden">
              <div data-step-progress="" class="h-full bg-brand-primary w-full origin-left transition-transform duration-[4000ms] linear scale-x-0"></div>
          </div>
          <div class="shrink-0 mt-1 text-brand-primary">
            <span class="material-symbols-outlined">monitoring</span>
          </div>
          <div>
            <h3 class="font-primary text-lg font-semibold text-text-primary tracking-tight">4. Continuous Oversight</h3>
            <div class="overflow-hidden transition-all duration-500 max-h-0 opacity-0 step-detail">
              <p class="text-[14px] pt-3 text-text-secondary leading-relaxed">Real-time performance metrics. Our concierge team monitors your physiological data to ensure your legacy of health remains unbroken.</p>
            </div>
          </div>
        </button>
      </div>

      <!-- Right Side: Dynamic Visual Container -->
      <div class="philosophy-grid-bg relative flex items-center justify-center p-12 overflow-hidden min-h-[540px]">
          
          <!-- Content for Step 1 -->
          <div data-step-content="0" class="w-full max-w-[420px] h-full bg-white rounded-2xl border border-brand-primary/10 shadow-card text-xs overflow-hidden flex flex-col transition-all duration-500">
              <div class="h-[64px] flex items-center justify-between px-6 border-b border-brand-primary/5 bg-brand-secondary/30">
                  <span class="font-primary font-bold text-text-primary uppercase tracking-widest text-[10px]">Biometric Analysis</span>
                  <div class="flex gap-2">
                      <div class="w-2.5 h-2.5 rounded-full bg-brand-primary/40"></div>
                      <div class="w-2.5 h-2.5 rounded-full bg-brand-primary/20"></div>
                  </div>
              </div>
              <div class="p-8 space-y-6">
                  <div class="space-y-4">
                      <label class="text-[9px] uppercase tracking-[0.2em] text-text-secondary/50 font-bold">Biological Markers</label>
                      <div class="space-y-3">
                          <div class="flex items-center gap-4 p-4 border border-brand-primary/5 rounded-xl bg-neutral-background">
                              <div class="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                 <span class="material-symbols-outlined text-sm">bloodtype</span>
                              </div>
                              <div class="flex-1 h-1.5 bg-brand-primary/5 rounded-full overflow-hidden">
                                  <div class="h-full bg-brand-primary w-[75%]"></div>
                              </div>
                              <span class="font-primary font-bold text-brand-primary">Optimum</span>
                          </div>
                          <div class="flex items-center gap-4 p-4 border border-brand-primary/5 rounded-xl bg-neutral-background">
                              <div class="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                 <span class="material-symbols-outlined text-sm">dna</span>
                              </div>
                              <div class="flex-1 h-1.5 bg-brand-primary/5 rounded-full overflow-hidden">
                                  <div class="h-full bg-brand-primary w-[92%]"></div>
                              </div>
                              <span class="font-primary font-bold text-brand-primary">92%</span>
                          </div>
                      </div>
                  </div>
                  <div class="p-5 bg-brand-primary rounded-xl text-text-onPrimary text-center">
                      <p class="font-primary text-[11px] uppercase tracking-widest">Baseline Locked</p>
                  </div>
              </div>
          </div>

          <!-- Content for Step 2 -->
          <div data-step-content="1" class="hidden w-full max-w-[420px] bg-white rounded-2xl border border-brand-primary/10 shadow-card text-xs overflow-hidden flex flex-col">
              <div class="p-8 bg-brand-primary text-text-onPrimary">
                  <h4 class="font-primary text-lg tracking-tight">Compounding Protocol</h4>
                  <p class="text-[11px] opacity-70">Synthesizing ancestral wisdom with data</p>
              </div>
              <div class="p-8 space-y-6">
                  <div class="grid grid-cols-2 gap-4">
                      <div class="h-28 border border-brand-primary/10 rounded-xl flex flex-col items-center justify-center bg-brand-secondary/20 gap-3">
                          <span class="material-symbols-outlined text-brand-primary">spa</span>
                          <span class="text-[9px] text-text-primary font-bold uppercase tracking-tighter">Botanical A</span>
                      </div>
                      <div class="h-28 border border-brand-primary/10 rounded-xl flex flex-col items-center justify-center bg-brand-secondary/20 gap-3">
                          <span class="material-symbols-outlined text-brand-primary">science</span>
                          <span class="text-[9px] text-text-primary font-bold uppercase tracking-tighter">Nootropic B</span>
                      </div>
                  </div>
                  <div class="p-5 border-2 border-dashed border-brand-primary/20 rounded-xl">
                      <div class="flex justify-between items-center text-[10px] mb-3">
                          <span class="font-bold text-brand-primary uppercase">Precision Dose</span>
                          <span class="text-text-secondary">0.45mg / kg</span>
                      </div>
                      <div class="h-2 bg-brand-primary/10 rounded-full">
                          <div class="h-full bg-brand-primary w-2/3"></div>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Content for Step 3 -->
          <div data-step-content="2" class="hidden w-full max-w-[420px] bg-white rounded-2xl border border-brand-primary/10 shadow-card text-xs overflow-hidden flex flex-col">
              <div class="h-16 border-b border-brand-primary/5 flex items-center px-6 gap-3">
                  <div class="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse"></div>
                  <span class="font-primary font-bold text-text-primary uppercase tracking-widest text-[10px]">Session Status: Restorative</span>
              </div>
              <div class="p-8 space-y-6">
                  <div class="aspect-video rounded-xl overflow-hidden bg-brand-secondary/40 relative">
                      <img src="https://images.pexels.com/photos/3958517/pexels-photo-3958517.jpeg?w=600&h=400&fit=crop" class="w-full h-full object-cover opacity-80" alt="Session">
                      <div class="absolute inset-0 bg-brand-primary/10 mix-blend-multiply"></div>
                  </div>
                  <div class="space-y-4">
                      <div class="flex justify-between text-[11px] font-bold font-primary uppercase tracking-tighter">
                          <span>Neural Coherence</span>
                          <span class="text-brand-primary">98.4%</span>
                      </div>
                      <div class="flex items-center gap-1">
                          <div class="h-8 flex-1 bg-brand-primary/5 rounded"></div>
                          <div class="h-12 flex-1 bg-brand-primary/10 rounded"></div>
                          <div class="h-16 flex-1 bg-brand-primary/20 rounded"></div>
                          <div class="h-10 flex-1 bg-brand-primary/10 rounded"></div>
                          <div class="h-14 flex-1 bg-brand-primary/5 rounded"></div>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Content for Step 4 -->
          <div data-step-content="3" class="hidden w-full max-w-[420px] h-[460px] bg-white rounded-2xl border border-brand-primary/10 shadow-card text-xs overflow-hidden flex flex-col">
              <div class="h-[72px] flex items-center justify-between px-8 border-b border-brand-primary/5">
                  <div class="flex items-center gap-4">
                      <div class="h-10 w-10 rounded-full bg-brand-primary flex items-center justify-center text-text-onPrimary">
                          <span class="material-symbols-outlined text-sm">shield_health</span>
                      </div>
                      <div>
                          <div class="font-primary font-bold text-text-primary uppercase tracking-widest">Concierge Oversight</div>
                          <div class="text-[10px] text-text-secondary uppercase tracking-tighter">Vitality Score: Optimal</div>
                      </div>
                  </div>
              </div>
              <div class="p-8 overflow-hidden flex-1 relative bg-brand-secondary/10">
                  <div class="space-y-6">
                      <div class="p-4 bg-white border border-brand-primary/5 rounded-xl shadow-sm">
                          <h5 class="text-[10px] font-bold uppercase tracking-widest text-brand-primary mb-2">Quarterly Outlook</h5>
                          <p class="text-text-secondary leading-relaxed text-[11px]">Biological age tracking indicates a deceleration of cellular senescence markers by 14%...</p>
                      </div>
                      
                      <div class="space-y-3">
                          <div class="flex justify-between items-center text-[10px] uppercase font-bold text-text-primary/60">
                              <span>Next Diagnostic</span>
                              <span>Oct 24, 2024</span>
                          </div>
                          <div class="border border-brand-primary/10 rounded-xl p-5 bg-white shadow-sm flex items-center gap-4">
                              <span class="material-symbols-outlined text-brand-primary">calendar_month</span>
                              <div class="flex-1">
                                  <div class="font-primary font-bold text-[12px]">Elite Health Review</div>
                                  <div class="text-[10px] text-text-secondary">Virtual Consultation with Dr. Aris</div>
                              </div>
                          </div>
                      </div>
                  </div>
                  <!-- Fade out overlay -->
                  <div class="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
              </div>
          </div>
      </div>
    </div>

    <!-- Mobile View (Stacked) -->
    <div class="lg:hidden space-y-12">
      <div class="bg-white p-8 rounded-[30px] border border-brand-primary/10 shadow-sm">
          <div class="philosophy-grid-bg h-[280px] rounded-2xl border border-brand-primary/5 mb-8 flex items-center justify-center p-6">
              <div class="bg-white rounded-xl shadow-card w-56 p-6 border border-brand-primary/5 text-[10px]">
                  <div class="font-primary font-bold uppercase tracking-widest mb-4">Diagnostic Phase</div>
                  <div class="h-1 bg-brand-primary/10 rounded-full mb-4">
                      <div class="h-full bg-brand-primary w-3/4"></div>
                  </div>
                  <div class="space-y-2 opacity-50">
                      <div class="h-2 w-full bg-brand-secondary rounded"></div>
                      <div class="h-2 w-2/3 bg-brand-secondary rounded"></div>
                  </div>
              </div>
          </div>
          <div class="space-y-4">
              <h3 class="font-primary text-xl font-bold flex items-center gap-4">
                <span class="material-symbols-outlined text-brand-primary">biotech</span>
                1. Diagnostic Precision
              </h3>
              <p class="text-text-secondary leading-relaxed">Mapping your internal landscape with functional data to identify the true root of imbalance.</p>
          </div>
      </div>
      <!-- Additional mobile steps would follow same pattern -->
      <div class="text-center pt-8">
          <p class="text-text-secondary text-[10px] uppercase tracking-[0.2em] font-bold italic">Discovery continues for all members</p>
      </div>
    </div>
  </div>
</section>

<!-- Therapies Grid -->
<section class="py-20 lg:py-32 px-6 bg-neutral-background overflow-hidden" id="therapies">
  <div class="max-w-[1505px] mx-auto">
    <div class="mb-16 lg:mb-20 text-center">
      <h2 data-animation-on-scroll="" class="text-3xl lg:text-6xl font-primary text-text-primary mb-6">THE MODALITIES</h2>
      <p data-animation-on-scroll="" class="text-text-secondary text-base lg:text-lg max-w-2xl mx-auto stagger-1">A curated selection of high-impact therapies designed for the modern constitution.</p>
    </div>

    <div id="feature-canvas" class="w-full flex items-center justify-center">
      <div class="bg-brand-accent p-2 md:p-4 rounded-2xl w-full flex flex-col md:flex-row gap-4 items-center justify-center min-h-[420px]">
        
        <!-- Feature 01 (Active State) -->
        <div data-feature-card="1" class="feature-card active bg-white/90 rounded-xl p-6 border-2 border-white shadow-card-active flex flex-col md:flex-row items-center gap-4 overflow-hidden relative cursor-pointer">
          <div class="flex-1 flex flex-col justify-between h-[300px] min-w-[200px]">
            <span class="text-brand-primary text-xl font-secondary font-semibold">01</span>
            <div class="mt-auto space-y-4 card-content">
              <h3 class="font-primary text-2xl lg:text-3xl tracking-tight text-text-primary">Clinical Acupuncture</h3>
              <p class="text-text-secondary text-[15px] leading-relaxed tracking-tight">Neuromodulation through precision needle placement to resolve chronic pain and systemic stress at the source.</p>
              <a href="#" class="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-brand-primary border-b border-brand-primary/20 pb-1">Details</a>
            </div>
          </div>
          
          <div class="flex flex-1 h-[220px] md:h-[300px] items-center justify-center relative mt-4 md:mt-0 mobile-img-container">
            <div class="w-full h-full rounded-2xl overflow-hidden relative translate-y-4 shadow-img-stack z-20">
                <img src="https://images.pexels.com/photos/7176137/pexels-photo-7176137.jpeg?w=800&h=1066&fit=crop" class="w-full h-full object-cover" alt="Clinical Acupuncture">
            </div>
            <div class="absolute inset-0 w-full h-full rounded-2xl overflow-hidden z-10 opacity-40">
                <img src="https://images.pexels.com/photos/3958517/pexels-photo-3958517.jpeg?w=800&h=1066&fit=crop" class="w-full h-full object-cover">
            </div>
          </div>
        </div>

        <!-- Feature 02 -->
        <div data-feature-card="2" class="feature-card bg-white/70 rounded-xl p-6 flex flex-col md:flex-row items-center gap-4 overflow-hidden relative cursor-pointer">
          <div class="flex-1 flex flex-col justify-between h-[300px] min-w-[200px]">
            <span class="text-brand-primary text-xl font-secondary font-semibold">02</span>
            <div class="mt-auto space-y-4 card-content">
              <h3 class="font-primary text-2xl lg:text-3xl tracking-tight text-text-primary">Botanical Medicine</h3>
              <p class="text-text-secondary text-[15px] leading-relaxed tracking-tight">Custom-compounded herbal formulations designed for your unique genetic profile and physiological needs.</p>
              <a href="#" class="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-brand-primary border-b border-brand-primary/20 pb-1">Details</a>
            </div>
          </div>
          <div class="flex flex-1 h-[220px] md:h-[300px] items-center justify-center relative mt-4 md:mt-0 mobile-img-container hidden">
            <div class="w-full h-full rounded-2xl overflow-hidden relative translate-y-4 shadow-img-stack z-20">
                <img src="https://images.pexels.com/photos/5480263/pexels-photo-5480263.jpeg?w=800&h=1066&fit=crop" class="w-full h-full object-cover" alt="Botanical Medicine">
            </div>
            <div class="absolute inset-0 w-full h-full rounded-2xl overflow-hidden z-10 opacity-40">
                <img src="https://images.pexels.com/photos/5480036/pexels-photo-5480036.jpeg?w=800&h=1066&fit=crop" class="w-full h-full object-cover">
            </div>
          </div>
        </div>

        <!-- Feature 03 -->
        <div data-feature-card="3" class="feature-card bg-white/70 rounded-xl p-6 flex flex-col md:flex-row items-center gap-4 overflow-hidden relative cursor-pointer">
          <div class="flex-1 flex flex-col justify-between h-[300px] min-w-[200px]">
            <span class="text-brand-primary text-xl font-secondary font-semibold">03</span>
            <div class="mt-auto space-y-4 card-content">
              <h3 class="font-primary text-2xl lg:text-3xl tracking-tight text-text-primary">Structural Alignment</h3>
              <p class="text-text-secondary text-[15px] leading-relaxed tracking-tight">Fascial release and spinal alignment to optimize neurological flow and restore your physical power.</p>
              <a href="#" class="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-brand-primary border-b border-brand-primary/20 pb-1">Details</a>
            </div>
          </div>
          <div class="flex flex-1 h-[220px] md:h-[300px] items-center justify-center relative mt-4 md:mt-0 mobile-img-container hidden">
            <div class="w-full h-full rounded-2xl overflow-hidden relative translate-y-4 shadow-img-stack z-20">
                <img src="https://images.pexels.com/photos/5888132/pexels-photo-5888132.jpeg?w=800&h=1066&fit=crop" class="w-full h-full object-cover" alt="Structural Integration">
            </div>
            <div class="absolute inset-0 w-full h-full rounded-2xl overflow-hidden z-10 opacity-40">
                <img src="https://images.pexels.com/photos/5794033/pexels-photo-5794033.jpeg?w=800&h=1066&fit=crop" class="w-full h-full object-cover">
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <style>
    /* Custom Accordion Sizing Logic scoped to therapies section */
    #therapies .feature-card {
      transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      width: 100%;
      height: 140px; /* Collapsed height for mobile */
      overflow: hidden;
    }

    #therapies .feature-card.active {
      height: 600px; /* Expanded height for mobile */
    }

    @media (min-width: 768px) {
      #therapies .feature-card {
        width: 280px;
        height: 360px; /* Uniform height for desktop */
      }
      #therapies .feature-card.active {
        width: 620px;
        height: 360px;
      }
    }

    #therapies .feature-card img {
      max-width: 100%;
      height: auto;
    }

    /* Philosophy Section Grid Bg */
    .philosophy-grid-bg {
      background-image: 
        linear-gradient(rgba(0, 73, 83, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 73, 83, 0.05) 1px, transparent 1px);
      background-size: 30px 30px;
      background-color: #F9F7F2;
    }
  </style>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Logic for Therapies Cards
      const therapiesSection = document.getElementById('therapies');
      if (therapiesSection) {
        const cards = therapiesSection.querySelectorAll('[data-feature-card]');
        const activateCard = (card) => {
          cards.forEach(c => {
            c.classList.remove('active', 'bg-white/90', 'shadow-card-active', 'border-2', 'border-white');
            c.classList.add('bg-white/70');
            const imgContainer = c.querySelector('.mobile-img-container');
            if(imgContainer) imgContainer.classList.add('hidden');
          });
          card.classList.add('active', 'bg-white/90', 'shadow-card-active', 'border-2', 'border-white');
          card.classList.remove('bg-white/70');
          const imgContainer = card.querySelector('.mobile-img-container');
          if(imgContainer) imgContainer.classList.remove('hidden');
        };
        cards.forEach(card => {
          card.addEventListener('mouseenter', () => { if (window.innerWidth >= 768) activateCard(card); });
          card.addEventListener('click', () => { activateCard(card); });
        });
      }

      // Logic for Philosophy Tabs
      const tabs = document.querySelectorAll('[data-step-tab]');
      const contents = document.querySelectorAll('[data-step-content]');
      if (tabs.length > 0) {
        let activeIndex = 0;
        const updateUI = (index) => {
          tabs.forEach((tab, i) => {
            const detail = tab.querySelector('.step-detail');
            const progressBar = tab.querySelector('[data-step-progress]');
            if (i === index) {
              tab.classList.add('bg-brand-secondary/40');
              if (detail) { detail.style.maxHeight = '200px'; detail.style.opacity = '1'; }
              if (progressBar) { progressBar.classList.remove('scale-x-0'); progressBar.classList.add('scale-x-100'); }
            } else {
              tab.classList.remove('bg-brand-secondary/40');
              if (detail) { detail.style.maxHeight = '0px'; detail.style.opacity = '0'; }
              if (progressBar) { progressBar.classList.add('scale-x-0'); progressBar.classList.remove('scale-x-100'); }
            }
          });
          contents.forEach((content, i) => {
            if (i === index) {
                content.classList.remove('hidden');
                content.classList.add('flex');
            } else {
                content.classList.add('hidden');
                content.classList.remove('flex');
            }
          });
        };
        tabs.forEach((tab, index) => {
          tab.addEventListener('click', () => { activeIndex = index; updateUI(activeIndex); });
        });
        updateUI(activeIndex);
      }
    });
  </script>
</section>

<!-- Membership/Pricing Section -->
<section class="py-20 lg:py-32 px-6 bg-text-primary text-neutral-background" id="pricing">
  <div class="max-w-[1505px] mx-auto">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
      <div class="lg:col-span-5 space-y-8 lg:space-y-12">
        <h2 data-animation-on-scroll="" class="font-primary text-3xl md:text-6xl leading-tight">INVEST IN YOUR LEGACY.</h2>
        <p data-animation-on-scroll="" class="text-neutral-background/60 text-base lg:text-lg leading-relaxed max-w-md stagger-1">
          True health is the ultimate leverage. Our membership models provide continuous oversight, ensuring you perform at your peak, indefinitely.
        </p>
        <div class="space-y-6 pt-4 lg:pt-8">
          <div data-animation-on-scroll="" class="flex items-center gap-6 stagger-2">
            <span class="text-brand-primary text-3xl lg:text-4xl font-primary">01</span>
            <p class="text-xs lg:text-sm font-semibold tracking-widest uppercase">Concierge Lab Oversight</p>
          </div>
          <div data-animation-on-scroll="" class="flex items-center gap-6 stagger-3">
            <span class="text-brand-primary text-3xl lg:text-4xl font-primary">02</span>
            <p class="text-xs lg:text-sm font-semibold tracking-widest uppercase">Unlimited Therapeutic Access</p>
          </div>
          <div data-animation-on-scroll="" class="flex items-center gap-6 stagger-4">
            <span class="text-brand-primary text-3xl lg:text-4xl font-primary">03</span>
            <p class="text-xs lg:text-sm font-semibold tracking-widest uppercase">Priority Scheduling</p>
          </div>
        </div>
      </div>

      <div class="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        <!-- Plan 1 -->
        <div data-animation-on-scroll="" class="bg-neutral-background/5 border border-neutral-background/10 p-8 lg:p-12 rounded-custom space-y-6 lg:space-y-8 stagger-1">
          <h4 class="text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-background/60">The Foundational</h4>
          <div class="flex items-baseline gap-1">
            <span class="text-3xl lg:text-4xl font-primary text-neutral-background">$850</span>
            <span class="text-xs lg:text-sm text-neutral-background/60">/mo</span>
          </div>
          <p class="text-xs lg:text-sm text-neutral-background/60">Ideal for those seeking consistent maintenance and stress management.</p>
          <ul class="space-y-4 text-[12px] lg:text-[13px] text-neutral-background/80">
            <li class="flex items-center gap-3">✓ Bi-weekly Acupuncture</li>
            <li class="flex items-center gap-3">✓ Monthly Nutrition Audit</li>
            <li class="flex items-center gap-3">✓ Botanical Dispensary Access</li>
          </ul>
          <button class="w-full py-4 border border-neutral-background/20 rounded-btn text-[10px] lg:text-[11px] font-bold uppercase tracking-widest text-neutral-background hover:bg-neutral-background hover:text-text-primary transition-colors">Select Tier</button>
        </div>

        <!-- Plan 2 -->
        <div data-animation-on-scroll="" class="bg-brand-primary p-8 lg:p-12 rounded-custom space-y-6 lg:space-y-8 stagger-2 relative overflow-hidden">
          <div class="absolute top-0 right-0 bg-brand-secondary text-brand-primary text-[9px] lg:text-[10px] font-bold uppercase tracking-tighter px-4 py-1">Recommended</div>
          <h4 class="text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.3em] text-text-onPrimary/60">The Elite Collective</h4>
          <div class="flex items-baseline gap-1 text-text-onPrimary">
            <span class="text-3xl lg:text-4xl font-primary">$1,600</span>
            <span class="text-xs lg:text-sm text-text-onPrimary/60">/mo</span>
          </div>
          <p class="text-xs lg:text-sm text-text-onPrimary/60">Comprehensive longevity oversight with integrated diagnostic tracking.</p>
          <ul class="space-y-4 text-[12px] lg:text-[13px] text-text-onPrimary/80">
            <li class="flex items-center gap-3">✓ Weekly Integrated Modalities</li>
            <li class="flex items-center gap-3">✓ Quarterly Advanced Bloodwork</li>
            <li class="flex items-center gap-3">✓ 24/7 Wellness Concierge</li>
          </ul>
          <button class="w-full py-4 bg-brand-secondary text-brand-primary rounded-btn text-[10px] lg:text-[11px] font-bold uppercase tracking-widest hover:scale-105 transition-transform">Apply for Membership</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Call to Action -->
<section class="py-20 lg:py-32 px-6 bg-neutral-background text-center overflow-hidden" id="contact">
  <div class="max-w-4xl mx-auto space-y-8 lg:space-y-12">
    <h2 data-animation-on-scroll="" class="font-primary text-3xl md:text-6xl text-text-primary tracking-tighter">BEGIN YOUR RECOVERY.</h2>
    <p data-animation-on-scroll="" class="text-text-secondary text-lg lg:text-xl max-w-xl mx-auto leading-relaxed stagger-1">
      Slots for new patients are strictly limited to ensure the highest standard of personalized care.
    </p>
    <div data-animation-on-scroll="" class="flex flex-col md:flex-row gap-4 lg:gap-6 justify-center stagger-2">
      <button class="bg-brand-primary text-text-onPrimary px-8 lg:px-12 py-4 lg:py-5 rounded-btn text-[11px] lg:text-[13px] font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-cta">
        Book Consultation
      </button>
      <button class="border border-text-primary/20 text-text-primary px-8 lg:px-12 py-4 lg:py-5 rounded-btn text-[11px] lg:text-[13px] font-bold uppercase tracking-widest hover:bg-text-primary hover:text-neutral-background transition-colors">
        View Facilities
      </button>
    </div>
  </div>
</section>

<style>
  #hero h1 {
    font-weight: 400; 
  }
</style></main>

    <footer class="bg-brand-primary pt-24 pb-12 overflow-hidden relative text-text-onPrimary px-6 lg:px-12">
      <div class="max-w-[1505px] mx-auto relative z-10">
        
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-16 lg:gap-12 mb-20">
          <div data-animation-on-scroll="" class="lg:col-span-1 space-y-8">
            <h4 class="text-text-onPrimary font-primary font-bold text-3xl lg:text-5xl uppercase leading-[1.05] tracking-tighter" data-editable="text" data-path="footer.heading">
              Ready to reclaim your vitality?
            </h4>
            <button class="bg-brand-secondary text-brand-primary px-10 py-4 rounded-btn font-bold text-[11px] lg:text-[13px] uppercase tracking-widest hover:scale-105 transition shadow-lg" data-editable="text" data-path="footer.cta">
              Request Access
            </button>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-12 lg:col-span-3 text-text-onPrimary/70 text-sm">
             <div data-animation-on-scroll="" class="space-y-4 stagger-1">
               <h5 class="font-bold text-text-onPrimary text-[11px] uppercase tracking-[0.2em] mb-6">The Modalities</h5>
               <a href="#" class="block hover:text-text-onPrimary transition font-secondary text-[13px] text-text-onPrimary/70">Acupuncture</a>
               <a href="#" class="block hover:text-text-onPrimary transition font-secondary text-[13px] text-text-onPrimary/70">Botanical Extracts</a>
               <a href="#" class="block hover:text-text-onPrimary transition font-secondary text-[13px] text-text-onPrimary/70">Structural Flow</a>
               <a href="#" class="block hover:text-text-onPrimary transition font-secondary text-[13px] text-text-onPrimary/70">Clinical Diagnostics</a>
             </div>
             <div data-animation-on-scroll="" class="space-y-4 stagger-2">
               <h5 class="font-bold text-text-onPrimary text-[11px] uppercase tracking-[0.2em] mb-6">Resources</h5>
               <a href="#" class="block hover:text-text-onPrimary transition font-secondary text-[13px] text-text-onPrimary/70">The Philosophy</a>
               <a href="#" class="block hover:text-text-onPrimary transition font-secondary text-[13px] text-text-onPrimary/70">Clinical Research</a>
               <a href="#" class="block hover:text-text-onPrimary transition font-secondary text-[13px] text-text-onPrimary/70">Facility Tour</a>
               <a href="#" class="block hover:text-text-onPrimary transition font-secondary text-[13px] text-text-onPrimary/70">Practitioners</a>
             </div>
             <div data-animation-on-scroll="" class="space-y-4 stagger-3">
               <h5 class="font-bold text-text-onPrimary text-[11px] uppercase tracking-[0.2em] mb-6">Global Access</h5>
               <a href="#" class="block hover:text-text-onPrimary transition font-secondary text-[13px] text-text-onPrimary/70">Membership Tiers</a>
               <a href="#" class="block hover:text-text-onPrimary transition font-secondary text-[13px] text-text-onPrimary/70">Concierge Login</a>
               <a href="#" class="block hover:text-text-onPrimary transition font-secondary text-[13px] text-text-onPrimary/70">Contact Desk</a>
               <a href="#" class="block hover:text-text-onPrimary transition font-secondary text-[13px] text-text-onPrimary/70">Private Offices</a>
             </div>
          </div>
        </div>

        <div class="flex flex-col md:flex-row justify-between items-center py-10 border-t border-white/10 text-text-onPrimary/60 text-[10px] font-bold uppercase tracking-[0.2em] mt-20">
          <div data-editable="text" data-path="footer.copyright">© 2024 HEAL.ELITE HEALTH COLLECTIVE</div>
          <div class="flex flex-wrap gap-x-8 gap-y-4 mt-6 md:mt-0 justify-center">
             <a href="#" class="hover:text-text-onPrimary transition text-text-onPrimary/60">Privacy Policy</a>
             <a href="#" class="hover:text-text-onPrimary transition text-text-onPrimary/60">Terms of Care</a>
             <a href="#" class="hover:text-text-onPrimary transition text-text-onPrimary/60">GDPR Compliance</a>
          </div>
        </div>
      </div>

      <!-- Giant 3D-Style Text Effect at Bottom -->
      <div class="absolute bottom-[-6vw] left-0 w-full select-none pointer-events-none overflow-hidden">
        <h1 class="text-[24vw] font-primary font-bold text-brand-secondary opacity-[0.08] text-center leading-none tracking-tighter uppercase">
          HEAL.ELITE
        </h1>
      </div>
    </footer>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Scroll Reveal
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-on-scroll-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.05 });

      document.querySelectorAll('[data-animation-on-scroll]').forEach(el => {
        el.classList.add('animate-on-scroll-hidden');
        observer.observe(el);
      });

      // Header Logic
      const header = document.getElementById('main-header');
      
      // Entrance Animation
      setTimeout(() => {
        header.style.transform = 'translate(-50%, 0)';
        header.style.opacity = '1';
      }, 300);

      // Scroll Hide/Show
      let lastScroll = 0;
      const navbar = document.getElementById('navbar');
      window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        if (Math.abs(currentScroll - lastScroll) < 10) return;
        
        if (currentScroll > 80) {
          // Scrolled down — keep header visible, add solid bg + shadow
          header.style.transform = 'translate(-50%, 0)';
          header.style.opacity = '1';
          navbar.classList.add('scrolled');
        } else {
          // At top — reset to default
          header.style.transform = 'translate(-50%, 0)';
          header.style.opacity = '1';
          navbar.classList.remove('scrolled');
        }
        lastScroll = currentScroll;
      });

      // Mobile Menu Logic
      const menuToggle = document.getElementById('mobile-menu-toggle');
      const menuClose = document.getElementById('mobile-menu-close');
      const mobileMenu = document.getElementById('mobile-menu');
      const body = document.body;

      function openMenu() {
        mobileMenu.classList.add('active');
        body.style.overflow = 'hidden';
      }

      function closeMenu() {
        mobileMenu.classList.remove('active');
        body.style.overflow = '';
      }

      if (menuToggle) menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        openMenu();
      });
      if (menuClose) menuClose.addEventListener('click', closeMenu);

      document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', closeMenu);
      });
      
      // Close menu if clicking outside content
      mobileMenu.addEventListener('click', (e) => {
        if (e.target === mobileMenu) closeMenu();
      });

      // Mobile Analyze Dropdown Toggle
      const analyzeToggle = document.getElementById('mobile-analyze-toggle');
      const analyzeSubmenu = document.getElementById('mobile-analyze-submenu');
      const analyzeIcon = document.getElementById('mobile-analyze-icon');
      
      if (analyzeToggle && analyzeSubmenu) {
        analyzeToggle.addEventListener('click', () => {
          const isOpen = analyzeSubmenu.style.maxHeight && analyzeSubmenu.style.maxHeight !== '0px';
          if (isOpen) {
            analyzeSubmenu.style.maxHeight = '0px';
            analyzeIcon.style.transform = 'rotate(0deg)';
          } else {
            analyzeSubmenu.style.maxHeight = '200px';
            analyzeIcon.style.transform = 'rotate(180deg)';
          }
        });
      }
    });
  </script>
</body></html>
