import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const alt = 'A³P-Web | Academic Profile Analytics'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'
 
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#F7F8F5',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
          <div
            style={{
              fontSize: 32,
              background: '#0F8B8D',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '12px',
              fontWeight: 800,
              marginRight: '20px',
            }}
          >
            A³
          </div>
          <div style={{ fontSize: 48, fontWeight: 800, color: '#17233C', letterSpacing: '-0.02em' }}>
            A³P-Web
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: 80, fontWeight: 900, color: '#17233C', letterSpacing: '-0.03em' }}>
            FROM FRAGMENTED DATA
          </div>
          <div style={{ fontSize: 80, fontWeight: 900, color: '#17233C', letterSpacing: '-0.03em' }}>
            TO CONNECTED EVIDENCE.
          </div>
          <div style={{ fontSize: 80, fontWeight: 900, color: '#0F8B8D', letterSpacing: '-0.03em' }}>
            TO EXPLAINABLE INSIGHT.
          </div>
        </div>
        
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #E4E8EF', paddingTop: '40px' }}>
          <div style={{ fontSize: 32, color: '#5D6B82', fontWeight: 600 }}>
            AI-Enabled Academic Profile Analytics
          </div>
          <div style={{ fontSize: 24, color: '#0F8B8D', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Smart India Hackathon 2026
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
