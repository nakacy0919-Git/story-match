import React, { useState } from "react";
import { DEFAULT_RULES, validateRules } from "../utils/missionRules";
export default function AdminSettings({ rules, onSave, onBack }) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState(""),
    [unlocked, setUnlocked] = useState(false),
    [draft, setDraft] = useState({ ...rules }),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const request = async (action, values) => {
    const response = await fetch("/api/mission-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, password, rules: values }),
    });
    const data = await response.json();
    if (!response.ok) throw Error(data.error || "保存できませんでした。");
    return data;
  };
  const login = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      await request("verify");
      setUnlocked(true);
    } catch (e) {
      setStatus(e.message);
    } finally {
      setBusy(false);
    }
  };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const values = validateRules(
        Object.fromEntries(
          Object.entries(draft).map(([k, v]) => [
            k,
            v === "" ? NaN : Number(v),
          ]),
        ),
      );
      const data = await request("save", values);
      onSave(data.rules);
      setStatus(
        "保存しました。生徒の画面は再読み込み・画面復帰・最大1分で新しい基準になります。",
      );
    } catch (e) {
      setStatus(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="admin-page">
      <section className="admin-panel">
        <button className="subtle" onClick={onBack}>
          ← 学習進捗へ
        </button>
        <h1>管理者設定</h1>
        {!unlocked ? (
          <form onSubmit={login}>
            <label>
              管理者パスワード
              <input
                type={showPassword ? "text" : "password"}
                inputMode="numeric"
                autoComplete="current-password"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value.normalize("NFKC"))}
              />
            </label>
            <p>
              数字5桁で入力してください。全角数字・前後の空白も自動で整えます。
            </p>
            <button
              type="button"
              className="subtle"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? "パスワードを隠す" : "入力したパスワードを表示"}
            </button>
            <button className="primary" disabled={busy}>
              ログイン
            </button>
          </form>
        ) : (
          <form onSubmit={save}>
            <p>
              全Unit・全生徒に適用する合格基準です。保存済みのベスト記録も、この基準で再判定します。
            </p>
            {[
              ["readingAccuracy", "じっくり学習：合格Accuracy（％）", 1, 100],
              [
                "puzzleSeconds",
                "パズル：合格タイム上限（秒・0は制限なし）",
                0,
                86400,
              ],
              [
                "randomPoints",
                "ランダム：全問終了時の合格ポイント（0は点数制限なし）",
                0,
                100000,
              ],
              [
                "listeningPoints",
                "リスニング：全問終了時の合格ポイント（0は点数制限なし）",
                0,
                100000,
              ],
            ].map(([key, label, min, max]) => (
              <label key={key}>
                {label}
                <input
                  type="number"
                  required
                  min={min}
                  max={max}
                  step="1"
                  value={draft[key]}
                  onChange={(e) =>
                    setDraft({ ...draft, [key]: e.target.value })
                  }
                />
              </label>
            ))}
            <p>
              スキップは合格に含みません。パズルはヒント加算後のタイム、クイズは全問コースの得点で判定します。
            </p>
            <div className="admin-actions">
              <button className="primary" disabled={busy}>
                基準を保存
              </button>
              <button
                type="button"
                className="subtle"
                disabled={busy}
                onClick={() => setDraft({ ...DEFAULT_RULES })}
              >
                初期値に戻す
              </button>
              <button
                type="button"
                className="subtle"
                onClick={() => {
                  setPassword("");
                  setUnlocked(false);
                }}
              >
                ログアウト
              </button>
            </div>
          </form>
        )}
        <p role="status">{status}</p>
      </section>
    </main>
  );
}
