(function (global) {
  'use strict';

  const DEFAULT_TOPICS = [
    { id: 'animals', nameVi: 'Động vật', nameEn: 'Animals', icon: '🐾', color: '#FEF3C7' },
    { id: 'school', nameVi: 'Trường học', nameEn: 'School', icon: '🎒', color: '#DBEAFE' },
    { id: 'family', nameVi: 'Gia đình & Bạn bè', nameEn: 'Family & People', icon: '👨‍👩‍👧‍👦', color: '#FCE7F3' },
    { id: 'food', nameVi: 'Đồ ăn & Thức uống', nameEn: 'Food & Drink', icon: '🍎', color: '#FEE2E2' },
    { id: 'colors_numbers', nameVi: 'Màu sắc & Số đếm', nameEn: 'Colors & Numbers', icon: '🎨', color: '#EDE9FE' },
    { id: 'body', nameVi: 'Cơ thể người', nameEn: 'Body Parts', icon: '👀', color: '#FFEDD5' },
    { id: 'nature', nameVi: 'Thiên nhiên & Thời tiết', nameEn: 'Nature & Weather', icon: '☀️', color: '#D1FAE5' },
    { id: 'home', nameVi: 'Ngôi nhà & Đồ chơi', nameEn: 'Home & Toys', icon: '🏠', color: '#E0E7FF' },
    { id: 'clothes', nameVi: 'Quần áo', nameEn: 'Clothes', icon: '👕', color: '#FAE8FF' },
    { id: 'actions', nameVi: 'Hoạt động', nameEn: 'Actions', icon: '🏃', color: '#DCFCE7' },
    { id: 'time', nameVi: 'Thời gian & Ngày', nameEn: 'Time & Days', icon: '📅', color: '#E0F2FE' },
    { id: 'other', nameVi: 'Chủ đề khác', nameEn: 'General', icon: '✨', color: '#F1F5F9' }
  ];

  // Comprehensive Grade 3 bilingual dictionary for auto-suggest & auto-categorization
  // Format: en -> { vi, topic, emoji, colorHex?, ex? }
  const GRADE3_DICT = {
    // Animals
    cat: { vi: 'con mèo', topic: 'animals', emoji: '🐱', ex: 'I have a cute cat.' },
    dog: { vi: 'con chó', topic: 'animals', emoji: '🐶', ex: 'The dog is friendly.' },
    bird: { vi: 'con chim', topic: 'animals', emoji: '🐦', ex: 'The bird can fly.' },
    fish: { vi: 'con cá', topic: 'animals', emoji: '🐟', ex: 'The fish swims in water.' },
    duck: { vi: 'con vịt', topic: 'animals', emoji: '🦆', ex: 'The yellow duck is swimming.' },
    chicken: { vi: 'con gà', topic: 'animals', emoji: '🐔', ex: 'A chicken is on the farm.' },
    cow: { vi: 'con bò', topic: 'animals', emoji: '🐄', ex: 'The cow gives us milk.' },
    pig: { vi: 'con lợn', topic: 'animals', emoji: '🐷', ex: 'The pink pig is fat.' },
    rabbit: { vi: 'con thỏ', topic: 'animals', emoji: '🐰', ex: 'The rabbit likes carrots.' },
    elephant: { vi: 'con voi', topic: 'animals', emoji: '🐘', ex: 'The elephant is very big.' },
    lion: { vi: 'con sư tử', topic: 'animals', emoji: '🦁', ex: 'The lion is strong.' },
    tiger: { vi: 'con hổ', topic: 'animals', emoji: '🐯', ex: 'The tiger can run fast.' },
    monkey: { vi: 'con khỉ', topic: 'animals', emoji: '🐵', ex: 'The monkey likes bananas.' },
    bear: { vi: 'con gấu', topic: 'animals', emoji: '🐻', ex: 'The brown bear is sleeping.' },
    frog: { vi: 'con ếch', topic: 'animals', emoji: '🐸', ex: 'The green frog can jump.' },
    turtle: { vi: 'con rùa', topic: 'animals', emoji: '🐢', ex: 'The turtle walks slowly.' },
    horse: { vi: 'con ngựa', topic: 'animals', emoji: '🐴', ex: 'The horse runs very fast.' },
    sheep: { vi: 'con cừu', topic: 'animals', emoji: '🐑', ex: 'The sheep is white.' },
    butterfly: { vi: 'con bướm', topic: 'animals', emoji: '🦋', ex: 'Look at the pretty butterfly.' },
    bee: { vi: 'con ong', topic: 'animals', emoji: '🐝', ex: 'The bee makes honey.' },
    mouse: { vi: 'con chuột', topic: 'animals', emoji: '🐭', ex: 'The mouse is very small.' },
    giraffe: { vi: 'hươu cao cổ', topic: 'animals', emoji: '🦒', ex: 'The giraffe has a long neck.' },
    panda: { vi: 'gấu trúc', topic: 'animals', emoji: '🐼', ex: 'The panda eats bamboo.' },
    whale: { vi: 'cá voi', topic: 'animals', emoji: '🐳', ex: 'The whale lives in the sea.' },
    shark: { vi: 'cá mập', topic: 'animals', emoji: '🦈', ex: 'The shark swims in the ocean.' },
    dolphin: { vi: 'cá heo', topic: 'animals', emoji: '🐬', ex: 'The dolphin is very smart.' },
    octopus: { vi: 'bạch tuộc', topic: 'animals', emoji: '🐙', ex: 'The octopus has eight arms.' },
    crocodile: { vi: 'cá sấu', topic: 'animals', emoji: '🐊', ex: 'The crocodile has sharp teeth.' },
    zebra: { vi: 'ngựa vằn', topic: 'animals', emoji: '🦓', ex: 'The zebra is black and white.' },
    hippo: { vi: 'hà mã', topic: 'animals', emoji: '🦛', ex: 'The hippo likes water.' },
    koala: { vi: 'gấu túi', topic: 'animals', emoji: '🐨', ex: 'The koala sleeps in a tree.' },
    owl: { vi: 'con cú', topic: 'animals', emoji: '🦉', ex: 'The owl wakes up at night.' },
    fox: { vi: 'con cáo', topic: 'animals', emoji: '🦊', ex: 'The fox is clever.' },
    crab: { vi: 'con cua', topic: 'animals', emoji: '🦀', ex: 'The crab walks on the sand.' },
    snail: { vi: 'ốc sên', topic: 'animals', emoji: '🐌', ex: 'The snail moves slowly.' },
    penguin: { vi: 'chim cánh cụt', topic: 'animals', emoji: '🐧', ex: 'The penguin loves cold weather.' },

    // School
    book: { vi: 'quyển sách', topic: 'school', emoji: '📖', ex: 'Open your book, please.' },
    notebook: { vi: 'quyển vở', topic: 'school', emoji: '📓', ex: 'I write in my notebook.' },
    pen: { vi: 'cái bút mực', topic: 'school', emoji: '🖊️', ex: 'This is my blue pen.' },
    pencil: { vi: 'cái bút chì', topic: 'school', emoji: '✏️', ex: 'I draw with a pencil.' },
    ruler: { vi: 'cái thước kẻ', topic: 'school', emoji: '📏', ex: 'My ruler is long.' },
    eraser: { vi: 'cục tẩy', topic: 'school', emoji: '🧽', ex: 'May I borrow your eraser?' },
    rubber: { vi: 'cục tẩy', topic: 'school', emoji: '🧽', ex: 'I have a small rubber.' },
    bag: { vi: 'cái cặp sách', topic: 'school', emoji: '🎒', ex: 'My school bag is heavy.' },
    'school bag': { vi: 'cặp sách', topic: 'school', emoji: '🎒', ex: 'Put your books in your school bag.' },
    school: { vi: 'trường học', topic: 'school', emoji: '🏫', ex: 'I go to school every day.' },
    classroom: { vi: 'lớp học', topic: 'school', emoji: '🏫', ex: 'Our classroom is clean.' },
    teacher: { vi: 'giáo viên', topic: 'school', emoji: '👩‍🏫', ex: 'My teacher is very kind.' },
    student: { vi: 'học sinh', topic: 'school', emoji: '🧑‍🎓', ex: 'I am a student in grade 3.' },
    desk: { vi: 'cái bàn học', topic: 'school', emoji: '🪑', ex: 'My book is on the desk.' },
    chair: { vi: 'cái ghế', topic: 'school', emoji: '🪑', ex: 'Sit down on your chair.' },
    board: { vi: 'cái bảng', topic: 'school', emoji: '🟩', ex: 'Look at the board.' },
    crayon: { vi: 'bút sáp màu', topic: 'school', emoji: '🖍️', ex: 'I color with crayons.' },
    scissors: { vi: 'cái kéo', topic: 'school', emoji: '✂️', ex: 'Be careful with scissors.' },
    library: { vi: 'thư viện', topic: 'school', emoji: '📚', ex: 'We read books in the library.' },

    // Family & People
    family: { vi: 'gia đình', topic: 'family', emoji: '👨‍👩‍👧‍👦', ex: 'I love my family.' },
    mother: { vi: 'mẹ', topic: 'family', emoji: '👩', ex: 'My mother cooks dinner.' },
    mom: { vi: 'mẹ', topic: 'family', emoji: '👩', ex: 'I love my mom.' },
    father: { vi: 'bố / cha', topic: 'family', emoji: '👨', ex: 'My father is tall.' },
    dad: { vi: 'bố', topic: 'family', emoji: '👨', ex: 'My dad drives a car.' },
    brother: { vi: 'anh / em trai', topic: 'family', emoji: '👦', ex: 'My brother plays football.' },
    sister: { vi: 'chị / em gái', topic: 'family', emoji: '👧', ex: 'My sister likes music.' },
    grandmother: { vi: 'bà', topic: 'family', emoji: '👵', ex: 'My grandmother tells stories.' },
    grandfather: { vi: 'ông', topic: 'family', emoji: '👴', ex: 'My grandfather reads newspapers.' },
    baby: { vi: 'em bé', topic: 'family', emoji: '👶', ex: 'The baby is sleeping.' },
    friend: { vi: 'người bạn', topic: 'family', emoji: '🧑‍🤝‍🧑', ex: 'She is my best friend.' },
    boy: { vi: 'cậu bé', topic: 'family', emoji: '👦', ex: 'The boy is happy.' },
    girl: { vi: 'cô bé', topic: 'family', emoji: '👧', ex: 'The girl is smiling.' },
    doctor: { vi: 'bác sĩ', topic: 'family', emoji: '👩‍⚕️', ex: 'The doctor helps sick people.' },

    // Food & Drink
    apple: { vi: 'quả táo', topic: 'food', emoji: '🍎', ex: 'I eat a red apple.' },
    banana: { vi: 'quả chuối', topic: 'food', emoji: '🍌', ex: 'Bananas are yellow.' },
    orange: { vi: 'quả cam', topic: 'food', emoji: '🍊', ex: 'I like orange juice.' },
    grape: { vi: 'quả nho', topic: 'food', emoji: '🍇', ex: 'Grapes are sweet.' },
    strawberry: { vi: 'quả dâu tây', topic: 'food', emoji: '🍓', ex: 'Strawberries are red and sweet.' },
    watermelon: { vi: 'quả dưa hấu', topic: 'food', emoji: '🍉', ex: 'Watermelon is juicy.' },
    mango: { vi: 'quả xoài', topic: 'food', emoji: '🥭', ex: 'Mango is my favorite fruit.' },
    pineapple: { vi: 'quả dứa', topic: 'food', emoji: '🍍', ex: 'The pineapple is yellow.' },
    bread: { vi: 'bánh mì', topic: 'food', emoji: '🍞', ex: 'I eat bread for breakfast.' },
    rice: { vi: 'cơm / gạo', topic: 'food', emoji: '🍚', ex: 'We eat rice every day.' },
    egg: { vi: 'quả trứng', topic: 'food', emoji: '🥚', ex: 'I like fried eggs.' },
    milk: { vi: 'sữa', topic: 'food', emoji: '🥛', ex: 'Drink milk every morning.' },
    water: { vi: 'nước', topic: 'food', emoji: '💧', ex: 'Please drink more water.' },
    juice: { vi: 'nước ép', topic: 'food', emoji: '🧃', ex: 'I want apple juice.' },
    cake: { vi: 'bánh ngọt', topic: 'food', emoji: '🍰', ex: 'Happy birthday cake!' },
    'ice cream': { vi: 'kem', topic: 'food', emoji: '🍦', ex: 'I love chocolate ice cream.' },
    pizza: { vi: 'bánh pizza', topic: 'food', emoji: '🍕', ex: 'Pizza is delicious.' },
    chicken_food: { vi: 'thịt gà', topic: 'food', emoji: '🍗' },
    carrot: { vi: 'củ cà rốt', topic: 'food', emoji: '🥕', ex: 'Carrots are good for eyes.' },
    tomato: { vi: 'quả cà chua', topic: 'food', emoji: '🍅', ex: 'The tomato is red.' },
    cookie: { vi: 'bánh quy', topic: 'food', emoji: '🍪', ex: 'Have a sweet cookie.' },
    candy: { vi: 'kẹo', topic: 'food', emoji: '🍬', ex: 'Do not eat too much candy.' },

    // Colors & Numbers
    red: { vi: 'màu đỏ', topic: 'colors_numbers', emoji: '🔴', colorHex: '#EF4444', ex: 'The apple is red.' },
    blue: { vi: 'màu xanh dương', topic: 'colors_numbers', emoji: '🔵', colorHex: '#3B82F6', ex: 'The sky is blue.' },
    yellow: { vi: 'màu vàng', topic: 'colors_numbers', emoji: '🟡', colorHex: '#FACC15', ex: 'The sun is yellow.' },
    green: { vi: 'màu xanh lá', topic: 'colors_numbers', emoji: '🟢', colorHex: '#22C55E', ex: 'The leaves are green.' },
    pink: { vi: 'màu hồng', topic: 'colors_numbers', emoji: '🩷', colorHex: '#EC4899', ex: 'She likes pink.' },
    purple: { vi: 'màu tím', topic: 'colors_numbers', emoji: '🟣', colorHex: '#A855F7', ex: 'My bag is purple.' },
    black: { vi: 'màu đen', topic: 'colors_numbers', emoji: '⚫', colorHex: '#1E293B', ex: 'The cat is black.' },
    white: { vi: 'màu trắng', topic: 'colors_numbers', emoji: '⚪', colorHex: '#F8FAFC', ex: 'Snow is white.' },
    brown: { vi: 'màu nâu', topic: 'colors_numbers', emoji: '🟤', colorHex: '#92400E', ex: 'The bear is brown.' },
    one: { vi: 'số một', topic: 'colors_numbers', emoji: '1️⃣', ex: 'I have one nose.' },
    two: { vi: 'số hai', topic: 'colors_numbers', emoji: '2️⃣', ex: 'I have two eyes.' },
    three: { vi: 'số ba', topic: 'colors_numbers', emoji: '3️⃣', ex: 'There are three cats.' },
    four: { vi: 'số bốn', topic: 'colors_numbers', emoji: '4️⃣', ex: 'A dog has four legs.' },
    five: { vi: 'số năm', topic: 'colors_numbers', emoji: '5️⃣', ex: 'I have five fingers.' },
    ten: { vi: 'số mười', topic: 'colors_numbers', emoji: '🔟', ex: 'Count from one to ten.' },

    // Body Parts
    eye: { vi: 'con mắt', topic: 'body', emoji: '👁️', ex: 'I see with my eyes.' },
    ear: { vi: 'cái tai', topic: 'body', emoji: '👂', ex: 'I listen with my ears.' },
    nose: { vi: 'cái mũi', topic: 'body', emoji: '👃', ex: 'Touch your nose.' },
    mouth: { vi: 'cái miệng', topic: 'body', emoji: '👄', ex: 'Open your mouth.' },
    hand: { vi: 'bàn tay', topic: 'body', emoji: '✋', ex: 'Wash your hands.' },
    foot: { vi: 'bàn chân', topic: 'body', emoji: '🦶', ex: 'My foot is small.' },
    head: { vi: 'cái đầu', topic: 'body', emoji: '🗣️', ex: 'Put a hat on your head.' },
    hair: { vi: 'mái tóc', topic: 'body', emoji: '💇', ex: 'She has long hair.' },
    tooth: { vi: 'cái răng', topic: 'body', emoji: '🦷', ex: 'Brush your teeth every day.' },
    face: { vi: 'khuôn mặt', topic: 'body', emoji: '😊', ex: 'Wash your face in the morning.' },

    // Nature & Weather
    sun: { vi: 'mặt trời', topic: 'nature', emoji: '☀️', ex: 'The sun is shining.' },
    sunny: { vi: 'trời nắng', topic: 'nature', emoji: '🌞', ex: 'Today is sunny.' },
    rain: { vi: 'cơn mưa', topic: 'nature', emoji: '🌧️', ex: 'I like watching the rain.' },
    rainy: { vi: 'trời mưa', topic: 'nature', emoji: '☔', ex: 'It is rainy today.' },
    cloud: { vi: 'đám mây', topic: 'nature', emoji: '☁️', ex: 'White clouds are in the sky.' },
    windy: { vi: 'trời có gió', topic: 'nature', emoji: '💨', ex: 'It is windy outside.' },
    snow: { vi: 'tuyết', topic: 'nature', emoji: '❄️', ex: 'Snow is cold and white.' },
    rainbow: { vi: 'cầu vồng', topic: 'nature', emoji: '🌈', ex: 'Look at the rainbow!' },
    tree: { vi: 'cái cây', topic: 'nature', emoji: '🌳', ex: 'The tree is tall and green.' },
    flower: { vi: 'bông hoa', topic: 'nature', emoji: '🌸', ex: 'The flower smells nice.' },
    moon: { vi: 'mặt trăng', topic: 'nature', emoji: '🌙', ex: 'The moon shines at night.' },
    star: { vi: 'ngôi sao', topic: 'nature', emoji: '⭐', ex: 'Stars twinkle in the sky.' },
    mountain: { vi: 'ngọn núi', topic: 'nature', emoji: '⛰️', ex: 'The mountain is very high.' },
    river: { vi: 'dòng sông', topic: 'nature', emoji: '🏞️', ex: 'The river is long.' },

    // Home & Toys
    house: { vi: 'ngôi nhà', topic: 'home', emoji: '🏠', ex: 'My house has a garden.' },
    room: { vi: 'căn phòng', topic: 'home', emoji: '🚪', ex: 'My room is tidy.' },
    bedroom: { vi: 'phòng ngủ', topic: 'home', emoji: '🛏️', ex: 'I sleep in my bedroom.' },
    kitchen: { vi: 'nhà bếp', topic: 'home', emoji: '🍳', ex: 'Mom is cooking in the kitchen.' },
    bed: { vi: 'cái giường', topic: 'home', emoji: '🛏️', ex: 'Go to bed early.' },
    table: { vi: 'cái bàn', topic: 'home', emoji: '🪵', ex: 'The lamp is on the table.' },
    door: { vi: 'cánh cửa', topic: 'home', emoji: '🚪', ex: 'Close the door, please.' },
    window: { vi: 'cửa sổ', topic: 'home', emoji: '🪟', ex: 'Open the window.' },
    clock: { vi: 'đồng hồ', topic: 'home', emoji: '⏰', ex: 'Look at the clock.' },
    ball: { vi: 'quả bóng', topic: 'home', emoji: '⚽', ex: 'Let us kick the ball.' },
    doll: { vi: 'búp bê', topic: 'home', emoji: '🪆', ex: 'She plays with her doll.' },
    robot: { vi: 'người máy', topic: 'home', emoji: '🤖', ex: 'My toy robot can walk.' },
    kite: { vi: 'con diều', topic: 'home', emoji: '🪁', ex: 'Fly a kite in the park.' },
    car: { vi: 'ô tô', topic: 'home', emoji: '🚗', ex: 'The red car is fast.' },
    bicycle: { vi: 'xe đạp', topic: 'home', emoji: '🚲', ex: 'I ride my bicycle to school.' },
    bike: { vi: 'xe đạp', topic: 'home', emoji: '🚲', ex: 'I have a new bike.' },
    train: { vi: 'tàu hỏa', topic: 'home', emoji: '🚆', ex: 'The train is very long.' },

    // Clothes
    shirt: { vi: 'áo sơ mi', topic: 'clothes', emoji: '👔', ex: 'He wears a white shirt.' },
    't-shirt': { vi: 'áo phông', topic: 'clothes', emoji: '👕', ex: 'I like this blue T-shirt.' },
    dress: { vi: 'cái váy liền', topic: 'clothes', emoji: '👗', ex: 'Her dress is pink.' },
    skirt: { vi: 'chân váy', topic: 'clothes', emoji: '👗', ex: 'She wears a yellow skirt.' },
    hat: { vi: 'cái mũ', topic: 'clothes', emoji: '👒', ex: 'Wear a hat in the sun.' },
    cap: { vi: 'mũ lưỡi trai', topic: 'clothes', emoji: '🧢', ex: 'My cap is red.' },
    shoes: { vi: 'đôi giày', topic: 'clothes', emoji: '👟', ex: 'Put on your shoes.' },
    socks: { vi: 'đôi tất', topic: 'clothes', emoji: '🧦', ex: 'My socks are warm.' },
    coat: { vi: 'áo khoác', topic: 'clothes', emoji: '🧥', ex: 'Wear a coat when it is cold.' },
    glasses: { vi: 'cái kính', topic: 'clothes', emoji: '👓', ex: 'Grandpa wears glasses.' },

    // Actions
    run: { vi: 'chạy', topic: 'actions', emoji: '🏃', ex: 'I can run very fast.' },
    jump: { vi: 'nhảy', topic: 'actions', emoji: '🤸', ex: 'Frogs can jump high.' },
    swim: { vi: 'bơi lội', topic: 'actions', emoji: '🏊', ex: 'I swim in the summer.' },
    sing: { vi: 'hát', topic: 'actions', emoji: '🎤', ex: 'We sing an English song.' },
    dance: { vi: 'nhảy múa', topic: 'actions', emoji: '💃', ex: 'Let us dance together.' },
    read: { vi: 'đọc sách', topic: 'actions', emoji: '📖', ex: 'I read books before bed.' },
    write: { vi: 'viết', topic: 'actions', emoji: '✍️', ex: 'Write your name here.' },
    draw: { vi: 'vẽ', topic: 'actions', emoji: '🎨', ex: 'I like to draw animals.' },
    sleep: { vi: 'ngủ', topic: 'actions', emoji: '😴', ex: 'The cat sleeps on the sofa.' },
    eat: { vi: 'ăn', topic: 'actions', emoji: '🍽️', ex: 'Let us eat lunch.' },
    play: { vi: 'chơi', topic: 'actions', emoji: '🎮', ex: 'Children play in the yard.' },
    open: { vi: 'mở ra', topic: 'actions', emoji: '📖', ex: 'Open your book.' },
    close: { vi: 'đóng lại', topic: 'actions', emoji: '🚪', ex: 'Close the door, please.' },
    count: { vi: 'đếm', topic: 'colors_numbers', emoji: '🔢', ex: 'Count from one to ten.' },

    // Common Grade 3 Adjectives & Math words
    big: { vi: 'to lớn', topic: 'other', emoji: '🐘', ex: 'The elephant is big.' },
    small: { vi: 'nhỏ bé', topic: 'other', emoji: '🐭', ex: 'The mouse is small.' },
    tall: { vi: 'cao', topic: 'other', emoji: '🦒', ex: 'My father is tall.' },
    short: { vi: 'thấp / ngắn', topic: 'other', emoji: '📏', ex: 'This pencil is short.' },
    long: { vi: 'dài', topic: 'other', emoji: '📏', ex: 'She has long hair.' },
    old: { vi: 'già / cũ', topic: 'other', emoji: '👴', ex: 'My book is old.' },
    new: { vi: 'mới', topic: 'other', emoji: '✨', ex: 'I have a new pen.' },
    young: { vi: 'trẻ', topic: 'family', emoji: '👶', ex: 'My sister is young.' },
    happy: { vi: 'vui vẻ', topic: 'other', emoji: '😊', ex: 'I am very happy today.' },
    sad: { vi: 'buồn', topic: 'other', emoji: '😢', ex: 'Do not be sad.' },
    fast: { vi: 'nhanh', topic: 'other', emoji: '⚡', ex: 'The rabbit runs fast.' },
    slow: { vi: 'chậm', topic: 'other', emoji: '🐢', ex: 'The turtle is slow.' },
    hot: { vi: 'nóng', topic: 'nature', emoji: '🔥', ex: 'Summer is hot.' },
    cold: { vi: 'lạnh', topic: 'nature', emoji: '❄️', ex: 'Ice cream is cold.' },
    sum: { vi: 'tổng / phép cộng', topic: 'colors_numbers', emoji: '➕', ex: 'Find the sum of two numbers.' },
    total: { vi: 'tổng cộng', topic: 'colors_numbers', emoji: '🔢', ex: 'What is the total?' },
    plus: { vi: 'cộng', topic: 'colors_numbers', emoji: '➕', ex: 'Two plus three is five.' },
    minus: { vi: 'trừ', topic: 'colors_numbers', emoji: '➖', ex: 'Five minus two is three.' },
    today: { vi: 'hôm nay', topic: 'time', emoji: '📅', ex: 'Today is Monday.' },
    tomorrow: { vi: 'ngày mai', topic: 'time', emoji: '📅', ex: 'See you tomorrow!' },
    yesterday: { vi: 'hôm qua', topic: 'time', emoji: '📅', ex: 'Yesterday was sunny.' },
    morning: { vi: 'buổi sáng', topic: 'time', emoji: '🌅', ex: 'Good morning!' },
    afternoon: { vi: 'buổi chiều', topic: 'time', emoji: '🌇', ex: 'Good afternoon!' },
    evening: { vi: 'buổi tối', topic: 'time', emoji: '🌆', ex: 'Good evening!' },
    night: { vi: 'ban đêm', topic: 'time', emoji: '🌙', ex: 'Good night!' },
    umbrella: { vi: 'cái ô / cây dù', topic: 'clothes', emoji: '☂️', ex: 'Take an umbrella when it rains.' },
    calculator: { vi: 'máy tính bỏ túi', topic: 'school', emoji: '🧮', ex: 'Use a calculator to check.' }
  };

  // Starter deck (~36 essential Grade 3 words across topics)
  const STARTER_WORDS = [
    'cat', 'dog', 'elephant', 'rabbit', 'butterfly',
    'book', 'pencil', 'ruler', 'school bag', 'teacher',
    'mother', 'father', 'sister', 'friend',
    'apple', 'banana', 'strawberry', 'milk', 'ice cream',
    'red', 'blue', 'yellow', 'green',
    'eye', 'hand', 'mouth',
    'sun', 'rainbow', 'flower', 'rainy',
    'house', 'bicycle', 'ball',
    't-shirt', 'shoes',
    'run', 'swim', 'draw'
  ];

  // Curated Sticker Library for manual picking
  const STICKER_CATALOG = [
    { e: '🐱', k: 'cat mèo' }, { e: '🐶', k: 'dog chó' }, { e: '🐰', k: 'rabbit thỏ' },
    { e: '🐘', k: 'elephant voi' }, { e: '🦁', k: 'lion sư tử' }, { e: '🐯', k: 'tiger hổ' },
    { e: '🐵', k: 'monkey khỉ' }, { e: '🐻', k: 'bear gấu' }, { e: '🐼', k: 'panda gấu trúc' },
    { e: '🐸', k: 'frog ếch' }, { e: '🐢', k: 'turtle rùa' }, { e: '🐦', k: 'bird chim' },
    { e: '🦆', k: 'duck vịt' }, { e: '🐟', k: 'fish cá' }, { e: '🦋', k: 'butterfly bướm' },
    { e: '🐝', k: 'bee ong' }, { e: '🐄', k: 'cow bò' }, { e: '🐷', k: 'pig lợn' },
    { e: '🐴', k: 'horse ngựa' }, { e: '🦒', k: 'giraffe hươu' }, { e: '🐧', k: 'penguin cánh cụt' },
    { e: '🦈', k: 'shark cá mập' }, { e: '🐬', k: 'dolphin cá heo' }, { e: '🐙', k: 'octopus bạch tuộc' },
    { e: '🦊', k: 'fox cáo' }, { e: '🦉', k: 'owl cú' }, { e: '🦀', k: 'crab cua' },
    { e: '🍎', k: 'apple táo' }, { e: '🍌', k: 'banana chuối' }, { e: '🍊', k: 'orange cam' },
    { e: '🍇', k: 'grape nho' }, { e: '🍓', k: 'strawberry dâu' }, { e: '🍉', k: 'watermelon dưa hấu' },
    { e: '🥭', k: 'mango xoài' }, { e: '🍍', k: 'pineapple dứa' }, { e: '🥕', k: 'carrot cà rốt' },
    { e: '🍞', k: 'bread bánh mì' }, { e: '🍚', k: 'rice cơm' }, { e: '🥚', k: 'egg trứng' },
    { e: '🥛', k: 'milk sữa' }, { e: '🧃', k: 'juice nước ép' }, { e: '🍰', k: 'cake bánh' },
    { e: '🍦', k: 'ice cream kem' }, { e: '🍕', k: 'pizza' }, { e: '🍪', k: 'cookie bánh quy' },
    { e: '📖', k: 'book sách' }, { e: '📓', k: 'notebook vở' }, { e: '✏️', k: 'pencil bút chì' },
    { e: '🖊️', k: 'pen bút' }, { e: '📏', k: 'ruler thước' }, { e: '🎒', k: 'bag cặp sách' },
    { e: '🏫', k: 'school trường' }, { e: '👩‍🏫', k: 'teacher giáo viên' }, { e: '✂️', k: 'scissors kéo' },
    { e: '🖍️', k: 'crayon bút màu' }, { e: '📚', k: 'library thư viện' },
    { e: '👨‍👩‍👧‍👦', k: 'family gia đình' }, { e: '👩', k: 'mother mom mẹ' }, { e: '👨', k: 'father dad bố' },
    { e: '👧', k: 'girl sister em gái' }, { e: '👦', k: 'boy brother em trai' }, { e: '👶', k: 'baby em bé' },
    { e: '👵', k: 'grandmother bà' }, { e: '👴', k: 'grandfather ông' }, { e: '👩‍⚕️', k: 'doctor bác sĩ' },
    { e: '👁️', k: 'eye mắt' }, { e: '👂', k: 'ear tai' }, { e: '👃', k: 'nose mũi' },
    { e: '👄', k: 'mouth miệng' }, { e: '✋', k: 'hand tay' }, { e: '🦶', k: 'foot chân' },
    { e: '🦷', k: 'tooth răng' },
    { e: '☀️', k: 'sun sunny nắng mặt trời' }, { e: '🌧️', k: 'rain rainy mưa' }, { e: '☁️', k: 'cloud mây' },
    { e: '🌈', k: 'rainbow cầu vồng' }, { e: '❄️', k: 'snow tuyết' }, { e: '🌳', k: 'tree cây' },
    { e: '🌸', k: 'flower hoa' }, { e: '🌙', k: 'moon trăng' }, { e: '⭐', k: 'star sao' },
    { e: '🏠', k: 'house nhà' }, { e: '🛏️', k: 'bed bedroom giường' }, { e: '🚪', k: 'door cửa' },
    { e: '⏰', k: 'clock đồng hồ' }, { e: '⚽', k: 'ball bóng' }, { e: '🤖', k: 'robot' },
    { e: '🪁', k: 'kite diều' }, { e: '🚗', k: 'car ô tô' }, { e: '🚲', k: 'bicycle bike xe đạp' },
    { e: '🚆', k: 'train tàu' }, { e: '✈️', k: 'plane máy bay' },
    { e: '👕', k: 'shirt t-shirt áo' }, { e: '👗', k: 'dress skirt váy' }, { e: '🧢', k: 'cap hat mũ' },
    { e: '👟', k: 'shoes giày' }, { e: '🧦', k: 'socks tất' }, { e: '👓', k: 'glasses kính' },
    { e: '🏃', k: 'run chạy' }, { e: '🏊', k: 'swim bơi' }, { e: '🎤', k: 'sing hát' },
    { e: '💃', k: 'dance múa' }, { e: '🎨', k: 'draw paint vẽ màu' }, { e: '😴', k: 'sleep ngủ' },
    { e: '🔴', k: 'red đỏ' }, { e: '🔵', k: 'blue xanh' }, { e: '🟡', k: 'yellow vàng' },
    { e: '🟢', k: 'green xanh lá' }, { e: '🟣', k: 'purple tím' }, { e: '✨', k: 'star sparkle khác' }
  ];

  const TOPIC_KEYWORDS = [
    {
      topic: 'animals',
      vi: ['con ', 'cá ', 'chim ', 'thú', 'gà', 'vịt', 'chó', 'mèo', 'hổ', 'sư tử', 'voi', 'khỉ', 'gấu', 'rùa', 'ếch', 'bướm', 'ong', 'ngựa', 'cừu', 'cáo', 'sói', 'hươu'],
      en: ['animal', 'bird', 'fish', 'fox', 'wolf', 'deer', 'duck', 'goat', 'snake', 'spider', 'ant', 'zebra', 'hippo', 'shark', 'dolphin', 'owl', 'eagle', 'owl', 'squirrel', 'hamster'],
      fallbackEmoji: '🐾'
    },
    {
      topic: 'food',
      vi: ['quả', 'trái', 'bánh', 'cơm', 'thịt', 'sữa', 'nước', 'trà', 'cà phê', 'kem', 'kẹo', 'trứng', 'rau', 'củ', 'mì', 'phở', 'cháo', 'canh', 'súp', 'chuối', 'táo', 'xoài', 'nho', 'dứa', 'dâu', 'dưa', 'cà rốt', 'cà chua', 'khoai', 'phô mai', 'xúc xích', 'pizza'],
      en: ['fruit', 'food', 'drink', 'soup', 'noodle', 'meat', 'pork', 'beef', 'cheese', 'butter', 'sugar', 'salt', 'tea', 'coffee', 'lemon', 'peach', 'pear', 'melon', 'corn', 'potato', 'onion', 'burger', 'sandwich'],
      fallbackEmoji: '🍽️'
    },
    {
      topic: 'school',
      vi: ['sách', 'vở', 'bút', 'thước', 'tẩy', 'cặp', 'trường', 'lớp', 'học', 'giáo viên', 'cô giáo', 'thầy', 'bảng', 'kéo', 'giấy', 'môn '],
      en: ['school', 'class', 'study', 'lesson', 'homework', 'exam', 'test', 'paper', 'glue', 'map', 'globe', 'marker', 'backpack', 'chalk', 'math', 'english', 'music', 'art'],
      fallbackEmoji: '🎒'
    },
    {
      topic: 'family',
      vi: ['mẹ', 'bố', 'ba', 'cha', 'anh', 'chị', 'em', 'ông', 'bà', 'cô', 'chú', 'bác', 'gia đình', 'bạn', 'nghề', 'bác sĩ', 'cảnh sát'],
      en: ['family', 'parent', 'uncle', 'aunt', 'cousin', 'kid', 'child', 'children', 'man', 'woman', 'person', 'people', 'nurse', 'pilot', 'farmer', 'cook', 'driver'],
      fallbackEmoji: '👨‍👩‍👧‍👦'
    },
    {
      topic: 'colors_numbers',
      vi: ['màu ', 'số ', 'đỏ', 'xanh', 'vàng', 'tím', 'hồng', 'cam', 'đen', 'trắng', 'nâu', 'xám'],
      en: ['color', 'colour', 'grey', 'gray', 'gold', 'silver', 'six', 'seven', 'eight', 'nine', 'eleven', 'twelve', 'twenty', 'hundred', 'number', 'circle', 'square', 'triangle', 'star'],
      fallbackEmoji: '🎨'
    },
    {
      topic: 'body',
      vi: ['mắt', 'mũi', 'miệng', 'tai', 'tay', 'chân', 'đầu', 'tóc', 'răng', 'mặt', 'cổ', 'vai', 'lưng', 'bụng', 'ngón'],
      en: ['body', 'arm', 'leg', 'finger', 'toe', 'shoulder', 'knee', 'neck', 'back', 'stomach', 'heart', 'lip', 'cheek', 'chin'],
      fallbackEmoji: '👀'
    },
    {
      topic: 'nature',
      vi: ['trời', 'nắng', 'mưa', 'gió', 'mây', 'tuyết', 'cây', 'hoa', 'lá', 'núi', 'sông', 'biển', 'hồ', 'rừng', 'đất', 'trăng', 'sao', 'mùa'],
      en: ['weather', 'sky', 'sea', 'ocean', 'beach', 'forest', 'grass', 'leaf', 'leaves', 'storm', 'thunder', 'spring', 'summer', 'autumn', 'fall', 'winter', 'hot', 'cold', 'warm', 'cool'],
      fallbackEmoji: '🌿'
    },
    {
      topic: 'clothes',
      vi: ['áo', 'quần', 'váy', 'mũ', 'nón', 'giày', 'dép', 'tất', 'vớ', 'kính', 'khăn'],
      en: ['clothes', 'pants', 'trousers', 'jeans', 'shorts', 'jacket', 'sweater', 'hoodie', 'boots', 'sandals', 'scarf', 'gloves', 'belt'],
      fallbackEmoji: '👕'
    },
    {
      topic: 'home',
      vi: ['nhà', 'phòng', 'bàn', 'ghế', 'giường', 'tủ', 'cửa', 'đèn', 'tivi', 'đồng hồ', 'xe ', 'đồ chơi', 'bóng', 'diều', 'búp bê'],
      en: ['home', 'house', 'sofa', 'lamp', 'tv', 'television', 'fridge', 'mirror', 'pillow', 'blanket', 'toy', 'teddy', 'puzzle', 'bus', 'truck', 'boat', 'ship', 'plane'],
      fallbackEmoji: '🏠'
    },
    {
      topic: 'actions',
      vi: ['chạy', 'nhảy', 'đi', 'đứng', 'ngồi', 'ngủ', 'ăn', 'uống', 'đọc', 'viết', 'vẽ', 'hát', 'múa', 'chơi', 'bơi', 'cười', 'khóc', 'nghe', 'nhìn'],
      en: ['walk', 'talk', 'speak', 'listen', 'look', 'watch', 'see', 'smile', 'laugh', 'cry', 'fly', 'climb', 'kick', 'throw', 'catch', 'open', 'close', 'cook', 'wash', 'clean'],
      fallbackEmoji: '🏃'
    },
    {
      topic: 'time',
      vi: ['ngày', 'hôm nay', 'ngày mai', 'hôm qua', 'tuần', 'tháng', 'năm', 'buổi sáng', 'buổi trưa', 'buổi chiều', 'buổi tối', 'ban đêm', 'thứ hai', 'thứ ba', 'thứ tư', 'thứ năm', 'thứ sáu', 'thứ bảy', 'chủ nhật', 'giờ', 'phút'],
      en: ['time', 'today', 'tomorrow', 'yesterday', 'morning', 'afternoon', 'evening', 'night', 'week', 'month', 'year', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'hour', 'minute'],
      fallbackEmoji: '📅'
    }
  ];

  function normalizeText(str) {
    return (str || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function containsPhrase(text, phrase) {
    if (!text || !phrase) return false;
    const p = phrase.trim();
    if (!p) return false;
    const padded = ' ' + text.replace(/[.,!?;:/()"'-]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
    return padded.includes(' ' + p + ' ');
  }

  function autoClassifyWord(enInput, viInput) {
    const en = normalizeText(enInput);
    const vi = normalizeText(viInput);

    // 1. Exact built-in Grade 3 dictionary match
    if (en && GRADE3_DICT[en]) {
      const entry = GRADE3_DICT[en];
      return {
        matched: true,
        topic: entry.topic,
        suggestedVi: entry.vi,
        emoji: entry.emoji,
        colorHex: entry.colorHex || null,
        example: entry.ex || ''
      };
    }

    // 2. Whole-word match in sticker catalog for better icon pick
    const enTokens = en ? en.split(/[\s-]+/).filter(Boolean) : [];
    let matchedSticker = null;
    if (en || vi) {
      for (const item of STICKER_CATALOG) {
        const tokens = item.k.split(' ');
        if ((en && (tokens.includes(en) || enTokens.some((t) => tokens.includes(t)))) || (vi && tokens.includes(vi))) {
          matchedSticker = item.e;
          break;
        }
      }
    }

    // 3. Rule-based topic classification across EN & VI (word/phrase boundaries)
    for (const rule of TOPIC_KEYWORDS) {
      const hitEn = en && rule.en.some((kw) => en === kw || enTokens.includes(kw));
      const hitVi = vi && rule.vi.some((kw) => containsPhrase(vi, kw));
      if (hitEn || hitVi) {
        return {
          matched: false,
          topic: rule.topic,
          suggestedVi: '',
          emoji: matchedSticker || rule.fallbackEmoji,
          colorHex: null,
          example: ''
        };
      }
    }

    return {
      matched: false,
      topic: 'other',
      suggestedVi: '',
      emoji: matchedSticker || '✨',
      colorHex: null,
      example: ''
    };
  }

  function buildStarterCards() {
    const now = Date.now();
    return STARTER_WORDS.map((en, idx) => {
      const d = GRADE3_DICT[en];
      return {
        id: 'starter_' + en.replace(/\s+/g, '_') + '_' + idx,
        en,
        vi: d.vi,
        topicId: d.topic,
        imageType: d.colorHex ? 'color' : 'emoji',
        imageValue: d.colorHex || d.emoji,
        example: d.ex || '',
        box: 1,
        nextReviewAt: now,
        correctCount: 0,
        wrongCount: 0,
        createdAt: now
      };
    });
  }

  function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[m][n];
  }

  function findSpellingSuggestions(input, limit = 3) {
    const w = normalizeText(input);
    if (!w || w.length < 3 || GRADE3_DICT[w]) return [];
    const maxDist = w.length <= 4 ? 1 : w.length >= 8 ? 3 : 2;
    const candidates = [];
    for (const key of Object.keys(GRADE3_DICT)) {
      if (Math.abs(key.length - w.length) > maxDist) continue;
      const dist = levenshtein(w, key);
      if (dist > 0 && dist <= maxDist) {
        candidates.push({ word: key, vi: GRADE3_DICT[key].vi, dist });
      }
    }
    candidates.sort((a, b) => a.dist - b.dist || a.word.localeCompare(b.word));
    return candidates.slice(0, limit);
  }

  global.KidWordsDict = {
    DEFAULT_TOPICS,
    GRADE3_DICT,
    STICKER_CATALOG,
    autoClassifyWord,
    findSpellingSuggestions,
    buildStarterCards,
    normalizeText
  };
})(window);
