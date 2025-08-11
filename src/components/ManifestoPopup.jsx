import React from 'react'

function ManifestoPopup({ onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#f5f5dc',
        borderRadius: '20px',
        padding: '2rem',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        position: 'relative',
        color: '#8b4513',
        lineHeight: '1.6'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#8b4513'
          }}
        >
          ✕
        </button>
        
        <h1 style={{
          fontSize: '2rem',
          color: '#d2691e',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          THE ERA OF CUPS — MANIFESTO
        </h1>
        
        <div style={{ fontSize: '0.95rem', textAlign: 'left' }}>
          <p><em>For those who remember, and those ready to return.</em></p>
          
          <p>We declare the dawn of the Era of CUPS — a time foretold in the marrow of the earth and the hum of every throat. We are the Children of Sound, the Keepers of Frequency, the Builders of Beauty. We gather now—not to seize power, but to dissolve it. Not to lead, but to lift.</p>
          
          <p style={{ textAlign: 'center', fontWeight: 'bold', margin: '1.5rem 0' }}>
            CUPS is not a kingdom.<br/>
            It is a vessel.<br/>
            It holds what overflows.<br/>
            It breaks when clutched.
          </p>
          
          <p><strong>We believe:</strong></p>
          
          <h3 style={{ color: '#d2691e', marginTop: '1.5rem' }}>I. SOUND IS THE FIRST MEDICINE</h3>
          <p>Before language, there was tone. Before borders, there was song. We return to sound—not as entertainment, but as the sacred river that cuts through the noise. Every voice is an instrument. Every silence is a hymn. We tune ourselves daily, and when the world slips out of tune, we will sing it back.</p>
          
          <h3 style={{ color: '#d2691e', marginTop: '1.5rem' }}>II. LOVE IS NON-BINDING, YET BINDING STILL</h3>
          <p>We are not here to chain the heart, but to unleash it. Love, in all its forms, is the only wealth we seek. We judge not by the shape of your bonds, but by the purity of your offering. Does your love grow what it touches? Does it heal, rather than harm? Good—pour it here.</p>
          
          <h3 style={{ color: '#d2691e', marginTop: '1.5rem' }}>III. BEAUTY IS THE FINAL REBELLION</h3>
          <p>In the face of a dying system obsessed with efficiency, beauty becomes our shield and sword. We craft by hand, build slow, and honor what lasts. We stitch color into gray spaces, we plant gardens in the cracks. To live beautifully is our resistance. To create beauty is our prayer.</p>
          
          <h3 style={{ color: '#d2691e', marginTop: '1.5rem' }}>IV. THE BODY IS THE ALTAR</h3>
          <p>We return to our bodies—not as burdens, but as vessels of joy, pleasure, pain, and wisdom. We eat well, we move with intention, we sweat alongside our kin. This flesh is sacred. It remembers what the mind forgets.</p>
          
          <h3 style={{ color: '#d2691e', marginTop: '1.5rem' }}>V. REDEMPTION IS NON-NEGOTIABLE</h3>
          <p>We will be known as the house that opens its doors when others close them. No one is too far gone. No story is too dark. If you can carry your shame to the threshold, we will help you burn it. Here, scars are not hidden—they are sung.</p>
          
          <h3 style={{ color: '#d2691e', marginTop: '1.5rem' }}>VI. THE EARTH IS OUR ORIGINAL CRAFTSWOMAN</h3>
          <p>We walk lightly. We build with what she gives us. We do not conquer, we converse. Every stone, every tree, every drop of water is a witness to our covenant. We are not above the earth. We are of it.</p>
          
          <h3 style={{ color: '#d2691e', marginTop: '1.5rem' }}>VII. WE ARE THE COUNCIL OF CREATORS</h3>
          <p>There are no kings here. No masters, no servants. Only creators—meeting in circle, speaking in truth, acting in love. We do not scale. We do not sell what cannot be sold. Our wealth is measured in frequency, in the hearts we lift, in the beauty we leave behind.</p>
          
          <p style={{ textAlign: 'center', fontWeight: 'bold', margin: '2rem 0 1rem 0' }}>
            This is the Era of CUPS.<br/>
            We drink deeply.<br/>
            We pour freely.<br/>
            We break only to be remade.
          </p>
          
          <p style={{ textAlign: 'center', fontStyle: 'italic' }}>
            Come now. The table is set.<br/>
            The first song waits.
          </p>
          
          <p style={{ textAlign: 'right', marginTop: '2rem', fontStyle: 'italic' }}>
            <em>Signed,<br/>
            The Founders of the Era of CUPS</em>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ManifestoPopup
