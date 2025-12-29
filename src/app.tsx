import React, { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import HeartRain from "./HeartRain";

type Step = "welcome" | "memory" | "quiz" | "final";

type Tile = {
  id: string;
  emoji: string;
  revealed: boolean;
  matched: boolean;
};

const SECRET_CODE = "tommy";
const GIRL_NAME = "Juljaga";
const FROM_NAME = "From: А.Мөнхтөгөлдөр/Your servant/";

const EMOJIS = ["🎀", "💗", "🍓", "🧸", "✨", "🌙"];

const QUIZ = [
  {
    q: "Хамгийн хөөрхөн нь:",
    options: ["Нандин-Эрдэнэ 😭", "Мөнхтөгөлдөр 😌", "Жамух 🧟‍♀️"],
    answerIndex: 0,
  },
  {
    q: "Хайр нь хэдэн экстэй вэ?",
    options: ["1", "99", "0 (зөвхөн чи 💗)"],
    answerIndex: 2,
  },
  {
    q: "Намайг хамгийн их хайлуулдаг чинь:",
    options: ["Инээмсэглэл 😌", "Зан ааш 😭", "Бүгд нь 🫠"],
    answerIndex: 2,
  },
  {
    q: "Төрсөн өдрийн төлөвлөгөө:",
    options: ["Cake идэх 🎂", "Cute зураг авах 📸", "All of the above ✨"],
    answerIndex: 2,
  },
  {
    q: "Надад чи юу вэ?",
    options: ["Найз", "Хайр", "Миний бүх юм 💘"],
    answerIndex: 2,
  },
] as const;

function makeTiles(): Tile[] {
  const pairs = EMOJIS.flatMap((emoji, idx) => [
    { id: `${idx}-a`, emoji, revealed: false, matched: false },
    { id: `${idx}-b`, emoji, revealed: false, matched: false },
  ]);
  // shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs;
}

function burst() {
  confetti({
    particleCount: 90,
    spread: 70,
    origin: { y: 0.6 },
  });
  confetti({
    particleCount: 60,
    spread: 90,
    origin: { y: 0.65, x: 0.2 },
  });
  confetti({
    particleCount: 60,
    spread: 90,
    origin: { y: 0.65, x: 0.8 },
  });
}

export default function App() {
  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);

  const onOpenGift = () => {
    setGiftOpen(true);
    burst(); // keep your confetti
  };

  // Memory game state
  const [tiles, setTiles] = useState<Tile[]>(() => makeTiles());
  const [picked, setPicked] = useState<string[]>([]);
  const matchedCount = tiles.filter((t) => t.matched).length;

  // Quiz state
  const [qIndex, setQIndex] = useState(0);
  const [correct, setCorrect] = useState(0);

  const progress = useMemo(() => {
    const map: Record<Step, number> = {
      welcome: 10,
      memory: 45,
      quiz: 75,
      final: 100,
    };
    return map[step];
  }, [step]);

  useEffect(() => {
    // reset on step changes if needed
    if (step === "memory") {
      setTiles(makeTiles());
      setPicked([]);
    }
    if (step === "quiz") {
      setQIndex(0);
      setCorrect(0);
    }
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGiftOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Handle memory match logic
  useEffect(() => {
    if (picked.length !== 2) return;

    const [aId, bId] = picked;
    const a = tiles.find((t) => t.id === aId);
    const b = tiles.find((t) => t.id === bId);
    if (!a || !b) return;

    const isMatch = a.emoji === b.emoji;

    const timer = window.setTimeout(() => {
      setTiles((prev) =>
        prev.map((t) => {
          if (t.id === aId || t.id === bId) {
            return isMatch
              ? { ...t, matched: true, revealed: true }
              : { ...t, revealed: false };
          }
          return t;
        })
      );
      setPicked([]);
      if (isMatch) {
        // tiny confetti on match
        confetti({ particleCount: 25, spread: 50, origin: { y: 0.7 } });
      }
    }, 520);

    return () => window.clearTimeout(timer);
  }, [picked, tiles]);

  useEffect(() => {
    if (
      step === "memory" &&
      matchedCount === tiles.length &&
      tiles.length > 0
    ) {
      // finished memory
      window.setTimeout(() => setStep("quiz"), 450);
    }
  }, [matchedCount, step, tiles.length]);

  const onStart = () => {
    setError(null);

    const cleanCode = code.trim().toLowerCase();
    if (!cleanCode) return setError("Type the secret code 😭");
    if (cleanCode !== SECRET_CODE) return setError("Nope 😈 try again");

    setStep("memory");
  };

  const onPickTile = (id: string) => {
    if (step !== "memory") return;
    const t = tiles.find((x) => x.id === id);
    if (!t || t.matched || t.revealed) return;
    if (picked.length >= 2) return;

    setTiles((prev) =>
      prev.map((x) => (x.id === id ? { ...x, revealed: true } : x))
    );
    setPicked((prev) => [...prev, id]);
  };

  const onAnswer = (idx: number) => {
    const q = QUIZ[qIndex];
    const isCorrect = idx === q.answerIndex;
    if (isCorrect) setCorrect((c) => c + 1);

    if (qIndex === QUIZ.length - 1) {
      setStep("final");
      burst();
    } else {
      setQIndex((i) => i + 1);
    }
  };

  return (
    <div className="container">
      <HeartRain />
      <div className="shell">
        <div className="header">
          <div>
            <div className="title">Birthday Surprise 🎁</div>
            <div className="sub">Tiny game → big reveal.</div>
          </div>
          <div className="badge">
            <span className="dot" />
            <span>Progress</span>
            <span className="kbd">{progress}%</span>
          </div>
        </div>

        <div className="content">
          <div className="progress" aria-label="progress">
            <div style={{ ["--w" as any]: `${progress}%` }} />
          </div>

          {step === "welcome" && (
            <div className="grid two fadeIn" style={{ marginTop: 16 }}>
              <div className="card">
                <h2
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Hi {GIRL_NAME} 💗
                </h2>
                <p className="small" style={{ marginTop: 8 }}>
                  This is a tiny birthday mission. Beat the mini game, unlock
                  the final message.
                </p>

                <div style={{ marginTop: 14 }} className="grid">
                  <div>
                    <div className="small" style={{ marginBottom: 6 }}>
                      Your nickname (optional)
                    </div>
                    <input
                      className="input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="ex) cutie, princess, etc"
                    />
                  </div>

                  <div>
                    <div className="small" style={{ marginBottom: 6 }}>
                      Secret code
                    </div>
                    <input
                      className="input"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="hint: Хайрынх нь нөгөөхийг юу гэдэг билэээ? 😉"
                    />
                  </div>

                  {error ? (
                    <div className="small" style={{ color: "#ff9bdc" }}>
                      {error}
                    </div>
                  ) : null}

                  <div className="row">
                    <button className="btn primary" onClick={onStart}>
                      Start the mission
                    </button>
                    <button
                      className="btn ghost"
                      onClick={() => {
                        setCode("");
                        setError(null);
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="small">What’s inside?</div>
                <ul
                  style={{
                    marginTop: 10,
                    marginBottom: 0,
                    paddingLeft: 18,
                  }}
                >
                  <li>Memory match game</li>
                  <li>Mini quiz</li>
                  <li>Final birthday letter + confetti</li>
                </ul>
                <p className="small" style={{ marginTop: 14 }}>
                  Tip: Захиалгын дагуу хөгжүүлнэ жүүү хайрааа ❤️
                </p>
              </div>
            </div>
          )}

          {step === "memory" && (
            <div className="grid two fadeIn" style={{ marginTop: 16 }}>
              <div className="card">
                <div
                  className="row"
                  style={{ justifyContent: "space-between" }}
                >
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>
                      Level 1: Memory Match
                    </div>
                    <div className="small">
                      Match all pairs to unlock the next level ✨
                    </div>
                  </div>
                  <div className="badge">
                    <span className="dot" />
                    <span>
                      {matchedCount}/{tiles.length} matched
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 14 }} className="board">
                  {tiles.map((t) => (
                    <button
                      key={t.id}
                      className={[
                        "tile",
                        t.revealed ? "revealed" : "",
                        t.matched ? "matched" : "",
                      ].join(" ")}
                      onClick={() => onPickTile(t.id)}
                      aria-label="tile"
                      type="button"
                    >
                      <span className="emoji">
                        {t.revealed || t.matched ? t.emoji : "❔"}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="row" style={{ marginTop: 14 }}>
                  <button className="btn" onClick={() => setTiles(makeTiles())}>
                    Shuffle
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => setStep("welcome")}
                  >
                    Back
                  </button>
                </div>
              </div>

              <div className="card">
                <div style={{ fontWeight: 900, fontSize: 18 }}>
                  Cute scoreboard
                </div>
                <p className="small" style={{ marginTop: 6 }}>
                  {name?.trim()
                    ? `Ok ${name.trim()}… don’t act shy 😌`
                    : "Ok… don’t act shy 😌"}
                </p>
                <div className="letter" style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 800 }}>Rules</div>
                  <div className="small" style={{ marginTop: 6 }}>
                    Tap tiles → find pairs → win. That’s it. (But it’s still
                    kinda addictive.)
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "quiz" && (
            <div className="grid two fadeIn" style={{ marginTop: 16 }}>
              <div className="card">
                <div style={{ fontWeight: 900, fontSize: 18 }}>
                  Level 2: Mini Quiz
                </div>
                <p className="small" style={{ marginTop: 6 }}>
                  Just vibes. No stress. Pick the best answer 😌
                </p>

                <div className="letter" style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>
                    {QUIZ[qIndex].q}
                  </div>
                  <div className="grid" style={{ marginTop: 12 }}>
                    {QUIZ[qIndex].options.map((opt, idx) => (
                      <button
                        key={opt}
                        className="btn"
                        onClick={() => onAnswer(idx)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="row"
                  style={{ marginTop: 14, justifyContent: "space-between" }}
                >
                  <div className="small">
                    Question {qIndex + 1} / {QUIZ.length}
                  </div>
                  <div className="badge">
                    <span className="dot" />
                    <span>Correct: {correct}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <div style={{ fontWeight: 900, fontSize: 18 }}>
                  Almost there…
                </div>
                <p className="small" style={{ marginTop: 6 }}>
                  After this, you’ll unlock the final message. 🎁
                </p>
                <div className="letter" style={{ marginTop: 12 }}>
                  <div className="small">
                    Дааа хайр нь бага тоглоно оо ххи{" "}
                    <span className="kbd">Хайртайгаа</span> гэхдээ цуг тоглож
                    байна шүүүүүү!!!!
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "final" && (
            <div className="grid two fadeIn" style={{ marginTop: 16 }}>
              <div className="card">
                <div
                  style={{
                    fontWeight: 1000,
                    fontSize: 22,
                    letterSpacing: "-0.02em",
                  }}
                >
                  HAPPY BIRTHDAY 🎂💗
                </div>
                <p className="small" style={{ marginTop: 6 }}>
                  {name?.trim() ? `${name.trim()}, you did it.` : "You did it."}{" "}
                  Now open the gift.
                </p>

                <div className="letter" style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 900 }}>A tiny letter</div>
                  <p style={{ marginTop: 8, marginBottom: 0 }}>
                    Энэ өдөр чиний минь төрсөн өдөр. Чи надад хайр гэж юу
                    болохыг, амьдралын жинхэнэ утгыг ойлгуулсан үзэсгэлэн гоо.
                    Ямар ч үед, ямар ч нөхцөлд хайрынхаа төлөө зогсож чаддаг
                    чамтайгаа энэ хорвоод дахин олдохгүй ганцхан амьдралаа л
                    хамтдаа өнгөрөөхийг, удахгүй уулзаад, зүрхэндээ тээж явсан
                    бүх мэдрэмжээ өөрийн биеэр, тэврэлтээрээ, харцаараа чамд
                    мэдрүүлэхсэн... Хайртай шүү. Маш их. Хайрт минь. 💗
                    <br />
                    <br />I love you. Always.
                  </p>
                  <div className="small" style={{ marginTop: 12 }}>
                    {FROM_NAME}
                  </div>
                </div>

                <div className="row" style={{ marginTop: 14 }}>
                  <button className="btn primary" onClick={onOpenGift}>
                    Open Gift 🎁
                  </button>
                  <button className="btn" onClick={() => setStep("welcome")}>
                    Play again
                  </button>
                </div>
              </div>

              <div className="card">
                <div style={{ fontWeight: 900, fontSize: 18 }}>Шагнал</div>
                <ul
                  style={{
                    marginTop: 10,
                    marginBottom: 0,
                    paddingLeft: 18,
                  }}
                >
                  <li>
                    Асуултанд <span className="kbd">зөв</span> хариулсан тул
                  </li>
                  <li>1ш хүсэл / Юу ч байсан болно /</li>
                  <li>2ш пост оруулуулах эрх</li>
                  <li>3ш уучилах купон</li>
                </ul>
              </div>
              {giftOpen && (
                <div
                  className="modalOverlay"
                  role="dialog"
                  aria-modal="true"
                  onClick={() => setGiftOpen(false)}
                >
                  <div
                    className="modalCard"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="modalTop">
                      <div className="modalTitle">🎁 Surprise unlocked!</div>
                      <button
                        className="modalClose"
                        onClick={() => setGiftOpen(false)}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="modalBody">
                      <div className="modalBig">💗💗💗</div>
                      <img src="/me and cutie.jpg" alt="LuvU" width={300} height={300} style={{objectFit: "contain", margin: "0 auto"}}/>
                      <p className="modalText">
                        Okay miss main character… you won. <br />
                        Your gift is: unlimited hugs + kisses + “I’m proud of
                        you” forever.
                      </p>

                      <div className="modalActions">
                        <button className="btn primary" onClick={burst}>
                          More confetti ✨
                        </button>
                        <button
                          className="btn"
                          onClick={() => setGiftOpen(false)}
                        >
                          Close
                        </button>
                      </div>

                      <div className="modalHint">
                        psst… check your real gift now 😌🎀
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
