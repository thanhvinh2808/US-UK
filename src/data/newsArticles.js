/**
 * V-English Educational News & Articles Bank
 * Professional articles covering IELTS tips, Spaced Repetition, pronunciation, and grammar.
 */

export const newsArticles = [
  {
    id: 'art_1',
    slug: 'ielts-reading-spaced-repetition',
    title: 'Bí quyết chinh phục 8.0 IELTS Reading với thuật toán Spaced Repetition (SM-2)',
    category: 'IELTS Tips',
    categoryColor: 'indigo',
    readingTime: '6 phút đọc',
    publishedAt: '2026-08-20',
    author: {
      name: 'V-English Academic Team',
      role: 'Curriculum & Research',
      avatar: '🎓'
    },
    excerpt: 'Khám phá cách thuật toán SuperMemo-2 giúp tối ưu hóa bộ nhớ ngắn hạn thành dài hạn, giải quyết triệt để vấn đề "học trước quên sau" của sĩ tử IELTS.',
    tags: ['IELTS', 'Spaced Repetition', 'Từ vựng', 'Phương pháp học'],
    toc: [
      { id: 'why-forget', text: '1. Nghịch lý đường cong lãng quên Ebbinghaus' },
      { id: 'sm2-explained', text: '2. Nguyên lý hoạt động của thuật toán SM-2' },
      { id: 'ielts-application', text: '3. Ứng dụng SM-2 vào bài đọc IELTS Academic' },
      { id: 'daily-routine', text: '4. Lộ trình ôn tập 15 phút mỗi ngày' }
    ],
    relatedVocabulary: [
      {
        word: 'pragmatic',
        ipa: '/præɡˈmæt.ɪk/',
        vietnamese: 'thực tế, thực dụng',
        example: 'In IELTS Reading, candidates need a pragmatic approach to time management.'
      },
      {
        word: 'retention',
        ipa: '/rɪˈten.ʃən/',
        vietnamese: 'sự ghi nhớ, duy trì kiến thức',
        example: 'Spaced repetition dramatically improves vocabulary retention over time.'
      },
      {
        word: 'ubiquitous',
        ipa: '/juːˈbɪk.wɪ.təs/',
        vietnamese: 'phổ biến, có mặt ở khắp nơi',
        example: 'Academic vocabulary is ubiquitous across all four modules of IELTS.'
      }
    ],
    content: `
      <p class="lead">Một trong những trở ngại lớn nhất của người học tiếng Anh khi luyện thi IELTS Reading không phải là thiếu tài liệu, mà là <strong>tốc độ quên từ vựng nhanh hơn tốc độ nạp mới</strong>.</p>
      
      <h3 id="why-forget">1. Nghịch lý đường cong lãng quên Ebbinghaus</h3>
      <p>Theo nghiên cứu của nhà tâm lý học Hermann Ebbinghaus, não bộ con người có xu hướng quên tới <strong>50% thông tin mới chỉ sau 1 giờ</strong> và hơn <strong>70% sau 24 giờ</strong> nếu không có sự nhắc lại đúng thời điểm. Khi đọc một bài đọc dài 800-900 từ của IELTS Academic, việc gặp lại các từ vựng C1-C2 mà không có hệ thống quản lý ôn tập sẽ khiến bạn phải tra cứu lặp đi lặp lại cùng một từ.</p>

      <h3 id="sm2-explained">2. Nguyên lý hoạt động của thuật toán SM-2</h3>
      <p>Thuật toán SuperMemo-2 (SM-2) được phát triển nhằm giải quyết triệt để vấn đề này bằng cách <em>tính toán chính xác thời điểm bạn chuẩn bị quên một từ vựng</em> để đưa ra nhắc nhở ôn tập (Active Recall). Mỗi lần bạn đánh giá độ dễ (Easiness Factor) và khả năng nhớ từ (Grade 1 đến 5), hệ thống sẽ tăng dần khoảng cách ngày ôn tập: từ 1 ngày, lên 6 ngày, 14 ngày, rồi 30 ngày.</p>

      <h3 id="ielts-application">3. Ứng dụng SM-2 vào bài đọc IELTS Academic</h3>
      <p>Khi gặp một từ vựng khó trong bài đọc:</p>
      <ul>
        <li><strong>Không chép từ đơn lẻ:</strong> Luôn lưu từ kèm ngữ cảnh câu chứa từ đó trong bài đọc.</li>
        <li><strong>Gắn nhãn chủ đề:</strong> Phân loại từ vào các chủ đề quen thuộc của IELTS như <em>Environment, Technology, Psychology, Education</em>.</li>
        <li><strong>Đánh giá trung thực:</strong> Nếu gặp khó khăn khi nhớ lại nghĩa, hãy chọn mức điểm 1-2 để thuật toán tự động đưa từ đó vào hàng đợi ôn tập sớm nhất.</li>
      </ul>

      <h3 id="daily-routine">4. Lộ trình ôn tập 15 phút mỗi ngày</h3>
      <p>Chỉ cần dành 15 phút đầu giờ sáng hoặc trước khi đi ngủ để hoàn thành danh sách flashcards "Due Today" trên V-English, bạn sẽ duy trì được lượng vốn từ lên tới 3,000+ từ học thuật một cách bền vững mà không bị kiệt sức.</p>
    `
  },
  {
    id: 'art_2',
    slug: 'us-uk-pronunciation-differences',
    title: 'Phân biệt phát âm Anh-Anh và Anh-Mỹ: 5 điểm mấu chốt',
    category: 'Pronunciation',
    categoryColor: 'blue',
    readingTime: '5 phút đọc',
    publishedAt: '2026-08-18',
    author: {
      name: 'V-English Phonetics Lab',
      role: 'Linguistics Specialists',
      avatar: '🎙️'
    },
    excerpt: 'Hiểu rõ sự khác biệt giữa chuẩn Anh-Anh (Received Pronunciation) và Anh-Mỹ (General American) để cải thiện phát âm và phản xạ nghe hiểu vượt trội.',
    tags: ['Phát âm', 'US-UK', 'IPA', 'Listening'],
    toc: [
      { id: 'rhoticity', text: '1. Âm /r/ ở cuối từ (Rhoticity)' },
      { id: 'flapped-t', text: '2. Âm Flapped T /t/ thành /d/' },
      { id: 'vowel-o', text: '3. Nguyên âm /ɒ/ (UK) vs /ɑː/ (US)' },
      { id: 'yod-dropping', text: '4. Yod-dropping trong new, tune, duty' },
      { id: 'stress-differences', text: '5. Vị trí trọng âm trong một số từ quen thuộc' }
    ],
    relatedVocabulary: [
      {
        word: 'schedule',
        ipa: 'US: /ˈskedʒ.uːl/ | UK: /ˈʃedʒ.uːl/',
        vietnamese: 'lịch trình, thời gian biểu',
        example: 'The conference schedule has been updated.'
      },
      {
        word: 'advertisement',
        ipa: 'US: /ˌæd.vɚˈtaɪz.mənt/ | UK: /ədˈvɜː.tɪs.mənt/',
        vietnamese: 'mục quảng cáo',
        example: 'We placed an advertisement in the local newspaper.'
      },
      {
        word: 'water',
        ipa: 'US: /ˈwɑː.t̬ɚ/ | UK: /ˈwɔː.tər/',
        vietnamese: 'nước uống',
        example: 'Drink plenty of water throughout the day.'
      }
    ],
    content: `
      <p class="lead">Dù bạn đang theo đuổi giọng Anh - Mỹ (General American) hiện đại hay giọng Anh - Anh (BBC / Oxford) thanh lịch, việc nắm vững các quy tắc chuyển đổi ngữ âm sẽ giúp bạn không bị bỡ ngỡ khi nghe người bản xứ đối thoại.</p>

      <h3 id="rhoticity">1. Âm /r/ ở cuối từ (Rhoticity)</h3>
      <p>Đây là điểm khác biệt dễ nhận thấy nhất: Tiếng Anh - Mỹ là giọng <em>Rhotic</em> (phát âm rõ âm /r/ ở cuối từ như <em>car, water, hard</em>), trong khi tiếng Anh - Anh chuẩn là giọng <em>Non-rhotic</em> (âm /r/ ở đuôi biến thành nguyên âm schwa nhẹ hoặc bị nuốt).</p>

      <h3 id="flapped-t">2. Âm Flapped T /t/ thành /d/</h3>
      <p>Trong tiếng Mỹ, khi âm /t/ đứng giữa 2 nguyên âm và không mang trọng âm, nó thường được phát âm lướt nhẹ thành âm /d/ (Flapped T). Ví dụ: <em>water</em> nghe như <em>wader</em>, <em>better</em> nghe như <em>bedder</em>. Trong tiếng Anh - Anh, âm /t/ luôn được bật rõ ràng và sắc nét.</p>

      <h3 id="vowel-o">3. Nguyên âm /ɒ/ (UK) vs /ɑː/ (US)</h3>
      <p>Các từ như <em>hot, box, coffee, stop</em> trong tiếng Anh - Anh sử dụng nguyên âm tròn môi /ɒ/, trong khi người Mỹ phát âm mở rộng khẩu hình thành /ɑː/ (nghe gần giống âm "a" kéo dài).</p>

      <h3 id="yod-dropping">4. Yod-dropping trong new, tune, duty</h3>
      <p>Người Anh thường giữ lại âm /j/ (như âm 'd' trong tiếng Việt) trước nguyên âm /uː/: <em>news</em> phát âm là /njuːz/, <em>duty</em> là /ˈdjuː.ti/. Người Mỹ thường bỏ âm /j/ này (Yod-dropping): <em>news</em> thành /nuːz/, <em>duty</em> thành /ˈduː.t̬i/.</p>

      <h3 id="stress-differences">5. Vị trí trọng âm trong một số từ quen thuộc</h3>
      <p>Một số từ có sự khác biệt rõ về trọng âm: <em>garage</em> (UK: /ˈɡær.ɑːʒ/ - US: /ɡəˈrɑːʒ/), <em>ballet</em> (UK: /ˈbæl.eɪ/ - US: /bæˈleɪ/). Việc luyện tập với núm chuyển đổi US/UK trên V-English sẽ giúp bạn tự tin làm chủ cả hai phương ngữ này.</p>
    `
  },
  {
    id: 'art_3',
    slug: '12-english-tenses-mindmap',
    title: 'Bản đồ tư duy 12 thì trong tiếng Anh và quy tắc phối thì không bao giờ quên',
    category: 'Grammar',
    categoryColor: 'amber',
    readingTime: '7 phút đọc',
    publishedAt: '2026-08-15',
    author: {
      name: 'V-English Grammar Lab',
      role: 'Language Structure Team',
      avatar: '📖'
    },
    excerpt: 'Tổng hợp cấu trúc, dấu hiệu nhận biết và sơ đồ trục thời gian của 12 thì tiếng Anh, giúp bạn làm chủ ngữ pháp viết và nói chuẩn xác.',
    tags: ['Ngữ pháp', '12 Thì', 'Writing', 'Cấu trúc câu'],
    toc: [
      { id: 'timeline-logic', text: '1. Logic của trục thời gian 3x4' },
      { id: 'present-tenses', text: '2. Nhóm thì Hiện tại (Present)' },
      { id: 'past-tenses', text: '3. Nhóm thì Quá khứ (Past)' },
      { id: 'future-tenses', text: '4. Nhóm thì Tương lai (Future)' },
      { id: 'tense-harmony', text: '5. Quy tắc phối thì trong câu phức' }
    ],
    relatedVocabulary: [
      {
        word: 'conjugation',
        ipa: '/ˌkɒn.dʒʊˈɡeɪ.ʃən/',
        vietnamese: 'sự chia động từ theo thì/ngôi',
        example: 'Verb conjugation is essential for grammatical accuracy in writing.'
      },
      {
        word: 'simultaneous',
        ipa: '/ˌsɪm.əlˈteɪ.ni.əs/',
        vietnamese: 'đồng thời, diễn ra cùng lúc',
        example: 'Past Continuous expresses two simultaneous actions in the past.'
      }
    ],
    content: `
      <p class="lead">Thay vì học vẹt 12 công thức riêng rẽ, việc hiểu <strong>logic bản chất của 3 mốc thời gian nhân với 4 thể trạng thái</strong> sẽ giúp bạn tự động chia thì chính xác 100% trong mọi tình huống giao tiếp và bài thi.</p>

      <h3 id="timeline-logic">1. Logic của trục thời gian 3x4</h3>
      <p>Hệ thống thì tiếng Anh được xây dựng dựa trên ma trận 3 thời điểm (Quá khứ, Hiện tại, Tương lai) kết hợp với 4 thể trạng thái:</p>
      <ul>
        <li><strong>Đơn (Simple):</strong> Diễn tả sự thật, thói quen, sự kiện trọn vẹn.</li>
        <li><strong>Tiếp diễn (Continuous):</strong> Diễn tả hành động đang diễn ra tại một thời điểm xác định.</li>
        <li><strong>Hoàn thành (Perfect):</strong> Diễn tả hành động đã xảy ra và hoàn tất trước một mốc thời gian khác.</li>
        <li><strong>Hoàn thành tiếp diễn (Perfect Continuous):</strong> Nhấn mạnh tính liên tục và độ dài thời gian của hành động.</li>
      </ul>

      <h3 id="present-tenses">2. Nhóm thì Hiện tại (Present)</h3>
      <p>Gồm <em>Present Simple</em> (S + V/V-s), <em>Present Continuous</em> (S + am/is/are + V-ing), <em>Present Perfect</em> (S + have/has + V3/ed), và <em>Present Perfect Continuous</em> (S + have/has been + V-ing). Điểm mấu chốt của Present Perfect là kết quả của hành động trong quá khứ vẫn còn ảnh hưởng hoặc liên quan tới hiện tại.</p>

      <h3 id="past-tenses">3. Nhóm thì Quá khứ (Past)</h3>
      <p>Cần đặc biệt lưu ý sự phối thì giữa <em>Past Simple</em> và <em>Past Continuous</em> (hành động đang xảy ra thì có hành động khác xen vào: <em>"While I was studying, the phone rang"</em>), cũng như <em>Past Perfect</em> (xảy ra trước một hành động khác trong quá khứ: <em>"By the time she arrived, we had left"</em>).</p>

      <h3 id="future-tenses">4. Nhóm thì Tương lai (Future)</h3>
      <p>Phân biệt rõ <em>Will + V</em> (quyết định tức thời), <em>Be going to + V</em> (kế hoạch có dự định từ trước hoặc có căn cứ rõ ràng), và <em>Future Perfect</em> (hành động sẽ hoàn thành trước một mốc trong tương lai: <em>"By 2030, I will have graduated"</em>).</p>

      <h3 id="tense-harmony">5. Quy tắc phối thì trong câu phức</h3>
      <p>Luôn nhớ nguyên tắc: Mệnh đề phụ thuộc thời gian (bắt đầu bằng <em>when, as soon as, by the time, until</em>) không bao giờ đi với thì tương lai, mà phải lùi một bậc về thì hiện tại.</p>
    `
  },
  {
    id: 'art_4',
    slug: 'minimal-pairs-shadowing-reflexes',
    title: 'Minimal Pairs và Shadowing: Xây dựng phản xạ phát âm chuẩn',
    category: 'Pronunciation',
    categoryColor: 'blue',
    readingTime: '5 phút đọc',
    publishedAt: '2026-08-12',
    author: {
      name: 'V-English Academic Team',
      role: 'Speech & Acoustics',
      avatar: '🎧'
    },
    excerpt: 'Cách kết hợp cặp âm tương đồng (Minimal Pairs) và kỹ thuật nhại giọng (Shadowing) để xóa bỏ hoàn toàn ngữ điệu gượng gạo khi nói tiếng Anh.',
    tags: ['Minimal Pairs', 'Shadowing', 'Speaking', 'Phản xạ'],
    toc: [
      { id: 'what-is-minimal-pairs', text: '1. Minimal Pairs là gì và tại sao người Việt hay nhầm?' },
      { id: 'shadowing-technique', text: '2. Kỹ thuật Shadowing 3 bước chuẩn quốc tế' },
      { id: 'combining-methods', text: '3. Cách kết hợp luyện tập trên V-English' }
    ],
    relatedVocabulary: [
      {
        word: 'nuance',
        ipa: '/ˈnjuː.ɑːns/',
        vietnamese: 'sắc thái nhỏ, sự khác biệt tinh tế',
        example: 'Shadowing helps learners catch every subtle nuance of native intonation.'
      },
      {
        word: 'articulation',
        ipa: '/ɑːˌtɪk.jəˈleɪ.ʃən/',
        vietnamese: 'sự phát âm rõ ràng, khẩu hình chuẩn',
        example: 'Minimal pairs training improves mouth articulation and acoustic clarity.'
      }
    ],
    content: `
      <p class="lead">Nhiều người học tiếng Anh đọc hiểu rất tốt nhưng khi giao tiếp lại cảm thấy tự ti vì người đối diện hay hỏi lại. Nguyên nhân chính là do <strong>tai chưa phân biệt được các cặp âm tối thiểu (Minimal Pairs)</strong> và <strong>cơ miệng chưa quen với nhịp điệu bản xứ</strong>.</p>

      <h3 id="what-is-minimal-pairs">1. Minimal Pairs là gì và tại sao người Việt hay nhầm?</h3>
      <p>Minimal Pairs là các cặp từ chỉ khác nhau duy nhất một âm vị nhưng mang nghĩa hoàn toàn khác nhau, ví dụ: <em>ship / sheep</em> (/ɪ/ vs /iː/), <em>bad / bed</em> (/æ/ vs /e/), <em>think / sink</em> (/θ/ vs /s/). Tiếng Việt không có nguyên âm ngắn/dài phân biệt nghĩa như tiếng Anh, dẫn đến việc người học thường phát âm chúng giống hệt nhau.</p>

      <h3 id="shadowing-technique">2. Kỹ thuật Shadowing 3 bước chuẩn quốc tế</h3>
      <p>Kỹ thuật Shadowing (nói đuổi theo giọng mẫu) được các chuyên gia phiên dịch đồng thời sử dụng để rèn luyện phản xạ ngữ điệu:</p>
      <ul>
        <li><strong>Bước 1 - Nghe hiểu & Đọc Transcript:</strong> Nắm rõ nội dung đoạn hội thoại và đánh dấu các điểm nối âm, trọng âm câu.</li>
        <li><strong>Bước 2 - Shadowing chậm có phụ đề:</strong> Bật audio giọng mẫu và nói theo ngay sau 0.5 giây, bắt chước từng chỗ lên/xuống giọng.</li>
        <li><strong>Bước 3 - Blind Shadowing:</strong> Tắt phụ đề, chỉ dựa vào đôi tai để lặp lại chính xác tốc độ và cảm xúc của người nói.</li>
      </ul>

      <h3 id="combining-methods">3. Cách kết hợp luyện tập trên V-English</h3>
      <p>Mỗi ngày hãy dành 5 phút luyện tính năng <em>Minimal Pairs</em> trong mục Kỹ năng để huấn luyện thính giác, sau đó sang mục <em>Shadowing</em> để thực hành đọc theo đoạn văn mẫu US hoặc UK.</p>
    `
  },
  {
    id: 'art_5',
    slug: 'v-english-v2-offline-sync-release',
    title: 'V-English 2.0: Ra mắt chế độ Offline Learning và Multi-Device Sync',
    category: 'V-English News',
    categoryColor: 'emerald',
    readingTime: '4 phút đọc',
    publishedAt: '2026-08-25',
    author: {
      name: 'V-English Product Team',
      role: 'Engineering & Innovation',
      avatar: '🚀'
    },
    excerpt: 'Tổng quan về kiến trúc Offline-First, hàng đợi Outbox thông minh và cơ chế đồng bộ nhất quán đa thiết bị trong bản cập nhật lớn V-English V2.0.',
    tags: ['V-English', 'Bản cập nhật', 'Offline Mode', 'Security'],
    toc: [
      { id: 'offline-first', text: '1. Kiến trúc Offline-First: Học không gián đoạn' },
      { id: 'smart-sync', text: '2. Hàng đợi Outbox & Giải quyết xung đột LWW' },
      { id: 'security-rtr', text: '3. Bảo mật đa phiên với Refresh Token Rotation' }
    ],
    relatedVocabulary: [
      {
        word: 'seamless',
        ipa: '/ˈsiːm.ləs/',
        vietnamese: 'liền mạch, trơn tru không gián đoạn',
        example: 'The new update provides a seamless transition between online and offline states.'
      },
      {
        word: 'resilience',
        ipa: '/rɪˈzɪl.jəns/',
        vietnamese: 'khả năng phục hồi, độ bền bỉ',
        example: 'Offline outbox architecture ensures maximum data resilience under poor networks.'
      }
    ],
    content: `
      <p class="lead">Chúng tôi hân hạnh giới thiệu <strong>V-English 2.0</strong> — bước chuyển mình mạnh mẽ với trải nghiệm học tập không gián đoạn, bảo mật cấp độ doanh nghiệp và giao diện người dùng hoàn toàn mới.</p>

      <h3 id="offline-first">1. Kiến trúc Offline-First: Học không gián đoạn</h3>
      <p>Từ phiên bản 2.0, V-English được thiết kế theo tư duy <em>Offline-First</em>. Bạn có thể mở Flashcards, làm bài tập ngữ pháp, tra cứu từ vựng trên máy bay, tàu điện ngầm hay tại những nơi mất kết nối Internet. Mọi thao tác đều được phản hồi tức thì trên thiết bị.</p>

      <h3 id="smart-sync">2. Hàng đợi Outbox & Giải quyết xung đột LWW</h3>
      <p>Khi bạn học trong chế độ offline, toàn bộ kết quả ôn tập được lưu an toàn trong hàng đợi <code>outbox_queue</code> phân vùng riêng cho từng tài khoản. Ngay khi có mạng trở lại, hệ thống tự động đồng bộ lên máy chủ với thuật toán Last-Write-Wins (LWW) để đảm bảo tiến độ mới nhất luôn được bảo toàn.</p>

      <h3 id="security-rtr">3. Bảo mật đa phiên với Refresh Token Rotation</h3>
      <p>Hệ thống xác thực được nâng cấp với chuẩn JWT HS256 kết hợp HttpOnly Refresh Token Rotation (RTR) và cơ chế phát hiện Replay Attack. Người dùng có thể dễ dàng theo dõi và đăng xuất tất cả các thiết bị khác chỉ với một cú nhấp chuột trong mục Quản lý phiên.</p>
    `
  }
];

export const getArticleBySlug = (slug) => {
  return newsArticles.find(a => a.slug === slug) || null;
};

export const getRelatedArticles = (currentId, limit = 2) => {
  return newsArticles.filter(a => a.id !== currentId).slice(0, limit);
};

export default {
  newsArticles,
  getArticleBySlug,
  getRelatedArticles
};
