// Scales and their names for the bass (4 strings, E A D G). Names in en, th, ja, zh-CN, ru, lo, ko, vi. Machine drafts.

export const BASS_SCALES = [
  { id: "bass-em-pent-0", labelKey: "scale.bass-em-pent-0", rootPc: 4, intervals: [0, 3, 5, 7, 10], startFret: 0, sort: 11 },
  { id: "bass-am-pent-5", labelKey: "scale.bass-am-pent-5", rootPc: 9, intervals: [0, 3, 5, 7, 10], startFret: 5, sort: 12 },
  { id: "bass-g-major-3", labelKey: "scale.bass-g-major-3", rootPc: 7, intervals: [0, 2, 4, 5, 7, 9, 11], startFret: 3, sort: 13 },
  { id: "bass-a-blues-5", labelKey: "scale.bass-a-blues-5", rootPc: 9, intervals: [0, 3, 5, 6, 7, 10], startFret: 5, sort: 14 },
].map((s) => ({ ...s, instrumentId: "bass" }));

export const BASS_NAMES = [
  ["scale.bass-em-pent-0", "Scale name", ["E minor pentatonic · open position", "E minor pentatonic · ตำแหน่งสายเปล่า", "Eマイナーペンタトニック・開放ポジション", "E 小调五声音阶 · 开放把位", "Ми минорная пентатоника · открытая позиция", "E minor pentatonic · ຕຳແໜ່ງສາຍເປົ່າ", "E 마이너 펜타토닉 · 개방 포지션", "E minor pentatonic · vị trí dây buông"]],
  ["scale.bass-am-pent-5", "Scale name", ["A minor pentatonic · fret 5", "A minor pentatonic · เฟร็ต 5", "Aマイナーペンタトニック・5フレット", "A 小调五声音阶 · 第 5 品", "Ля минорная пентатоника · 5-й лад", "A minor pentatonic · ເຟຣັດ 5", "A 마이너 펜타토닉 · 5프렛", "A minor pentatonic · phím 5"]],
  ["scale.bass-g-major-3", "Scale name", ["G major · fret 3", "G major · เฟร็ต 3", "Gメジャー・3フレット", "G 大调 · 第 3 品", "Соль мажор · 3-й лад", "G major · ເຟຣັດ 3", "G 메이저 · 3프렛", "G major · phím 3"]],
  ["scale.bass-a-blues-5", "Scale name", ["A blues · fret 5", "A blues · เฟร็ต 5", "Aブルース・5フレット", "A 布鲁斯音阶 · 第 5 品", "Ля блюз · 5-й лад", "A blues · ເຟຣັດ 5", "A 블루스 · 5프렛", "A blues · phím 5"]],
] as [string, string, string[]][];
