/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0B1020",
        "bg-2": "#0E1426",
        card: "#131A2E",
        "card-2": "#161F38",
        border: "rgba(148, 163, 255, 0.12)",
        "border-strong": "rgba(148, 163, 255, 0.22)",
        indigo: "#6366F1",
        "indigo-soft": "rgba(99, 102, 241, 0.16)",
        emerald: "#10B981",
        "emerald-soft": "rgba(16, 185, 129, 0.14)",
        amber: "#F59E0B",
        "amber-soft": "rgba(245, 158, 11, 0.14)",
        red: "#EF4444",
        "red-soft": "rgba(239, 68, 68, 0.14)",
        cyan: "#22D3EE",
        magenta: "#E879F9",
        text: "#F8FAFC",
        "text-dim": "#9AA5C8",
        "text-faint": "#5B6690",
      },
      borderRadius: {
        lg: "20px",
        md: "14px",
        sm: "10px",
      },
      backdropBlur: {
        lg: "18px",
      }
    },
  },
  plugins: [],
}
