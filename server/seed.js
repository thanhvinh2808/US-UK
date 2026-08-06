import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import StudySet from './models/StudySet.js';

// Set public Google DNS for Node.js DNS resolver on Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

dotenv.config();

const sampleSets = [
  {
    title: 'IELTS Band 7.5+ Academic Vocabulary',
    description: 'Bao gồm các từ vựng C1-C2 thiết yếu cho IELTS Writing Task 2 & Speaking',
    topicCategory: 'IELTS Academic',
    levelTag: 'C1',
    isPublic: true,
    cards: [
      {
        termEn: 'ubiquitous',
        wordType: 'adjective',
        ipaUs: '/juːˈbɪk.wə.t̬əs/',
        ipaUk: '/juːˈbɪk.wɪ.təs/',
        definitionVi: 'phổ biến ở khắp mọi nơi',
        definitionEn: 'present, appearing, or found everywhere',
        exampleEn: 'Mobile phones have become ubiquitous in modern everyday life.',
        exampleVi: 'Điện thoại di động đã trở nên phổ biến ở khắp mọi nơi trong cuộc sống hiện đại.'
      },
      {
        termEn: 'mitigate',
        wordType: 'verb',
        ipaUs: '/ˈmɪt̬.ə.ɡeɪt/',
        ipaUk: '/ˈmɪt.ɪ.ɡeɪt/',
        definitionVi: 'xoa dịu, giảm thiểu hậu quả tiêu cực',
        definitionEn: 'make less severe, serious, or painful',
        exampleEn: 'Governments must introduce policies to mitigate the effects of climate change.',
        exampleVi: 'Các chính phủ phải đưa ra những chính sách để giảm thiểu ảnh hưởng của biến đổi khí hậu.'
      },
      {
        termEn: 'scrutinize',
        wordType: 'verb',
        ipaUs: '/ˈskruː.t̬ən.aɪz/',
        ipaUk: '/ˈskruː.tɪ.naɪz/',
        definitionVi: 'xem xét, kiểm tra kỹ lưỡng',
        definitionEn: 'examine or inspect closely and thoroughly',
        exampleEn: 'Customers tend to scrutinize product reviews before buying expensive goods.',
        exampleVi: 'Khách hàng có xu hướng xem xét kỹ các đánh giá sản phẩm trước khi mua đồ đắt tiền.'
      },
      {
        termEn: 'deleterious',
        wordType: 'adjective',
        ipaUs: '/ˌdel.əˈtɪr.i.əs/',
        ipaUk: '/ˌdel.ɪˈtɪə.ri.əs/',
        definitionVi: 'gây hại, có tác hại xấu',
        definitionEn: 'causing harm or damage',
        exampleEn: 'Excessive consumption of sugar has deleterious effects on health.',
        exampleVi: 'Tiêu thụ quá nhiều đường gây ra những tác hại xấu đối với sức khỏe.'
      }
    ]
  },
  {
    title: 'Phân Biệt Từ Vựng Mỹ (US) vs Anh (UK) Phổ Biến',
    description: 'So sánh các từ vựng có cách gọi khác nhau giữa Anh-Mỹ và Anh-Anh',
    topicCategory: 'Everyday English',
    levelTag: 'B2',
    isPublic: true,
    cards: [
      {
        termEn: 'apartment / flat',
        wordType: 'noun',
        ipaUs: '/əˈpɑːrt.mənt/',
        ipaUk: '/flæt/',
        definitionVi: 'căn hộ (US: apartment, UK: flat)',
        definitionEn: 'a set of rooms for living in',
        exampleEn: 'In London they rent a flat; in New York they rent an apartment.',
        exampleVi: 'Ở London họ thuê một căn hộ (flat); ở New York họ thuê một căn hộ (apartment).'
      },
      {
        termEn: 'elevator / lift',
        wordType: 'noun',
        ipaUs: '/ˈel.ə.veɪ.t̬ɚ/',
        ipaUk: '/lɪft/',
        definitionVi: 'thang máy (US: elevator, UK: lift)',
        definitionEn: 'a platform or compartment housed in a shaft for raising and lowering people or things',
        exampleEn: 'Take the elevator to the 5th floor in the US, or the lift in the UK.',
        exampleVi: 'Đi thang máy lên tầng 5 ở Mỹ (elevator) hoặc ở Anh (lift).'
      }
    ]
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/usuk_quizlet_db');
    console.log('🍃 Connected to MongoDB for Seeding...');
    
    await StudySet.deleteMany({});
    console.log('🧹 Cleared existing StudySets.');

    await StudySet.insertMany(sampleSets);
    console.log('✅ Seeded sample StudySets successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
    process.exit(1);
  }
};

seedDB();
