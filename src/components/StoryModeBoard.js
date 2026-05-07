import React, { useState, useEffect } from 'react';

const StoryModeBoard = ({ storyData, unit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 🌟 シーンが切り替わったときに前の音声を止める
  useEffect(() => {
    window.speechSynthesis.cancel();
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < storyData.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  // 🌟 英文を読み上げる関数を追加
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) {
      alert('お使いのブラウザは音声読み上げに対応していません。');
      return;
    }
    // 再生中の音声をキャンセルして新しく読み上げる
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // アメリカ英語に設定
    utterance.rate = 0.9;     // 生徒が聞き取りやすいように少しゆっくり（1.0が標準）
    window.speechSynthesis.speak(utterance);
  };

  if (!storyData) return null;

  const currentItem = storyData[currentIndex];
  const imageUrl = `${process.env.PUBLIC_URL}/images/unit${unit}/${currentIndex + 1}.webp`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px', alignItems: 'center', boxSizing: 'border-box', overflow: 'hidden' }}>
      
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#666', marginBottom: '15px', backgroundColor: '#fff', padding: '8px 25px', borderRadius: '30px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', flexShrink: 0 }}>
        Scene {currentIndex + 1} / {storyData.length}
      </div>

      <div style={{ display: 'flex', flex: 1, width: '100%', maxWidth: '1000px', backgroundColor: '#fff', borderRadius: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', overflow: 'hidden', flexDirection: 'column', minHeight: 0 }}>
        
        <div style={{ flex: 1.5, backgroundColor: '#f8f9fa', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', minHeight: 0 }}>
          <img 
            src={imageUrl} 
            alt={`Scene ${currentIndex + 1}`} 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.15)' }} 
          />
        </div>

        <div style={{ padding: '30px 40px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#fff', overflowY: 'auto', flexShrink: 0 }}>
          
          {/* 🌟 読み上げボタンと英文を横に並べる */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
            <button 
              onClick={() => speakText(currentItem.en)} 
              className="speak-btn"
              title="英文を読み上げる"
            >
              🔊
            </button>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#222', lineHeight: '1.4', textAlign: 'left', flex: 1 }}>
              {currentItem.en}
            </div>
          </div>

          <div style={{ fontSize: '1.5rem', color: '#666', lineHeight: '1.4', borderTop: '2px dashed #ddd', paddingTop: '20px', textAlign: 'left' }}>
            {currentItem.ja}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '30px', marginTop: '20px', width: '100%', maxWidth: '1000px', justifyContent: 'center', flexShrink: 0 }}>
        <button 
          onClick={handlePrev} 
          disabled={currentIndex === 0}
          style={{ 
            padding: '15px 50px', fontSize: '1.5rem', fontWeight: 'bold', borderRadius: '40px', border: 'none', 
            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', 
            backgroundColor: currentIndex === 0 ? '#e0e0e0' : '#4CAF50', color: '#fff', 
            opacity: currentIndex === 0 ? 0.5 : 1, transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          ◀ 前へ
        </button>
        <button 
          onClick={handleNext} 
          disabled={currentIndex === storyData.length - 1}
          className={currentIndex !== storyData.length - 1 ? 'next-btn-anim' : ''}
          style={{ 
            padding: '15px 50px', fontSize: '1.5rem', fontWeight: 'bold', borderRadius: '40px', border: 'none', 
            cursor: currentIndex === storyData.length - 1 ? 'not-allowed' : 'pointer', 
            backgroundColor: currentIndex === storyData.length - 1 ? '#e0e0e0' : '#2196F3', color: '#fff', 
            opacity: currentIndex === storyData.length - 1 ? 0.5 : 1, transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          {currentIndex === storyData.length - 1 ? '最後です' : '次へ ▶'}
        </button>
      </div>

      <style>{`
        .next-btn-anim {
          animation: pulse-next 1.5s infinite;
        }
        @keyframes pulse-next {
          0% { transform: scale(1); box-shadow: 0 4px 6px rgba(33, 150, 243, 0.3); }
          50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(33, 150, 243, 0.8); }
          100% { transform: scale(1); box-shadow: 0 4px 6px rgba(33, 150, 243, 0.3); }
        }
        
        /* 🌟 音声読み上げボタンのスタイル */
        .speak-btn {
          background-color: #E3F2FD;
          border: 2px solid #2196F3;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          font-size: 1.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          margin-top: 5px; /* テキストの1行目と高さを合わせる */
        }
        .speak-btn:hover {
          background-color: #BBDEFB;
          transform: scale(1.1) rotate(-5deg);
        }
        .speak-btn:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
};

export default StoryModeBoard;