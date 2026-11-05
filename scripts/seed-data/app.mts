// Translation rows for the practice app and catalog labels (instruments, scales, effects).
// Column order: en, th, ja, zh-CN, ru, lo, ko, vi.

export const APP = [
  ["app.title", "Page heading, line break = \\n", ["Pick a scale.\nPlay it back.", "เลือกสเกล\nแล้วเล่นตาม", "スケールを選んで\n弾いてみよう。", "选个音阶，\n弹出来。", "Выберите гамму.\nСыграйте её.", "ເລືອກສະເກວ\nແລ້ວຫຼິ້ນຕາມ", "스케일을 고르고\n연주해 보세요.", "Chọn thang âm.\nChơi lại nó."]],
  [
    "app.lead",
    "Intro under the heading",
    [
      "Pick a scale and the notes run toward the line. Play your real guitar through your audio interface and the app listens and scores you.",
      "เลือกสเกล โน้ตจะวิ่งเข้าหาเส้น เล่นกีต้าจริงผ่าน audio interface แล้วระบบฟังและให้คะแนนทันที",
      "スケールを選ぶと音符がラインに向かって流れます。オーディオインターフェース経由で実際のギターを弾くと、アプリが聴いて採点します。",
      "选择音阶后，音符会向判定线移动。通过音频接口弹奏真实吉他，应用会聆听并评分。",
      "Выберите гамму, и ноты побегут к линии. Играйте на настоящей гитаре через аудиоинтерфейс, а приложение послушает и оценит.",
      "ເລືອກສະເກວ ໂນດຈະແລ່ນເຂົ້າຫາເສັ້ນ ຫຼິ້ນກີຕ້າຈິງຜ່ານອິນເຕີເຟດສຽງ ແລ້ວລະບົບຟັງແລະໃຫ້ຄະແນນ.",
      "스케일을 고르면 음표가 선을 향해 달려옵니다. 오디오 인터페이스로 실제 기타를 치면 앱이 듣고 점수를 매깁니다.",
      "Chọn thang âm, các nốt sẽ chạy về phía vạch. Chơi guitar thật qua audio interface, ứng dụng sẽ nghe và chấm điểm.",
    ],
  ],
  ["app.instrument.title", "Section title", ["Instrument", "เครื่องดนตรี", "楽器", "乐器", "Инструмент", "ເຄື່ອງດົນຕີ", "악기", "Nhạc cụ"]],
  ["app.instrument.hint", "Section hint", ["Guitar for now", "ตอนนี้มีกีต้า", "今のところギターのみ", "目前仅支持吉他", "Пока только гитара", "ຕອນນີ້ມີກີຕ້າ", "현재는 기타만", "Hiện có guitar"]],
  ["app.soon", "Suffix for unavailable instruments", ["soon", "เร็วๆ นี้", "近日", "即将", "скоро", "ໃກ້ຈະມາ", "곧", "sắp có"]],

  ["audio.title", "Section title", ["Audio", "เสียง", "オーディオ", "音频", "Аудио", "ສຽງ", "오디오", "Âm thanh"]],
  ["audio.hint", "Section hint", ["Choose your interface input and output", "เลือก input และ output ของ interface", "インターフェースの入力と出力を選択", "选择接口的输入和输出", "Выберите вход и выход интерфейса", "ເລືອກ input ແລະ output ຂອງອິນເຕີເຟດ", "인터페이스의 입력과 출력을 선택", "Chọn input và output của interface"]],
  ["audio.input", "Select label", ["Input", "Input", "入力", "输入", "Вход", "Input", "입력", "Input"]],
  ["audio.channel", "Select label", ["Channel", "Channel", "チャンネル", "声道", "Канал", "Channel", "채널", "Kênh"]],
  ["audio.channel.all", "Option", ["Mono · all channels", "Mono · ทุกช่อง", "モノラル・全チャンネル", "单声道 · 所有声道", "Моно · все каналы", "Mono · ທຸກຊ່ອງ", "모노 · 모든 채널", "Mono · tất cả kênh"]],
  ["audio.channel.left", "Option", ["Input 1 (left)", "Input 1 (ซ้าย)", "入力1（左）", "输入 1（左）", "Вход 1 (левый)", "Input 1 (ຊ້າຍ)", "입력 1 (왼쪽)", "Input 1 (trái)"]],
  ["audio.channel.right", "Option", ["Input 2 (right)", "Input 2 (ขวา)", "入力2（右）", "输入 2（右）", "Вход 2 (правый)", "Input 2 (ຂວາ)", "입력 2 (오른쪽)", "Input 2 (phải)"]],
  ["audio.output", "Select label", ["Output", "Output", "出力", "输出", "Выход", "Output", "출력", "Output"]],
  ["audio.systemDefault", "Option", ["System default", "ค่าเริ่มต้นของระบบ", "システム既定", "系统默认", "По умолчанию", "ຄ່າເລີ່ມຕົ້ນລະບົບ", "시스템 기본값", "Mặc định hệ thống"]],
  ["audio.inputN", "Fallback device name, {n} = number", ["Input {n}", "Input {n}", "入力 {n}", "输入 {n}", "Вход {n}", "Input {n}", "입력 {n}", "Input {n}"]],
  ["audio.outputN", "Fallback device name, {n} = number", ["Output {n}", "Output {n}", "出力 {n}", "输出 {n}", "Выход {n}", "Output {n}", "출력 {n}", "Output {n}"]],
  ["audio.connect", "Button", ["Connect interface", "เชื่อมต่อ interface", "インターフェースに接続", "连接接口", "Подключить интерфейс", "ເຊື່ອມຕໍ່ອິນເຕີເຟດ", "인터페이스 연결", "Kết nối interface"]],
  ["audio.connected", "Button when connected", ["Interface connected", "เชื่อมต่อแล้ว", "接続済み", "已连接", "Интерфейс подключён", "ເຊື່ອມຕໍ່ແລ້ວ", "연결됨", "Đã kết nối"]],
  ["audio.monitor", "Checkbox", ["Hear myself with effects (use headphones)", "ฟังเสียงตัวเองพร้อม effect (ใช้หูฟัง)", "エフェクト付きで自分の音を聴く（ヘッドホン使用）", "听到带效果的自己（请用耳机）", "Слышать себя с эффектами (в наушниках)", "ຟັງສຽງຕົນເອງພ້ອມເອັບເຟັກ (ໃຊ້ຫູຟັງ)", "이펙트 적용된 내 소리 듣기 (헤드폰 사용)", "Nghe chính mình với hiệu ứng (dùng tai nghe)"]],
  ["audio.level", "Meter label", ["Input level", "ระดับสัญญาณ", "入力レベル", "输入电平", "Уровень входа", "ລະດັບສັນຍານ", "입력 레벨", "Mức tín hiệu"]],
  ["audio.latency", "Note, {ms} = milliseconds", ["Output latency about {ms} ms.", "latency ขาออกประมาณ {ms} ms", "出力レイテンシは約 {ms} ms です。", "输出延迟约 {ms} 毫秒。", "Задержка вывода около {ms} мс.", "latency ຂາອອກປະມານ {ms} ms.", "출력 지연은 약 {ms}ms입니다.", "Độ trễ output khoảng {ms} ms."]],
  ["audio.noOutputSelect", "Note when the browser cannot choose output", ["This browser cannot choose an output device; use Chrome or Edge.", "เบราว์เซอร์นี้เลือก output ไม่ได้ ใช้ Chrome หรือ Edge", "このブラウザでは出力デバイスを選べません。ChromeかEdgeを使ってください。", "此浏览器无法选择输出设备，请使用 Chrome 或 Edge。", "Этот браузер не позволяет выбрать выход; используйте Chrome или Edge.", "ເບົາເຊີນີ້ເລືອກ output ບໍ່ໄດ້ ໃຊ້ Chrome ຫຼື Edge.", "이 브라우저는 출력 장치를 고를 수 없습니다. Chrome이나 Edge를 사용하세요.", "Trình duyệt này không chọn được output; hãy dùng Chrome hoặc Edge."]],
  ["audio.cleanSignal", "Note", ["Echo cancellation, noise suppression and auto gain are turned off for a clean signal.", "ปิด echo cancellation, noise suppression และ auto gain เพื่อให้สัญญาณสะอาด", "クリーンな信号のため、エコーキャンセル・ノイズ抑制・自動ゲインはオフです。", "为保证信号干净，已关闭回声消除、降噪和自动增益。", "Эхоподавление, шумоподавление и автоусиление отключены ради чистого сигнала.", "ປິດ echo cancellation, noise suppression ແລະ auto gain ເພື່ອໃຫ້ສັນຍານສະອາດ.", "깨끗한 신호를 위해 에코 제거, 노이즈 억제, 자동 게인을 껐습니다.", "Đã tắt khử echo, khử ồn và tự động tăng âm để tín hiệu sạch."]],

  ["err.denied", "Error", ["Microphone permission was blocked. Allow it in the address bar, then press Connect interface.", "ไมโครโฟนถูกบล็อก อนุญาตที่แถบที่อยู่ แล้วกดเชื่อมต่อ interface", "マイクの許可がブロックされています。アドレスバーで許可してから「インターフェースに接続」を押してください。", "麦克风权限被阻止。请在地址栏中允许，然后点击“连接接口”。", "Доступ к микрофону заблокирован. Разрешите его в адресной строке и нажмите «Подключить интерфейс».", "ໄມໂຄຣໂຟນຖືກບລັອກ ອະນຸຍາດທີ່ແຖບທີ່ຢູ່ ແລ້ວກົດເຊື່ອມຕໍ່ອິນເຕີເຟດ.", "마이크 권한이 차단되었습니다. 주소창에서 허용한 뒤 '인터페이스 연결'을 누르세요.", "Quyền micro bị chặn. Hãy cho phép trên thanh địa chỉ rồi bấm Kết nối interface."]],
  ["err.notFound", "Error", ["No audio input was found. Plug in your interface and press Connect interface.", "ไม่พบอุปกรณ์รับเสียง เสียบ interface แล้วกดเชื่อมต่อ", "オーディオ入力が見つかりません。インターフェースを接続してからもう一度押してください。", "未找到音频输入。请插好接口后重试。", "Аудиовход не найден. Подключите интерфейс и повторите.", "ບໍ່ພົບອຸປະກອນຮັບສຽງ ສຽບອິນເຕີເຟດແລ້ວກົດເຊື່ອມຕໍ່.", "오디오 입력을 찾을 수 없습니다. 인터페이스를 연결하고 다시 누르세요.", "Không tìm thấy input âm thanh. Hãy cắm interface rồi thử lại."]],
  ["err.overconstrained", "Error", ["The selected input is not available. Pick another input.", "input ที่เลือกใช้ไม่ได้ เลือกอันอื่น", "選択した入力は利用できません。別の入力を選んでください。", "所选输入不可用，请选择其他输入。", "Выбранный вход недоступен. Выберите другой.", "input ທີ່ເລືອກໃຊ້ບໍ່ໄດ້ ເລືອກອັນອື່ນ.", "선택한 입력을 사용할 수 없습니다. 다른 입력을 고르세요.", "Input đã chọn không khả dụng. Hãy chọn input khác."]],
  ["err.generic", "Error", ["Could not start audio.", "เริ่มระบบเสียงไม่ได้", "オーディオを開始できません。", "无法启动音频。", "Не удалось запустить аудио.", "ເລີ່ມລະບົບສຽງບໍ່ໄດ້.", "오디오를 시작할 수 없습니다.", "Không thể khởi động âm thanh."]],
  ["err.camera", "Error", ["Camera permission was blocked.", "กล้องถูกบล็อก", "カメラの許可がブロックされています。", "摄像头权限被阻止。", "Доступ к камере заблокирован.", "ກ້ອງຖືກບລັອກ.", "카메라 권한이 차단되었습니다.", "Quyền camera bị chặn."]],

  ["lesson.title", "Section title", ["Lesson", "บทเรียน", "レッスン", "课程", "Урок", "ບົດຮຽນ", "레슨", "Bài học"]],
  ["lesson.scale", "Select label", ["Scale", "สเกล", "スケール", "音阶", "Гамма", "ສະເກວ", "스케일", "Thang âm"]],
  ["lesson.speed", "Slider label, {bpm}", ["Speed · {bpm} BPM", "ความเร็ว · {bpm} BPM", "速さ・{bpm} BPM", "速度 · {bpm} BPM", "Темп · {bpm} BPM", "ຄວາມໄວ · {bpm} BPM", "속도 · {bpm} BPM", "Tốc độ · {bpm} BPM"]],
  ["lesson.onBeat", "Judging mode", ["On beat", "ตามจังหวะ", "リズム通り", "按节拍", "В такт", "ຕາມຈັງຫວະ", "박자에 맞춰", "Đúng nhịp"]],
  ["lesson.wait", "Judging mode", ["Wait for me", "รอฉัน", "待ってもらう", "等我弹", "Ждать меня", "ລໍຖ້າຂ້ອຍ", "기다려 주기", "Chờ tôi"]],
  ["lesson.metronome", "Checkbox: click sound on every beat", ["Metronome sound", "เสียงเมโทรนอม", "メトロノーム音", "节拍器声音", "Звук метронома", "ສຽງເມໂທຣນອມ", "메트로놈 소리", "Tiếng metronome"]],
  ["lesson.names", "Checkbox", ["Show note names", "แสดงชื่อโน้ต", "音名を表示", "显示音名", "Показывать названия нот", "ສະແດງຊື່ໂນດ", "음 이름 표시", "Hiện tên nốt"]],

  ["stage.start", "Button", ["Start", "เริ่ม", "スタート", "开始", "Старт", "ເລີ່ມ", "시작", "Bắt đầu"]],
  ["stage.stop", "Button", ["Stop", "หยุด", "停止", "停止", "Стоп", "ຢຸດ", "정지", "Dừng"]],
  ["stage.tune", "Button", ["Tune first", "จูนก่อน", "先にチューニング", "先调音", "Сначала настроить", "ຈູນກ່ອນ", "먼저 튜닝", "Chỉnh dây trước"]],
  ["stage.closeTuner", "Button", ["Close tuner", "ปิดจูนเนอร์", "チューナーを閉じる", "关闭调音器", "Закрыть тюнер", "ປິດເຄື່ອງຈູນ", "튜너 닫기", "Đóng máy chỉnh dây"]],
  ["stage.hearing", "Label on the stage", ["Hearing", "ได้ยิน", "検出", "检测到", "Слышу", "ໄດ້ຍິນ", "감지", "Đang nghe"]],
  ["stage.aria", "Accessible name of the canvas", ["Note stage", "เวทีโน้ต", "ノートステージ", "音符舞台", "Сцена с нотами", "ເວທີໂນດ", "음표 무대", "Sân khấu nốt"]],
  ["stage.good", "Floating hit label", ["GOOD", "ดี", "GOOD", "不错", "ХОРОШО", "ດີ", "GOOD", "TỐT"]],
  ["stage.perfect", "Floating hit label", ["PERFECT", "เยี่ยม", "PERFECT", "完美", "ОТЛИЧНО", "ເຍີ່ຍມ", "PERFECT", "HOÀN HẢO"]],
  ["stage.combo", "Floating combo label, {n}", ["COMBO x{n}", "COMBO x{n}", "COMBO x{n}", "连击 x{n}", "КОМБО x{n}", "COMBO x{n}", "COMBO x{n}", "COMBO x{n}"]],
  ["stage.miss", "Floating miss label", ["MISS", "พลาด", "MISS", "失误", "МИМО", "ພາດ", "MISS", "TRƯỢT"]],

  ["stats.score", "Stat label", ["Score", "คะแนน", "スコア", "分数", "Очки", "ຄະແນນ", "점수", "Điểm"]],
  ["stats.combo", "Stat label", ["Combo", "Combo", "コンボ", "连击", "Комбо", "Combo", "콤보", "Combo"]],
  ["stats.accuracy", "Stat label", ["Accuracy", "ความแม่นยำ", "精度", "准确率", "Точность", "ຄວາມແມ່ນຍຳ", "정확도", "Độ chính xác"]],

  ["tuner.title", "Section title", ["Tuner", "จูนเนอร์", "チューナー", "调音器", "Тюнер", "ເຄື່ອງຈູນ", "튜너", "Máy chỉnh dây"]],
  ["tuner.hint", "Section hint", ["Pluck each open string", "ดีดสายเปล่าทีละสาย", "開放弦を1本ずつ弾く", "依次弹空弦", "Играйте открытые струны по очереди", "ດີດສາຍເປົ່າທີລະສາຍ", "개방현을 하나씩 튕기세요", "Gảy từng dây buông"]],
  ["tuner.waiting", "Status", ["Waiting for a note", "รอโน้ต", "音を待っています", "等待音符", "Жду ноту", "ລໍຖ້າໂນດ", "음을 기다리는 중", "Đang chờ nốt"]],
  ["tuner.inTune", "Status", ["In tune", "ตรงแล้ว", "合っています", "音准正确", "Строй верный", "ຕົງແລ້ວ", "정확합니다", "Đúng cao độ"]],
  ["tuner.sharp", "Status, {c} cents", ["{c}¢ sharp, loosen the string", "สูงไป {c}¢ คลายสายลง", "{c}¢ 高い。弦をゆるめてください", "偏高 {c}¢，请放松琴弦", "Выше на {c}¢, ослабьте струну", "ສູງໄປ {c}¢ ຜ່ອນສາຍລົງ", "{c}¢ 높음, 줄을 풀어 주세요", "Cao {c}¢, hãy chùng dây"]],
  ["tuner.flat", "Status, {c} cents", ["{c}¢ flat, tighten the string", "ต่ำไป {c}¢ ขึงสายขึ้น", "{c}¢ 低い。弦を締めてください", "偏低 {c}¢，请拧紧琴弦", "Ниже на {c}¢, подтяните струну", "ຕ່ຳໄປ {c}¢ ຂຶງສາຍຂຶ້ນ", "{c}¢ 낮음, 줄을 조여 주세요", "Thấp {c}¢, hãy siết dây"]],
  ["tuner.open", "Note", ["Open strings: {notes}", "สายเปล่า: {notes}", "開放弦：{notes}", "空弦：{notes}", "Открытые струны: {notes}", "ສາຍເປົ່າ: {notes}", "개방현: {notes}", "Dây buông: {notes}"]],

  ["fret.title", "Section title", ["Fretboard", "คอกีต้า", "指板", "指板", "Гриф", "ຄໍກີຕ້າ", "지판", "Cần đàn"]],
  ["fret.hint", "Section hint", ["Notes to play", "โน้ตที่ต้องเล่น", "弾く音", "要弹的音符", "Ноты для игры", "ໂນດທີ່ຕ້ອງຫຼິ້ນ", "연주할 음", "Nốt cần chơi"]],
  ["fret.aria", "Accessible name, {scale}", ["Fretboard, {scale}", "คอกีต้า {scale}", "指板 {scale}", "指板 {scale}", "Гриф, {scale}", "ຄໍກີຕ້າ {scale}", "지판 {scale}", "Cần đàn {scale}"]],
  ["camera.label", "Camera box", ["Camera (optional)", "กล้อง (ไม่บังคับ)", "カメラ（任意）", "摄像头（可选）", "Камера (по желанию)", "ກ້ອງ (ບໍ່ບັງຄັບ)", "카메라 (선택)", "Camera (tùy chọn)"]],
  ["camera.on", "Button", ["Turn on", "เปิด", "オン", "开启", "Включить", "ເປີດ", "켜기", "Bật"]],
  ["camera.off", "Button", ["Turn off", "ปิด", "オフ", "关闭", "Выключить", "ປິດ", "끄기", "Tắt"]],

  ["tone.title", "Section title", ["Tone", "โทนเสียง", "トーン", "音色", "Тембр", "ໂທນສຽງ", "톤", "Âm sắc"]],
  ["tone.hint", "Section hint", ["Effect chain in order. You hear it when Hear myself is on.", "effect ตามลำดับ ได้ยินเมื่อเปิด ฟังเสียงตัวเอง", "エフェクトは順に適用。自分の音を聴く設定をオンにすると聞こえます。", "效果器按顺序串联。开启“听到自己”后可听到。", "Цепочка эффектов по порядку. Слышна, когда включено «Слышать себя».", "ເອັບເຟັກຕາມລຳດັບ ໄດ້ຍິນເມື່ອເປີດຟັງສຽງຕົນເອງ.", "이펙트는 순서대로 적용됩니다. '내 소리 듣기'를 켜면 들립니다.", "Chuỗi hiệu ứng theo thứ tự. Nghe được khi bật Nghe chính mình."]],
  ["common.on", "Toggle", ["On", "เปิด", "オン", "开", "Вкл", "ເປີດ", "켜짐", "Bật"]],
  ["common.off", "Toggle", ["Off", "ปิด", "オフ", "关", "Выкл", "ປິດ", "꺼짐", "Tắt"]],
  ["common.loading", "Loading text", ["Loading…", "กำลังโหลด…", "読み込み中…", "加载中…", "Загрузка…", "ກຳລັງໂຫຼດ…", "불러오는 중…", "Đang tải…"]],
  ["app.foot", "App footer", ["Single notes only. Chords are not detected.", "ตรวจได้เฉพาะโน้ตเดี่ยว ยังไม่รองรับคอร์ด", "単音のみ対応。和音は検出できません。", "仅支持单音，暂不识别和弦。", "Только одиночные ноты. Аккорды не распознаются.", "ກວດໄດ້ສະເພາະໂນດດ່ຽວ ຍັງບໍ່ຮອງຮັບຄອດ.", "단음만 인식합니다. 코드는 감지하지 못합니다.", "Chỉ nhận nốt đơn. Chưa hỗ trợ hợp âm."]],

  // catalog labels
  ["instrument.guitar", "Instrument name", ["Guitar", "กีต้าร์", "ギター", "吉他", "Гитара", "ກີຕ້າ", "기타", "Guitar"]],
  ["instrument.bass", "Instrument name", ["Bass", "เบส", "ベース", "贝斯", "Бас", "ເບດ", "베이스", "Bass"]],
  ["instrument.vocal", "Instrument name", ["Vocal", "เสียงร้อง", "ボーカル", "人声", "Вокал", "ສຽງຮ້ອງ", "보컬", "Giọng hát"]],
  ["instrument.keys", "Instrument name", ["Keys", "คีย์บอร์ด", "鍵盤", "键盘", "Клавиши", "ຄີບອດ", "키보드", "Keyboard"]],
  ["scale.am-pent-5", "Scale name", ["A minor pentatonic · fret 5", "A minor pentatonic · เฟร็ต 5", "Aマイナーペンタトニック・5フレット", "A 小调五声音阶 · 第 5 品", "Ля-минорная пентатоника · 5-й лад", "A minor pentatonic · ເຟຣດ 5", "A 마이너 펜타토닉 · 5프렛", "A minor pentatonic · phím 5"]],
  ["scale.am-blues-5", "Scale name", ["A minor blues · fret 5", "A minor blues · เฟร็ต 5", "Aマイナーブルース・5フレット", "A 小调布鲁斯 · 第 5 品", "Ля-минорный блюз · 5-й лад", "A minor blues · ເຟຣດ 5", "A 마이너 블루스 · 5프렛", "A minor blues · phím 5"]],
  ["scale.c-major-8", "Scale name", ["C major · fret 8", "C major · เฟร็ต 8", "Cメジャー・8フレット", "C 大调 · 第 8 品", "До мажор · 8-й лад", "C major · ເຟຣດ 8", "C 메이저 · 8프렛", "C major · phím 8"]],
  ["scale.em-pent-12", "Scale name", ["E minor pentatonic · fret 12", "E minor pentatonic · เฟร็ต 12", "Eマイナーペンタトニック・12フレット", "E 小调五声音阶 · 第 12 品", "Ми-минорная пентатоника · 12-й лад", "E minor pentatonic · ເຟຣດ 12", "E 마이너 펜타토닉 · 12프렛", "E minor pentatonic · phím 12"]],
  ["scale.g-major-2", "Scale name", ["G major · fret 2", "G major · เฟร็ต 2", "Gメジャー・2フレット", "G 大调 · 第 2 品", "Соль мажор · 2-й лад", "G major · ເຟຣດ 2", "G 메이저 · 2프렛", "G major · phím 2"]],
  ["effect.gate", "Effect name", ["Noise gate", "ตัดนอยส์", "ノイズゲート", "降噪门", "Шумовой гейт", "ຕັດນອຍສ໌", "노이즈 게이트", "Noise gate"]],
  ["effect.drive", "Effect name", ["Overdrive", "โอเวอร์ไดรฟ์", "オーバードライブ", "过载", "Овердрайв", "ໂອເວີໄດຣຟ໌", "오버드라이브", "Overdrive"]],
  ["effect.eq", "Effect name", ["Amp EQ", "อีคิวแอมป์", "アンプEQ", "音箱均衡", "Эквалайзер усилителя", "EQ ແອມ", "앰프 EQ", "EQ amp"]],
  ["effect.chorus", "Effect name", ["Chorus", "คอรัส", "コーラス", "合唱", "Хорус", "ຄໍຣັສ", "코러스", "Chorus"]],
  ["effect.delay", "Effect name", ["Delay", "ดีเลย์", "ディレイ", "延迟", "Дилей", "ດີເລ", "딜레이", "Delay"]],
  ["effect.reverb", "Effect name", ["Reverb", "รีเวิร์บ", "リバーブ", "混响", "Ревербератор", "ຣີເວີບ", "리버브", "Reverb"]],
];

export const INSTRUMENTS = [
  { id: "guitar", labelKey: "instrument.guitar", available: true, tuning: [40, 45, 50, 55, 59, 64], stringNames: ["E", "A", "D", "G", "B", "e"], image: "/images/instruments/guitar-white.jpg", imageCredit: "Shan Lu", sort: 1 },
  { id: "bass", labelKey: "instrument.bass", available: true, tuning: [28, 33, 38, 43], stringNames: ["E", "A", "D", "G"], image: "/images/instruments/bass-red.jpg", imageCredit: "Victor Barrios", sort: 2 },
  { id: "vocal", labelKey: "instrument.vocal", available: false, tuning: [], stringNames: [], image: "/images/instruments/vocal-mic.jpg", imageCredit: "Jonathan Velasquez", sort: 3 },
  { id: "keys", labelKey: "instrument.keys", available: false, tuning: [], stringNames: [], image: "/images/instruments/keys-nord.jpg", imageCredit: "Joshua Humpfer", sort: 4 },
];

export const SCALES = [
  { id: "am-pent-5", labelKey: "scale.am-pent-5", rootPc: 9, intervals: [0, 3, 5, 7, 10], startFret: 5, sort: 1 },
  { id: "am-blues-5", labelKey: "scale.am-blues-5", rootPc: 9, intervals: [0, 3, 5, 6, 7, 10], startFret: 5, sort: 2 },
  { id: "c-major-8", labelKey: "scale.c-major-8", rootPc: 0, intervals: [0, 2, 4, 5, 7, 9, 11], startFret: 8, sort: 3 },
  { id: "em-pent-12", labelKey: "scale.em-pent-12", rootPc: 4, intervals: [0, 3, 5, 7, 10], startFret: 12, sort: 4 },
  { id: "g-major-2", labelKey: "scale.g-major-2", rootPc: 7, intervals: [0, 2, 4, 5, 7, 9, 11], startFret: 2, sort: 5 },
].map((s) => ({ ...s, instrumentId: "guitar" }));

export const EFFECTS = [
  { id: "gate", labelKey: "effect.gate", defaultAmount: 25, sort: 1 },
  { id: "drive", labelKey: "effect.drive", defaultAmount: 50, sort: 2 },
  { id: "eq", labelKey: "effect.eq", defaultAmount: 50, sort: 3 },
  { id: "chorus", labelKey: "effect.chorus", defaultAmount: 40, sort: 4 },
  { id: "delay", labelKey: "effect.delay", defaultAmount: 35, sort: 5 },
  { id: "reverb", labelKey: "effect.reverb", defaultAmount: 40, sort: 6 },
];

export const SETTINGS = [
  { key: "lesson.bpmMin", value: 40, description: "Slowest practice speed" },
  { key: "lesson.bpmMax", value: 160, description: "Fastest practice speed" },
  { key: "lesson.bpmDefault", value: 80, description: "Speed when a visitor first opens the app" },
  { key: "lesson.defaultScale", value: "am-pent-5", description: "Scale id selected for new visitors" },
  { key: "i18n.fallbackLang", value: "en", description: "Language used when a translation is missing" },
];
