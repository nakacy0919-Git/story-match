import React from 'react';

const HistoryBoard = ({ history, onBack }) => {
  const puzzleHistory = history.filter(h => h.mode === 'puzzle').slice(0, 10).reverse();
  const maxResult = Math.max(...puzzleHistory.map(h => h.result), 60);

  const generateAdvice = () => {
    if (history.length === 0) return "まずは「じっくり学習」でストーリーを読んでみよう！";
    
    const lastSession = history[0];
    // 🌟 せっかく計算した変数を使えるように、アドバイスに組み込みました！
    const totalMistakes = history.reduce((acc, cur) => acc + cur.mistakes, 0);
    
    if (totalMistakes > 50) {
      return `今まで合計で ${totalMistakes} 回のミスがあったね。たくさん間違えながら、しっかり学べている証拠だよ！その調子でどんどん挑戦しよう！`;
    }
    if (lastSession.mistakes > 3) {
      return "前回のパズルは少し難しかったかな？もう一度「じっくり学習」で英文を確認してみると、次はもっと早く解けるようになるよ！";
    }
    if (lastSession.result < 30 && lastSession.mode === 'puzzle') {
      return "素晴らしいスピードだね！次はランダムモードで、瞬発力を鍛えてみよう！";
    }
    if (history.length > 5) {
      return "継続して学習できているね！この調子で、すべてのUnitでSランク（30秒以内）を目指してみよう。";
    }
    return "よく頑張っているね。間違えたところは、じっくり学習で復習するのが上達の近道だよ。";
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '30px', backgroundColor: '#f0f8ff', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', backgroundColor: '#fff', borderRadius: '30px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '2rem', margin: 0, color: '#333' }}>📊 学習の記録と成長</h2>
          <button onClick={onBack} style={{ padding: '10px 25px', borderRadius: '20px', border: 'none', background: '#6c5ce7', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>戻る</button>
        </div>

        <div style={{ backgroundColor: '#eef2ff', padding: '20px', borderRadius: '20px', borderLeft: '8px solid #6c5ce7', textAlign: 'left', marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '1.2rem', color: '#6c5ce7' }}>💡 先生からのアドバイス</h3>
          <p style={{ margin: 0, fontSize: '1.1rem', color: '#444', lineHeight: '1.6' }}>{generateAdvice()}</p>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ textAlign: 'left', color: '#666' }}>パズルモードのタイム推移 (秒)</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', height: '200px', padding: '20px', borderBottom: '2px solid #ddd' }}>
            {puzzleHistory.length > 0 ? puzzleHistory.map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ 
                  width: '100%', 
                  height: `${(h.result / maxResult) * 150}px`, 
                  backgroundColor: '#FF6B6B', 
                  borderRadius: '8px 8px 0 0',
                  position: 'relative'
                }}>
                  <span style={{ position: 'absolute', top: '-25px', width: '100%', textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>{h.result}s</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '10px' }}>{new Date(h.date).toLocaleDateString().slice(5)}</div>
              </div>
            )) : <p style={{ width: '100%', color: '#bbb' }}>データがまだありません</p>}
          </div>
        </div>

        <div style={{ textAlign: 'left' }}>
          <h3 style={{ color: '#666' }}>最近の学習ログ</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {history.map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee', fontSize: '1rem' }}>
                <span>📅 {new Date(h.date).toLocaleString()}</span>
                <span style={{ fontWeight: 'bold' }}>Unit {h.unit} - {h.mode === 'puzzle' ? `🧩 L${h.level}` : '⚡ Random'}</span>
                <span style={{ color: '#6c5ce7', fontWeight: 'bold' }}>{h.mode === 'puzzle' ? `${h.result}秒` : `${h.result}点`}</span>
                <span style={{ color: h.mistakes === 0 ? '#4caf50' : '#f44336' }}>ミス: {h.mistakes}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryBoard;