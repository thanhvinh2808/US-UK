import React, { useState } from 'react';
import './TensesHandbook.css';

const TENSES_DATA = [
  {
    id: 'present_simple',
    nameVi: 'Thì Hiện Tại Đơn',
    nameEn: 'Present Simple Tense',
    category: 'present',
    definition: 'Thì hiện tại đơn (Present simple) dùng để diễn tả những hành động, đặc điểm, thói quen đang diễn ra trong hiện tại hoặc các sự thật hiển nhiên, chân lý khó có thể thay đổi.',
    formulas: {
      verb: {
        affirmative: 'S + V1 (s/es)',
        negative: 'S + do / does not + V-inf',
        interrogative: 'Do / Does + S + V-inf?'
      },
      be: {
        affirmative: 'S + am / is / are + Complement',
        negative: 'S + am / is / are + not + Complement',
        interrogative: 'Am / Is / Are + S + Complement?'
      }
    },
    usages: [
      'Diễn tả những hiện tượng, quy luật tự nhiên, chân lý hoặc sự thật hiển nhiên chung.',
      'Diễn tả thói quen, sở thích, quan điểm hành vi lặp đi lặp lại ở hiện tại.',
      'Diễn tả lịch trình, thời khóa biểu của tàu xe, máy bay hoặc chương trình cố định.',
      'Diễn tả hành động cảm nhận bằng giác quan ngay tại thời điểm nói.'
    ],
    examples: [
      { en: 'I play football every day.', vi: 'Tôi chơi bóng đá mỗi ngày.', type: 'Động từ thường' },
      { en: 'She is a teacher.', vi: 'Cô ấy là một giáo viên.', type: 'Động từ To Be' },
      { en: 'I do not like coffee.', vi: 'Tôi không thích cà phê.', type: 'Động từ thường' },
      { en: 'Is she your friend?', vi: 'Cô ấy có phải bạn của bạn không?', type: 'Động từ To Be' }
    ],
    signals: ['often', 'always', 'usually', 'frequently', 'seldom', 'rarely', 'never', 'hardly ever', 'sometimes', 'every day/week/month']
  },
  {
    id: 'present_continuous',
    nameVi: 'Thì Hiện Tại Tiếp Diễn',
    nameEn: 'Present Continuous Tense',
    category: 'present',
    definition: 'Thì hiện tại tiếp diễn (Present continuous) dùng để diễn tả hành động đang xảy ra ngay tại thời điểm nói hoặc xung quanh thời điểm nói và mang tính chất tạm thời.',
    formulas: {
      verb: {
        affirmative: 'S + am / is / are + V-ing',
        negative: 'S + am / is / are + not + V-ing',
        interrogative: 'Am / Is / Are + S + V-ing?'
      }
    },
    usages: [
      'Diễn tả hành động đang diễn ra ngay tại thời điểm nói.',
      'Diễn tả hành động sẽ xảy ra trong tương lai gần theo một kế hoạch hay dự định cụ thể đã được sắp xếp.',
      'Diễn tả hành động tạm thời xảy ra ở hiện tại (khác với thói quen thông thường hàng ngày).',
      'Diễn tả những xu hướng chuyển biến, thay đổi ở hiện tại (thường đi với become, get, grow...).',
      'Diễn tả hành động lặp đi lặp lại gây khó chịu cho người nói khi dùng chung với "always", "constantly".'
    ],
    examples: [
      { en: 'She is walking to school.', vi: 'Cô ấy đang đi bộ đến trường.', type: 'Khẳng định' },
      { en: 'They are not working now.', vi: 'Họ hiện đang không làm việc.', type: 'Phủ định' },
      { en: 'Are they playing football?', vi: 'Họ có đang chơi bóng đá không?', type: 'Nghi vấn' },
      { en: 'What are you doing now?', vi: 'Bây giờ bạn đang làm gì thế?', type: 'Câu hỏi WH-' }
    ],
    signals: ['now', 'right now', 'at the moment', 'at present', 'Look!', 'Listen!', 'Keep silent!', 'tomorrow (trong kế hoạch)', 'this week/month']
  },
  {
    id: 'present_perfect',
    nameVi: 'Thì Hiện Tại Hoàn Thành',
    nameEn: 'Present Perfect Tense',
    category: 'present',
    definition: 'Thì hiện tại hoàn thành (Present perfect) diễn tả hành động hoặc sự việc đã xảy ra trong quá khứ và có liên hệ mật thiết với hiện tại, thông qua kết quả, sự tiếp diễn hoặc trải nghiệm tích lũy.',
    formulas: {
      verb: {
        affirmative: 'S + have / has + V3/ed',
        negative: 'S + have / has + not + V3/ed',
        interrogative: 'Have / Has + S + V3/ed?'
      },
      be: {
        affirmative: 'S + have / has + been + Complement',
        negative: 'S + have / has + not + been + Complement',
        interrogative: 'Have / Has + S + been + Complement?'
      }
    },
    usages: [
      'Diễn tả hành động xảy ra trong quá khứ nhưng kết quả của nó quan trọng hoặc có liên quan đến hiện tại.',
      'Diễn tả hành động hoặc trạng thái bắt đầu từ quá khứ, kéo dài và vẫn tiếp diễn ở hiện tại.',
      'Diễn tả những trải nghiệm, kinh nghiệm sống tính đến thời điểm hiện tại (thường đi với ever, never).',
      'Diễn tả sự việc vừa mới xảy ra (đi với just, recently).'
    ],
    examples: [
      { en: 'She has finished her homework.', vi: 'Cô ấy đã hoàn thành bài tập về nhà.', type: 'Động từ thường' },
      { en: 'They have been friends for 10 years.', vi: 'Họ đã là bạn bè suốt 10 năm.', type: 'Động từ To Be' },
      { en: 'He has not seen that movie.', vi: 'Anh ấy chưa xem bộ phim đó.', type: 'Động từ thường' },
      { en: 'Have they been to the park?', vi: 'Họ đã đến công viên chưa?', type: 'Động từ To Be' }
    ],
    signals: ['since + mốc thời gian', 'for + khoảng thời gian', 'just', 'already', 'yet', 'never', 'ever', 'before', 'recently', 'lately', 'so far', 'up to now']
  },
  {
    id: 'present_perfect_continuous',
    nameVi: 'Thì Hiện Tại HT Tiếp Diễn',
    nameEn: 'Present Perfect Continuous Tense',
    category: 'present',
    definition: 'Thì hiện tại hoàn thành tiếp diễn (Present perfect continuous) diễn tả hành động bắt đầu trong quá khứ kéo dài liên tục không ngắt quãng đến hiện tại và có thể tiếp diễn ở tương lai.',
    formulas: {
      verb: {
        affirmative: 'S + have / has + been + V-ing',
        negative: 'S + have / has + not + been + V-ing',
        interrogative: 'Have / Has + S + been + V-ing?'
      }
    },
    usages: [
      'Diễn tả các hành động xảy ra trong quá khứ và kéo dài liên tục, không bị gián đoạn cho đến hiện tại.',
      'Nhấn mạnh vào quá trình/sự kéo dài thời gian của hành động thay vì kết quả.'
    ],
    examples: [
      { en: 'She has been studying all day.', vi: 'Cô ấy đã học liên tục cả ngày.', type: 'Khẳng định' },
      { en: 'He has not been sleeping well lately.', vi: 'Gần đây anh ấy không ngủ ngon.', type: 'Phủ định' },
      { en: 'Have they been working on the project?', vi: 'Họ đã làm việc trên dự án đó suốt chưa?', type: 'Nghi vấn' }
    ],
    signals: ['since + mốc thời gian', 'for + khoảng thời gian', 'recently', 'lately', 'all day/week (long)', 'non-stop', 'round-the-clock']
  },
  {
    id: 'past_simple',
    nameVi: 'Thì Quá Khứ Đơn',
    nameEn: 'Past Simple Tense',
    category: 'past',
    definition: 'Thì quá khứ đơn (Past simple) dùng để diễn tả một sự việc đã xảy ra, kết thúc hoàn toàn và không còn liên quan đến hiện tại ở một thời điểm xác định trong quá khứ.',
    formulas: {
      verb: {
        affirmative: 'S + V2/ed',
        negative: 'S + did + not + V-inf',
        interrogative: 'Did + S + V-inf?'
      },
      be: {
        affirmative: 'S + was / were + Complement',
        negative: 'S + was / were + not + Complement',
        interrogative: 'Was / Were + S + Complement?'
      }
    },
    usages: [
      'Diễn tả hành động xảy ra và kết thúc hoàn toàn trong quá khứ.',
      'Diễn tả thói quen hoặc hành động lặp đi lặp lại trong quá khứ nhưng nay không còn nữa.',
      'Diễn tả một chuỗi hành động xảy ra liên tiếp trong câu chuyện quá khứ.',
      'Diễn tả một trạng thái, tình huống lâu dài trong quá khứ.'
    ],
    examples: [
      { en: 'They played football last weekend.', vi: 'Họ đã chơi bóng đá cuối tuần trước.', type: 'Động từ thường' },
      { en: 'He was tired after the trip.', vi: 'Anh ấy đã mệt sau chuyến đi.', type: 'Động từ To Be' },
      { en: 'He didn\'t go to the party.', vi: 'Anh ấy đã không đi đến bữa tiệc.', type: 'Động từ thường' },
      { en: 'Where was she yesterday?', vi: 'Hôm qua cô ấy đã ở đâu?', type: 'Động từ To Be' }
    ],
    signals: ['yesterday', 'last night/week/month/year', 'ago (ví dụ: 3 days ago)', 'in + năm quá khứ (ví dụ: in 1990)', 'when (trong quá khứ)']
  },
  {
    id: 'past_continuous',
    nameVi: 'Thì Quá Khứ Tiếp Diễn',
    nameEn: 'Past Continuous Tense',
    category: 'past',
    definition: 'Thì quá khứ tiếp diễn (Past continuous) diễn tả hành động đang xảy ra tại một thời điểm cụ thể hoặc một khoảng thời gian xác định trong quá khứ.',
    formulas: {
      verb: {
        affirmative: 'S + was / were + V-ing',
        negative: 'S + was / were + not + V-ing',
        interrogative: 'Was / Were + S + V-ing?'
      }
    },
    usages: [
      'Diễn tả hành động đang diễn ra tại một thời điểm rất cụ thể trong quá khứ.',
      'Diễn tả hành động đang xảy ra trong quá khứ thì có một hành động khác xen vào (hành động xen vào dùng quá khứ đơn).',
      'Diễn tả hai hay nhiều hành động đang xảy ra song song cùng lúc trong quá khứ.',
      'Miêu tả chi tiết phụ/ngữ cảnh nền trong một câu chuyện kể.'
    ],
    examples: [
      { en: 'She was reading a book when I called her.', vi: 'Cô ấy đang đọc sách khi tôi gọi điện.', type: 'Hành động cắt nhau' },
      { en: 'He wasn\'t working yesterday.', vi: 'Hôm qua anh ấy đã không làm việc.', type: 'Phủ định' },
      { en: 'What were you doing at 8 PM?', vi: 'Bạn đang làm gì vào lúc 8 giờ tối qua?', type: 'Thời điểm cụ thể' }
    ],
    signals: ['at + giờ cụ thể + thời gian quá khứ', 'at that time', 'while (trong khi)', 'when (khi)']
  },
  {
    id: 'past_perfect',
    nameVi: 'Thì Quá Khứ Hoàn Thành',
    nameEn: 'Past Perfect Tense',
    category: 'past',
    definition: 'Thì quá khứ hoàn thành (Past perfect) dùng để diễn tả một sự việc, hành động xảy ra và hoàn thành trước một thời điểm cụ thể hoặc trước một hành động khác trong quá khứ.',
    formulas: {
      verb: {
        affirmative: 'S + had + V3/ed',
        negative: 'S + had + not + V3/ed',
        interrogative: 'Had + S + V3/ed?'
      }
    },
    usages: [
      'Diễn tả hành động đã hoàn thành trước một hành động khác trong quá khứ (hành động xảy ra sau dùng quá khứ đơn).',
      'Diễn tả hành động đã xảy ra trước một mốc thời gian cụ thể trong quá khứ.',
      'Sử dụng trong mệnh đề điều kiện của câu điều kiện loại 3 (diễn tả giả thiết trái thực tế quá khứ).'
    ],
    examples: [
      { en: 'She had finished her homework before the class started.', vi: 'Cô ấy đã làm xong bài tập trước khi lớp học bắt đầu.', type: 'Khẳng định' },
      { en: 'He hadn\'t seen that movie before.', vi: 'Anh ấy chưa từng xem bộ phim đó trước đây.', type: 'Phủ định' },
      { en: 'Had they left when you arrived?', vi: 'Họ đã rời đi trước khi bạn đến à?', type: 'Nghi vấn' }
    ],
    signals: ['before', 'after', 'by the time + quá khứ đơn', 'until then', 'prior to']
  },
  {
    id: 'past_perfect_continuous',
    nameVi: 'Thì Quá Khứ HT Tiếp Diễn',
    nameEn: 'Past Perfect Continuous Tense',
    category: 'past',
    definition: 'Thì quá khứ hoàn thành tiếp diễn (Past perfect continuous) diễn tả hành động bắt đầu trong quá khứ, diễn ra liên tục kéo dài trước một mốc thời gian hoặc một hành động khác trong quá khứ.',
    formulas: {
      verb: {
        affirmative: 'S + had + been + V-ing',
        negative: 'S + had + not + been + V-ing',
        interrogative: 'Had + S + been + V-ing?'
      }
    },
    usages: [
      'Diễn tả hành động xảy ra và kéo dài liên tục trước một hành động khác trong quá khứ (nhấn mạnh tính liên tục).',
      'Diễn tả hành động quá khứ kéo dài liên tục và để lại kết quả cụ thể trong quá khứ.'
    ],
    examples: [
      { en: 'They had been playing soccer all afternoon.', vi: 'Họ đã chơi bóng đá suốt cả buổi chiều.', type: 'Khẳng định' },
      { en: 'He hadn\'t been watching TV when I arrived.', vi: 'Anh ấy đang không xem tivi lúc tôi đến.', type: 'Phủ định' },
      { en: 'What had you been doing when I called?', vi: 'Bạn đang làm cái gì suốt lúc tôi gọi thế?', type: 'Nghi vấn' }
    ],
    signals: ['before', 'after', 'until', 'by the time', 'how long', 'all day/afternoon']
  },
  {
    id: 'future_simple',
    nameVi: 'Thì Tương Lai Đơn',
    nameEn: 'Future Simple Tense',
    category: 'future',
    definition: 'Thì tương lai đơn (Future simple) dùng để diễn tả hành động sẽ xảy ra trong tương lai, được quyết định ngẫu hứng ngay tại thời điểm nói hoặc đưa ra phỏng đoán cá nhân.',
    formulas: {
      verb: {
        affirmative: 'S + will + V-inf',
        negative: 'S + will + not + V-inf',
        interrogative: 'Will + S + V-inf?'
      },
      be: {
        affirmative: 'S + will + be + Complement',
        negative: 'S + will + not + be + Complement',
        interrogative: 'Will + S + be + Complement?'
      }
    },
    usages: [
      'Diễn tả hành động hoặc sự kiện sẽ xảy ra trong tương lai.',
      'Đưa ra một quyết định, ý định ngẫu hứng ngay tại thời điểm nói.',
      'Đưa ra ý kiến, dự đoán mang tính cá nhân về tương lai.',
      'Dùng trong câu hứa hẹn, đề nghị giúp đỡ, yêu cầu lịch sự hoặc đe dọa.'
    ],
    examples: [
      { en: 'I will visit my grandparents this weekend.', vi: 'Tôi sẽ đi thăm ông bà vào cuối tuần này.', type: 'Động từ thường' },
      { en: 'They will be busy during the holidays.', vi: 'Họ sẽ rất bận rộn trong kỳ nghỉ lễ.', type: 'Động từ To Be' },
      { en: 'She will not eat lunch at the office today.', vi: 'Hôm nay cô ấy sẽ không ăn trưa ở văn phòng.', type: 'Động từ thường' },
      { en: 'Will she be at the office tomorrow morning?', vi: 'Sáng mai cô ấy sẽ có mặt ở văn phòng chứ?', type: 'Động từ To Be' }
    ],
    signals: ['tomorrow', 'next week/month/year', 'in + khoảng thời gian (ví dụ: in 10 minutes)', 'think', 'believe', 'suppose', 'sure', 'perhaps']
  },
  {
    id: 'future_continuous',
    nameVi: 'Thì Tương Lai Tiếp Diễn',
    nameEn: 'Future Continuous Tense',
    category: 'future',
    definition: 'Thì tương lai tiếp diễn (Future continuous) diễn tả hành động sẽ đang diễn ra tại một thời điểm cụ thể hoặc một khoảng thời gian xác định trong tương lai.',
    formulas: {
      verb: {
        affirmative: 'S + will + be + V-ing',
        negative: 'S + will + not + be + V-ing',
        interrogative: 'Will + S + be + V-ing?'
      }
    },
    usages: [
      'Diễn tả hành động sẽ đang diễn ra tại một thời điểm cụ thể trong tương lai.',
      'Diễn tả hành động đang diễn ra ở tương lai thì có hành động khác xen vào (hành động xen vào dùng hiện tại đơn).',
      'Diễn tả hành động tương lai diễn ra như một lịch trình quen thuộc hoặc thời gian biểu định sẵn.'
    ],
    examples: [
      { en: 'She will be studying all day tomorrow.', vi: 'Cô ấy sẽ đang học cả ngày vào ngày mai.', type: 'Khẳng định' },
      { en: 'I will not be studying at 10 PM.', vi: 'Tôi sẽ đang không học bài vào lúc 10 giờ tối.', type: 'Phủ định' },
      { en: 'Will they be working on Saturday?', vi: 'Họ sẽ đang làm việc vào ngày thứ Bảy chứ?', type: 'Nghi vấn' }
    ],
    signals: ['at + giờ cụ thể + thời gian tương lai', 'at this time tomorrow/next week', 'all day tomorrow', 'when + hiện tại đơn (trong mệnh đề thời gian)']
  },
  {
    id: 'future_perfect',
    nameVi: 'Thì Tương Lai Hoàn Thành',
    nameEn: 'Future Perfect Tense',
    category: 'future',
    definition: 'Thì tương lai hoàn thành (Future perfect) dùng để diễn tả hành động sẽ hoàn thành và kết thúc trước một thời điểm cụ thể hoặc trước một hành động khác trong tương lai.',
    formulas: {
      verb: {
        affirmative: 'S + will + have + V3/ed',
        negative: 'S + will + not + have + V3/ed',
        interrogative: 'Will + S + have + V3/ed?'
      }
    },
    usages: [
      'Diễn tả hành động sẽ kết thúc và hoàn tất trước một thời điểm cụ thể ở tương lai.',
      'Diễn tả hành động sẽ hoàn thành trước khi một hành động khác xảy ra ở tương lai (hành động sau dùng thì hiện tại đơn).'
    ],
    examples: [
      { en: 'I will have finished my homework by 8 PM.', vi: 'Tôi sẽ hoàn thành xong bài tập trước 8 giờ tối.', type: 'Khẳng định' },
      { en: 'They won\'t have repaired the car by next week.', vi: 'Họ sẽ chưa sửa xong chiếc ô tô vào tuần tới.', type: 'Phủ định' },
      { en: 'Will they have arrived by the time we start the meeting?', vi: 'Họ sẽ đến trước lúc chúng ta bắt đầu cuộc họp chứ?', type: 'Nghi vấn' }
    ],
    signals: ['by + mốc thời gian tương lai', 'by then', 'by this time next week', 'by the time + hiện tại đơn']
  },
  {
    id: 'future_perfect_continuous',
    nameVi: 'Thì Tương Lai HT Tiếp Diễn',
    nameEn: 'Future Perfect Continuous Tense',
    category: 'future',
    definition: 'Thì tương lai hoàn thành tiếp diễn (Future perfect continuous) diễn tả hành động bắt đầu và kéo dài liên tục không ngắt quãng đến một mốc thời gian cụ thể hoặc một hành động khác ở tương lai.',
    formulas: {
      verb: {
        affirmative: 'S + will + have + been + V-ing',
        negative: 'S + will + not + have + been + V-ing',
        interrogative: 'Will + S + have + been + V-ing?'
      }
    },
    usages: [
      'Diễn tả hành động diễn ra liên tục, không ngắt quãng đến một thời điểm cụ thể hoặc sự việc khác trong tương lai (nhấn mạnh thời lượng kéo dài).'
    ],
    examples: [
      { en: 'By 9 PM tonight, I will have been working for 5 hours.', vi: 'Tính đến 9 giờ tối nay, tôi sẽ đã làm việc liên tục được 5 tiếng.', type: 'Khẳng định' },
      { en: 'They won\'t have been waiting for more than an hour by the time we arrive.', vi: 'Họ sẽ không phải chờ đợi hơn một tiếng khi chúng tôi đến nơi.', type: 'Phủ định' },
      { en: 'Will you have been working here for five years by next month?', vi: 'Tính đến tháng sau bạn sẽ đã làm việc ở đây được 5 năm liên tục chưa?', type: 'Nghi vấn' }
    ],
    signals: ['by + mốc thời gian tương lai', 'by the time + hiện tại đơn', 'for + khoảng thời gian', 'up to now']
  }
];

export default function TensesHandbook({ onNavigateBack }) {
  const [selectedTense, setSelectedTense] = useState(TENSES_DATA[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const getShortFormula = (id) => {
    switch (id) {
      case 'present_simple': return 'S + V(s/es) / S + be';
      case 'present_continuous': return 'S + am/is/are + V-ing';
      case 'present_perfect': return 'S + have/has + V3/ed';
      case 'present_perfect_continuous': return 'S + have/has been + V-ing';
      case 'past_simple': return 'S + V2/ed / S + was/were';
      case 'past_continuous': return 'S + was/were + V-ing';
      case 'past_perfect': return 'S + had + V3/ed';
      case 'past_perfect_continuous': return 'S + had been + V-ing';
      case 'future_simple': return 'S + will + V-inf';
      case 'future_continuous': return 'S + will be + V-ing';
      case 'future_perfect': return 'S + will have + V3/ed';
      case 'future_perfect_continuous': return 'S + will have been + V-ing';
      default: return '';
    }
  };

  const filterTenses = (list) => {
    return list.filter(tense => 
      tense.nameVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tense.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const presentTenses = filterTenses(TENSES_DATA.filter(t => t.category === 'present'));
  const pastTenses = filterTenses(TENSES_DATA.filter(t => t.category === 'past'));
  const futureTenses = filterTenses(TENSES_DATA.filter(t => t.category === 'future'));

  const renderTenseCard = (tense) => {
    const isActive = selectedTense.id === tense.id;
    return (
      <div
        key={tense.id}
        onClick={() => setSelectedTense(tense)}
        className={`tense-grid-card glass p-4 cursor-pointer transition-all ${isActive ? 'active' : ''}`}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="tense-card-vi font-bold">{tense.nameVi}</span>
        </div>
        <span className="tense-card-en color-text-muted text-xs block mb-3">{tense.nameEn}</span>
        <div className="short-formula-badge text-center p-1.5 rounded text-xs font-mono">
          {getShortFormula(tense.id)}
        </div>
      </div>
    );
  };

  return (
    <div className="tenses-handbook-container animate-slideup">
      {/* Header and Back Button */}
      <div className="handbook-header glass p-6 mb-8 flex justify-between items-center">
        <div>
          <button className="btn-secondary mb-3 flex items-center gap-1" onClick={onNavigateBack}>
            ⬅ Quay lại Dashboard
          </button>
          <h1 className="glow-text text-gradient">Sổ Tay 12 Thì Tiếng Anh</h1>
          <p className="color-text-muted mt-2">Tra cứu trực quan công thức cấu trúc, định nghĩa và ví dụ mẫu của toàn bộ 12 thì.</p>
        </div>
      </div>

      {/* Search Input bar */}
      <div className="handbook-controls mb-8">
        <input 
          type="text" 
          placeholder="🔍 Tìm kiếm thì nhanh (ví dụ: hoàn thành, tiếp diễn, past...)" 
          className="search-input glass px-4 py-3 w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ fontSize: '15px' }}
        />
      </div>

      {/* Timeline Bố cục Dọc (Present, Past, Future) với các thì xếp ngang */}
      <div className="tenses-rows-container flex flex-col gap-6 mb-8">
        {/* Hàng Hiện tại */}
        <div className="time-row-group present p-4 rounded-xl glass">
          <div className="group-header mb-4 p-2 rounded">
            <h3 className="font-bold">🌱 Thì Hiện Tại (Present)</h3>
          </div>
          <div className="group-items-grid">
            {presentTenses.map(tense => renderTenseCard(tense))}
            {presentTenses.length === 0 && <p className="color-text-muted text-xs p-2">Không tìm thấy kết quả phù hợp</p>}
          </div>
        </div>

        {/* Hàng Quá khứ */}
        <div className="time-row-group past p-4 rounded-xl glass">
          <div className="group-header mb-4 p-2 rounded">
            <h3 className="font-bold">⏳ Thì Quá Khứ (Past)</h3>
          </div>
          <div className="group-items-grid">
            {pastTenses.map(tense => renderTenseCard(tense))}
            {pastTenses.length === 0 && <p className="color-text-muted text-xs p-2">Không tìm thấy kết quả phù hợp</p>}
          </div>
        </div>

        {/* Hàng Tương lai */}
        <div className="time-row-group future p-4 rounded-xl glass">
          <div className="group-header mb-4 p-2 rounded">
            <h3 className="font-bold">🚀 Thì Tương Lai (Future)</h3>
          </div>
          <div className="group-items-grid">
            {futureTenses.map(tense => renderTenseCard(tense))}
            {futureTenses.length === 0 && <p className="color-text-muted text-xs p-2">Không tìm thấy kết quả phù hợp</p>}
          </div>
        </div>
      </div>

      {/* Bảng Chi Tiết Thì Đang Chọn */}
      {selectedTense && (
        <div className="tense-details-panel glass p-6 mb-8 animate-slideup">
          <div className="detail-header flex flex-wrap justify-between items-center gap-4 border-b pb-4 mb-6">
            <div>
              <span className={`badge-time-large badge-${selectedTense.category} mb-2 block w-fit`}>
                {selectedTense.category === 'present' ? 'Thì Hiện Tại' : selectedTense.category === 'past' ? 'Thì Quá khứ' : 'Thì Tương lai'}
              </span>
              <h2 className="detail-title text-gradient">{selectedTense.nameVi}</h2>
              <h4 className="detail-subtitle color-text-muted italic">{selectedTense.nameEn}</h4>
            </div>
          </div>

          {/* Cấu trúc câu chi tiết - Chiếm trọn chiều rộng ngang */}
          <div className="detail-section-block mb-6">
            <h3 className="section-title-handbook mb-3">🧮 Cấu trúc câu chi tiết</h3>
            <div className="formulas-horizontal-container flex flex-col gap-6">
              {/* verb formula */}
              {selectedTense.formulas.verb && (
                <div className="formula-type-block-horizontal p-5 rounded glass" style={{ borderTop: '3px solid var(--color-primary)', borderLeft: 'none' }}>
                  <h4 className="formula-type-title font-bold mb-4 text-xs" style={{ color: 'var(--color-primary)' }}>
                    {selectedTense.formulas.be ? '1. Đi với động từ thường (Action Verbs)' : 'Cấu trúc câu chung'}
                  </h4>
                  <div className="formula-columns-grid">
                    <div className="formula-col-card p-4 rounded glass-dark text-center">
                      <span className="formula-col-label text-xs font-semibold block mb-2 color-text-muted">Khẳng định (+)</span>
                      <code className="formula-col-code text-sm font-bold font-mono">{selectedTense.formulas.verb.affirmative}</code>
                    </div>
                    <div className="formula-col-card p-4 rounded glass-dark text-center">
                      <span className="formula-col-label text-xs font-semibold block mb-2 color-text-muted">Phủ định (-)</span>
                      <code className="formula-col-code text-sm font-bold font-mono">{selectedTense.formulas.verb.negative}</code>
                    </div>
                    <div className="formula-col-card p-4 rounded glass-dark text-center">
                      <span className="formula-col-label text-xs font-semibold block mb-2 color-text-muted">Nghi vấn (?)</span>
                      <code className="formula-col-code text-sm font-bold font-mono">{selectedTense.formulas.verb.interrogative}</code>
                    </div>
                  </div>
                </div>
              )}

              {/* to be formula */}
              {selectedTense.formulas.be && (
                <div className="formula-type-block-horizontal p-5 rounded glass" style={{ borderTop: '3px solid var(--color-secondary)', borderLeft: 'none' }}>
                  <h4 className="formula-type-title font-bold mb-4 text-xs" style={{ color: 'var(--color-secondary)' }}>
                    2. Đi với động từ To Be (am / is / are / was / were)
                  </h4>
                  <div className="formula-columns-grid">
                    <div className="formula-col-card p-4 rounded glass-dark text-center">
                      <span className="formula-col-label text-xs font-semibold block mb-2 color-text-muted">Khẳng định (+)</span>
                      <code className="formula-col-code text-sm font-bold font-mono">{selectedTense.formulas.be.affirmative}</code>
                    </div>
                    <div className="formula-col-card p-4 rounded glass-dark text-center">
                      <span className="formula-col-label text-xs font-semibold block mb-2 color-text-muted">Phủ định (-)</span>
                      <code className="formula-col-code text-sm font-bold font-mono">{selectedTense.formulas.be.negative}</code>
                    </div>
                    <div className="formula-col-card p-4 rounded glass-dark text-center">
                      <span className="formula-col-label text-xs font-semibold block mb-2 color-text-muted">Nghi vấn (?)</span>
                      <code className="formula-col-code text-sm font-bold font-mono">{selectedTense.formulas.be.interrogative}</code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 1. Định nghĩa & Khái niệm */}
          <div className="detail-section-block py-6 border-t">
            <h3 className="section-title-handbook mb-3">📖 Định nghĩa & Khái niệm</h3>
            <p className="definition-block italic p-4 rounded glass-dark">
              {selectedTense.definition}
            </p>
          </div>

          {/* 2. Các trường hợp cách dùng */}
          <div className="detail-section-block py-6 border-t">
            <h3 className="section-title-handbook mb-3">🔹 Các trường hợp sử dụng</h3>
            <div className="usages-chips-container flex flex-wrap gap-2.5">
              {selectedTense.usages.map((usage, idx) => (
                <span key={idx} className="usage-chip px-3.5 py-2 rounded-lg text-sm">
                  {usage}
                </span>
              ))}
            </div>
          </div>

          {/* 3. Dấu hiệu nhận biết */}
          <div className="detail-section-block py-6 border-t">
            <h3 className="section-title-handbook mb-3">💡 Dấu hiệu nhận biết</h3>
            <div className="signals-chips-container flex flex-wrap gap-2">
              {selectedTense.signals.map((sig, idx) => (
                <span key={idx} className="signal-pill px-3 py-1.5 rounded-full text-xs font-semibold">
                  {sig}
                </span>
              ))}
            </div>
          </div>

          {/* 4. Ví dụ minh họa */}
          <div className="detail-section-block py-6 border-t">
            <h3 className="section-title-handbook mb-3">🗨️ Câu ví dụ minh họa</h3>
            <div className="examples-grid grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedTense.examples.map((ex, idx) => (
                <div key={idx} className="example-card p-4 rounded-xl">
                  <p className="example-card-en text-sm font-bold italic mb-1">"{ex.en}"</p>
                  <p className="example-card-vi text-xs color-text-muted mb-3">{ex.vi}</p>
                  <span className="example-card-badge text-xs px-2.5 py-0.5 rounded-full">
                    {ex.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
