import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontFamily: {
  			'ks-display': ['Outfit', 'DM Sans', 'system-ui', 'sans-serif'],
  			'ks-sans': ['Geist', 'system-ui', 'sans-serif'],
  			'ks-mono': ['"Geist Mono"', 'ui-monospace', 'monospace'],
  			heading: ['Outfit', 'DM Sans', 'system-ui', 'sans-serif'],
  			sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			serif: ['Outfit', 'DM Sans', 'system-ui', 'sans-serif'],
  			mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
  		},
  		colors: {
  			// Site vitrine (design system Kistone v2), isolé des tokens HSL de l'app
  			ks: {
  				bg: '#F5F1EA',
  				card: '#FFFFFF',
  				muted: '#F3EEE6',
  				secondary: '#EDE7DC',
  				ink: '#141312',
  				'ink-2': '#3D3A36',
  				soft: '#5E5A54',
  				subtle: '#6B665F',
  				line: 'rgba(20,19,18,0.07)',
  				'line-strong': 'rgba(20,19,18,0.12)',
  				pink: '#FF2E6E',
  				'pink-hover': '#ED2B66',
  				'pink-100': '#FFE3EC',
  				'pink-ink': '#8F1747',
  				dark: '#141312',
  				'dark-fg': '#F5F1EA',
  				'dark-muted': '#B9B3AA',
  				success: '#1F9D5B'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		maxWidth: {
  			ks: '1200px'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
  			'scroll-x': {
  				'0%': { transform: 'translateX(0)' },
  				'100%': { transform: 'translateX(-50%)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'scroll-x': 'scroll-x 30s linear infinite'
  		},
  		boxShadow: {
  			'ks-card': '0 1px 2px rgba(20,19,18,0.04), 0 18px 40px -24px rgba(60,40,20,0.16)',
  			'ks-card-hover': '0 2px 4px rgba(20,19,18,0.04), 0 28px 56px -24px rgba(60,40,20,0.26)',
  			'ks-pop': '0 30px 60px -24px rgba(60,40,20,0.3)',
  			'ks-window': '0 2px 4px rgba(20,19,18,0.04), 0 40px 80px -40px rgba(60,40,20,0.28)',
  			'ks-pink': '0 14px 30px -12px rgba(255,46,110,0.6)',
  			'ks-pink-sm': '0 8px 20px -10px rgba(255,46,110,0.6)',
  			'2xs': 'var(--shadow-2xs)',
  			xs: 'var(--shadow-xs)',
  			sm: 'var(--shadow-sm)',
  			md: 'var(--shadow-md)',
  			lg: 'var(--shadow-lg)',
  			xl: 'var(--shadow-xl)',
  			'2xl': 'var(--shadow-2xl)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
