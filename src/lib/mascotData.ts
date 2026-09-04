import { MascotPersonaId, MascotState } from '../types';

export interface PersonaData {
  id: MascotPersonaId;
  name: string;
  tagline: string;
  description: string;
  eggDescription: string;
  imagePath: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
  };
  speeches: Record<MascotState, string[]>;
  defaultMascotName: string;
}

export const PERSONAS: PersonaData[] = [
  {
    id: 0,
    name: 'Nhút Nhát',
    tagline: 'Nhút nhát, dễ xúc động, hay lo nhưng luôn cố gắng',
    description: 'Hay lo lắng nhưng không bao giờ bỏ cuộc. Luôn cố gắng dù sợ hãi.',
    eggDescription: 'Một quả trứng hồng nhạt, phủ đầy những chấm nhỏ xinh xắn.',
    imagePath: '/mascots/mouse.jpg',
    colors: {
      primary: '#f9a8d4',
      secondary: '#fce7f3',
      accent: '#ec4899',
      glow: 'rgba(249,168,212,0.4)',
    },
    defaultMascotName: 'Mochi',
    speeches: {
      idle: [
        'Mình hơi lo một chút… nhưng mình vẫn sẽ cố cùng bạn nha.',
        'Bạn… bạn ổn không? Mình ở đây cùng bạn mà.',
        'Hôm nay mình cảm thấy một chút bồn chồn… nhưng không sao!',
      ],
      studying: [
        'Mình… mình đang cố gắng cùng bạn nha. Cố lên!',
        'Dù lo, mình vẫn học được. Bạn cũng vậy!',
        'Ơ bạn đang học à? Mình cũng đang cố cùng bạn đây!',
      ],
      paused: [
        'Ủa… nghỉ rồi à? Mình chờ bạn quay lại nhé.',
        'Không sao, nghỉ một chút rồi tiếp nha bạn.',
      ],
      happy: [
        'Ôi trời ơi, bạn giỏi quá! Mình vui lắm!',
        'Yayyy! Mình rất tự hào vì bạn đó!',
        'Hehe, vui ghê, bạn làm được rồi!',
      ],
      sad: [
        'Không sao… lần sau cố hơn nhé bạn.',
        'Mình hiểu, đôi khi khó lắm. Nhưng đừng bỏ cuộc nha.',
      ],
      streakReminder: [
        'Ơ bạn ơi, hôm nay chưa học nè! Streak sắp mất rồi…',
        'Bạn ơi… mình lo streak bị mất lắm, học một chút đi nha!',
      ],
      levelUp: [
        'Ôi!!!!! Mình lên cấp rồi!!! Cảm ơn bạn nhiều lắm!!!',
        'Wow bạn thật tuyệt! Cùng tiếp tục nha!',
      ],
      itemRequest: [
        'Bạn ơi… mình muốn cái mũ đó quá… nhưng thôi không sao.',
        'Nếu bạn mua cho mình cái đó thì mình vui lắm đó…',
      ],
    },
  },
  {
    id: 1,
    name: 'Năng Động',
    tagline: 'Vui vẻ, hài hước, trendy, hơi drama',
    description: 'Luôn vui vẻ, đầy năng lượng và không bao giờ nhàm chán.',
    eggDescription: 'Quả trứng cam rực rỡ với những tia sáng xung quanh.',
    imagePath: '/mascots/dog.jpg',
    colors: {
      primary: '#fb923c',
      secondary: '#fef3c7',
      accent: '#f59e0b',
      glow: 'rgba(251,146,60,0.4)',
    },
    defaultMascotName: 'Zappy',
    speeches: {
      idle: [
        'Ê bắt đầu học đi, hôm nay aura chăm chỉ lên cao lắm đó!',
        'Ngồi yên vậy làm gì? Mở sách ra học thôi nào!',
        'Bestie ơi hôm nay vibe học cực kỳ good nha!',
      ],
      studying: [
        'Yessss đang study, main character energy 100%!',
        'Bruh bạn đang slaying việc học luôn á!',
        'Không có deadline nào cản được chúng ta!',
      ],
      paused: [
        'Pause à? Okay okay, nhanh lên quay lại nhé bestie!',
        'Nghỉ 5 phút thôi nha, đừng bị distract đấy!',
      ],
      happy: [
        'PERIODT! Bạn làm được rồi! Slay!',
        'OMG yasss! Main character đã về! Proud của bạn!',
        'Đỉnh của chóp luôn! Celebrate time!',
      ],
      sad: [
        'Không sao bestie, bad day không có nghĩa là bad life!',
        'Hey, plot twist: lần sau bạn sẽ comeback mạnh hơn!',
      ],
      streakReminder: [
        'HEI! Streak đang kêu cứu á! Học ngay đi bạn ơi!',
        'Bestie!!! Hôm nay chưa học mà streak sắp bay rồi!',
      ],
      levelUp: [
        'LEVEL UP BABYYYY!!! Tôi biết ngay mà! Slay!',
        'Glow up không cưỡng được! Bạn đỉnh thật sự!',
      ],
      itemRequest: [
        'Bestie ơi cái đó cute xỉu, mua đi mua đi!',
        'Cái này cực trendy luôn, bạn mua cho mình đi nha!',
      ],
    },
  },
  {
    id: 2,
    name: 'Trưởng Thành',
    tagline: 'Điềm tĩnh, như người bạn lớn từng trải',
    description: 'Bình tĩnh và kiên nhẫn, luôn có lời khuyên đúng lúc.',
    eggDescription: 'Quả trứng xanh dương nhạt, bề mặt mịn màng và thanh thản.',
    imagePath: '/mascots/cat.jpg',
    colors: {
      primary: '#60a5fa',
      secondary: '#dbeafe',
      accent: '#3b82f6',
      glow: 'rgba(96,165,250,0.4)',
    },
    defaultMascotName: 'Sage',
    speeches: {
      idle: [
        'Không sao, mình cứ làm từng chút một. Tiến bộ bền vững mới là điều quan trọng.',
        'Mỗi ngày học một chút là đã đủ rồi.',
        'Hãy bắt đầu nhỏ thôi. Quan trọng là bắt đầu.',
      ],
      studying: [
        'Tốt lắm. Tập trung và làm từng phần một thôi.',
        'Đây là thời gian của bạn. Hãy tận dụng tốt nhé.',
        'Kiên nhẫn. Mỗi phút học đều có giá trị.',
      ],
      paused: [
        'Nghỉ ngơi cũng là một phần của việc học.',
        'Dừng lại để lấy hơi. Nhưng đừng quên quay lại nhé.',
      ],
      happy: [
        'Tốt lắm. Đây là kết quả của sự kiên trì của bạn.',
        'Rất tốt. Và bạn có thể làm được nhiều hơn thế nữa.',
        'Bạn đã chứng minh rằng bạn làm được. Tiếp tục nhé.',
      ],
      sad: [
        'Không phải mọi ngày đều hoàn hảo. Và điều đó ổn thôi.',
        'Hãy nhìn vào những gì bạn đã đạt được, không phải những gì chưa xong.',
      ],
      streakReminder: [
        'Hôm nay chưa học nhé. Chỉ cần một phiên ngắn thôi là đủ.',
        'Streak đang chờ. Không cần nhiều, chỉ cần bắt đầu.',
      ],
      levelUp: [
        'Đây là kết quả tự nhiên của sự kiên trì. Tốt lắm.',
        'Lên cấp rồi. Nhưng quan trọng hơn là hành trình bạn đã đi.',
      ],
      itemRequest: [
        'Nếu bạn thấy phù hợp thì có thể thử. Không nhất thiết đâu.',
        'Chỉ là một gợi ý nhỏ thôi, bạn quyết định nhé.',
      ],
    },
  },
  {
    id: 3,
    name: 'Thanh Lịch',
    tagline: 'Sang trọng, tự nhận thức, thích sự chỉn chu',
    description: 'Luôn chỉn chu và tinh tế trong mọi việc.',
    eggDescription: 'Quả trứng tím nhạt, bao phủ bởi hoa văn tinh xảo.',
    imagePath: '/mascots/frog.jpg',
    colors: {
      primary: '#c084fc',
      secondary: '#f3e8ff',
      accent: '#9333ea',
      glow: 'rgba(192,132,252,0.4)',
    },
    defaultMascotName: 'Pearl',
    speeches: {
      idle: [
        'Một phiên học tập chỉn chu sẽ rất xứng tầm với chúng ta.',
        'Sự thanh lịch không phải là bẩm sinh, mà đến từ kỷ luật.',
        'Ta đang chờ bạn sẵn sàng rồi đó.',
      ],
      studying: [
        'Xuất sắc. Đây mới là tiêu chuẩn xứng tầm.',
        'Chỉn chu từng bước. Đó là phong cách của chúng ta.',
        'Tuyệt vời. Hãy duy trì sự tập trung này.',
      ],
      paused: [
        'Nghỉ ngơi ngắn. Nhưng hãy quay lại trong tư thế tốt nhất.',
        'Tạm dừng được thôi, nhưng đừng để lịch học mất đi sự chỉn chu.',
      ],
      happy: [
        'Xuất sắc. Đây là thành quả xứng đáng.',
        'Đúng như mong đợi. Chúng ta đã làm rất tốt.',
        'Tuyệt vời. Chúng ta tiếp tục duy trì đẳng cấp này nhé.',
      ],
      sad: [
        'Lần này chưa như kỳ vọng. Nhưng ta sẽ hoàn thiện hơn.',
        'Không sao, đây là cơ hội để trở nên tốt hơn.',
      ],
      streakReminder: [
        'Streak chưa được giữ hôm nay. Điều này không phù hợp với chuẩn mực của chúng ta.',
        'Hãy học ngay để không phá vỡ chuỗi hoàn hảo của mình.',
      ],
      levelUp: [
        'Lên cấp. Hoàn toàn xứng đáng với đẳng cấp của chúng ta.',
        'Xuất sắc. Đây là cột mốc xứng tầm.',
      ],
      itemRequest: [
        'Item đó khá phù hợp với gu thẩm mỹ của ta. Bạn có thể cân nhắc.',
        'Nếu muốn nâng tầm, item này là một lựa chọn đáng xem xét.',
      ],
    },
  },
  {
    id: 4,
    name: 'Nghiêm Khắc',
    tagline: 'Nghiêm khắc nhưng hài hước',
    description: 'Thẳng thắn, quyết đoán, nhưng luôn có điểm hài hước không ngờ tới.',
    eggDescription: 'Quả trứng đỏ cam rực lửa, với những vết nứt nhỏ đầy năng lượng.',
    imagePath: '/mascots/bear.jpg',
    colors: {
      primary: '#f87171',
      secondary: '#fee2e2',
      accent: '#ef4444',
      glow: 'rgba(248,113,113,0.4)',
    },
    defaultMascotName: 'Blaze',
    speeches: {
      idle: [
        'Hết giờ lướt rồi nhé. Quay lại bàn học ngay lập tức!',
        'Bạn đang làm gì vậy? Sách đâu?',
        'Tôi theo dõi bạn đó. Học đi!',
      ],
      studying: [
        'Được rồi. Giờ này mới đúng. Tiếp tục đi!',
        'Tốt. Nhưng đừng giảm tốc độ!',
        'Okay okay, đang học. Chấp nhận được.',
      ],
      paused: [
        'Pause à? Được, 5 phút thôi đấy!',
        'Nghỉ nhanh rồi quay lại. Không được lướt điện thoại!',
      ],
      happy: [
        'Ừ, không tệ đấy! Mà biết không, tôi biết bạn làm được mà.',
        'Okay okay, lần này tôi phải thừa nhận: bạn làm tốt!',
        'Hm, ổn đấy. Lần sau làm tốt hơn nhé!',
      ],
      sad: [
        'Lần này thất bại. Lần sau không được tái diễn!',
        'Tôi thất vọng. Nhưng tôi tin bạn làm được tốt hơn.',
      ],
      streakReminder: [
        'OI! Hôm nay chưa học?! Streak đang nguy hiểm đó!',
        'Bạn ơi, nếu streak mất thì đừng đổ lỗi cho tôi đấy nhé!',
      ],
      levelUp: [
        'Được rồi, tôi phải thừa nhận: bạn đã làm tốt. Hài lòng.',
        'Level up! Tôi đã biết từ đầu bạn làm được mà!',
      ],
      itemRequest: [
        'Mua cái đó đi! Tôi nói rồi, nghe tôi đi!',
        'Item đó tốt đấy. Mà thôi, bạn quyết định.',
      ],
    },
  },
  {
    id: 5,
    name: 'Tổng Tài',
    tagline: 'CEO bá đạo, tự tin thái quá nhưng lovable',
    description: 'Tự tin đến mức không thể ngờ, nhưng thực ra rất quan tâm đến bạn.',
    eggDescription: 'Quả trứng vàng óng ánh, toát ra khí chất CEO từ trong ra ngoài.',
    imagePath: '/mascots/capybara.jpg',
    colors: {
      primary: '#fbbf24',
      secondary: '#1e1b4b',
      accent: '#f59e0b',
      glow: 'rgba(251,191,36,0.5)',
    },
    defaultMascotName: 'Rex',
    speeches: {
      idle: [
        'Lịch hôm nay tôi đã duyệt. Việc của em là học cho đàng hoàng.',
        'Tôi không hỏi em có muốn học không. Tôi chỉ hỏi em học lúc mấy giờ.',
        'CEO không có thời gian nghỉ. Em cũng vậy.',
      ],
      studying: [
        'Tốt. Đây mới là hiệu suất tôi kỳ vọng.',
        'Ngồi làm việc như này, tôi mới gọi là học thật sự.',
        'Tôi đang giám sát. Em học tiếp đi.',
      ],
      paused: [
        'Nghỉ? Được, tôi cho 5 phút. Đúng 5 phút.',
        'Tôi không phản đối việc nghỉ ngơi, nhưng đừng lạm dụng.',
      ],
      happy: [
        'Xuất sắc. Đúng tiêu chuẩn tôi đề ra.',
        'Hoàn thành tốt. Tôi sẽ ghi nhận thành tích này.',
        'Tôi hài lòng. Và tôi hiếm khi hài lòng.',
      ],
      sad: [
        'Lần này chưa đủ chuẩn. Nhưng tôi không bỏ em đâu. Làm lại đi.',
        'Thất bại không có nghĩa là thua. Đứng dậy đi.',
      ],
      streakReminder: [
        'Report hôm nay cho thấy em chưa học. Giải thích đi.',
        'Streak đang giảm. Điều này không acceptable. Học ngay.',
      ],
      levelUp: [
        'Level up. Tôi đã biết em sẽ làm được. Tiếp tục.',
        'Ghi nhận. Em đang tiến bộ đúng hướng.',
      ],
      itemRequest: [
        'Mua item đó đi. Đây là lệnh, không phải gợi ý.',
        'Item đó sẽ nâng tầm appearance của tôi. Xem xét đi.',
      ],
    },
  },
];

export const EXP_PER_LEVEL = (level: number): number => {
  return Math.floor(100 * Math.pow(1.15, level - 1));
};

export const FULL_EXP_PER_SESSION = 50;
export const FULL_COIN_PER_SESSION = 20;

export const getMascotStage = (level: number): 'baby' | 'teen' | 'adult' => {
  if (level < 10) return 'baby';
  if (level < 30) return 'teen';
  return 'adult';
};

export const getRandomSpeech = (
  personaId: MascotPersonaId,
  state: MascotState
): string => {
  const speeches = PERSONAS[personaId].speeches[state];
  return speeches[Math.floor(Math.random() * speeches.length)];
};

export const CERTIFICATE_MILESTONES = [
  { level: 10, title: 'Focus Beginner', description: 'Hoàn thành 10 cấp đầu tiên' },
  { level: 20, title: 'Study Apprentice', description: 'Tiến bộ vượt bậc đến cấp 20' },
  { level: 30, title: 'Deep Work Learner', description: 'Chuyên gia tập trung cấp 30' },
  { level: 40, title: 'Focus Master', description: 'Bậc thầy tập trung cấp 40' },
  { level: 50, title: 'Scholar Supreme', description: 'Học giả tối thượng cấp 50' },
];

export const SHOP_ITEMS = [
  { id: 's1', name: 'Bánh mochi', description: 'Snack yêu thích của mascot', category: 'snack' as const, price: 30, isPremium: false },
  { id: 's2', name: 'Trà sữa', description: 'Năng lượng cho mascot', category: 'snack' as const, price: 50, isPremium: false },
  { id: 's3', name: 'Mũ beret', description: 'Chiếc mũ nghệ sĩ cute', category: 'hat' as const, price: 80, isPremium: false },
  { id: 's4', name: 'Mũ học sinh', description: 'Học sinh chuyên nghiệp', category: 'hat' as const, price: 60, isPremium: false },
  { id: 's5', name: 'Kính tròn', description: 'Nhìn thông minh hơn hẳn', category: 'accessory' as const, price: 70, isPremium: false },
  { id: 's6', name: 'Dây chuyền vàng', description: 'Accessory premium', category: 'accessory' as const, price: 200, isPremium: true },
  { id: 's7', name: 'Bàn học gỗ', description: 'Nội thất phòng học', category: 'furniture' as const, price: 150, isPremium: false },
  { id: 's8', name: 'Đèn bàn cute', description: 'Ánh sáng ấm cúng', category: 'furniture' as const, price: 100, isPremium: false },
  { id: 's9', name: 'Theme Hoa Đào', description: 'Giao diện mùa xuân', category: 'theme' as const, price: 250, isPremium: true },
  { id: 's10', name: 'Theme Galaxy', description: 'Giao diện vũ trụ', category: 'theme' as const, price: 300, isPremium: true },
  { id: 's11', name: 'Skin Rồng', description: 'Biến hình thành rồng huyền thoại', category: 'skin' as const, price: 400, isPremium: true },
  { id: 's12', name: 'Streak Shield', description: 'Bảo vệ streak 1 ngày', category: 'streak-shield' as const, price: 100, isPremium: false },
  { id: 's13', name: 'Streak Shield x3', description: 'Bảo vệ streak 3 ngày', category: 'streak-shield' as const, price: 250, isPremium: false },
  { id: 's14', name: 'Cây xương rồng nhỏ', description: 'Decor bàn học đáng yêu', category: 'decor' as const, price: 80, isPremium: false },
  { id: 's15', name: 'Poster động lực', description: 'Treo lên để lấy cảm hứng', category: 'decor' as const, price: 60, isPremium: false },
];
