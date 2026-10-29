import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = {
  width: 32,
  height: 32,
}
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #090d16 0%, #0f172a 100%)",
          borderRadius: "8px",
          border: "1px solid rgba(16, 185, 129, 0.4)",
          boxShadow: "0 0 10px rgba(16, 185, 129, 0.25)",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle candlestick bars */}
          <line
            x1="6"
            y1="11"
            x2="6"
            y2="19"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="12"
            y1="7"
            x2="12"
            y2="19"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="18"
            y1="3"
            x2="18"
            y2="19"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Upward trendline with glowing arrow */}
          <path
            d="M4 16L10 11L14 14L20 6"
            stroke="#34d399"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 6H20V10"
            stroke="#34d399"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
