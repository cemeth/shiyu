// 英语例句数据(2/2):主题场景(VOCAB_SCENES)+ 高频词汇(VOCAB_FREQ)+ 易错口语(VOCAB_MISTAKES)
// 键 = 单词(与词表 ru 字段一致);值 = [[英语句, 中文翻译], ...]
window.EXAMPLES_EN = Object.assign(window.EXAMPLES_EN || {}, {
// ========== 场景·就医看病 ==========
'patient': [
['The doctor is examining a patient.', '医生正在给病人做检查。'],
['The patient feels much better today.', '病人今天感觉好多了。'],
],
'medicine': [
['Take this medicine after meals.', '这种药饭后服用。'],
['The medicine works very well.', '这种药效果很好。'],
],
'fever': [
['The child has a high fever.', '孩子发高烧。'],
['My fever went down this morning.', '今天早上我退烧了。'],
],
'clinic': [
['There is a clinic near my home.', '我家附近有家诊所。'],
['The clinic opens at eight.', '诊所八点开门。'],
],
// ========== 场景·银行金融 ==========
'deposit': [
['I made a deposit of 500 dollars.', '我存了五百美元。'],
['The deposit earns interest.', '存款有利息。'],
],
'withdraw': [
['I need to withdraw some money.', '我需要取些钱。'],
['He withdrew cash from the ATM.', '他从取款机取了现金。'],
],
'transfer': [
['I transferred money to her account.', '我转了钱到她账户。'],
['The transfer takes one day.', '转账需要一天。'],
],
'interest': [
['The bank pays 3% interest.', '银行支付3%的利息。'],
['He showed great interest in music.', '他对音乐表现出浓厚兴趣。'],
],
// ========== 场景·交通出行 ==========
'traffic': [
['The traffic is heavy at rush hour.', '高峰时段交通拥堵。'],
['Traffic lights control the flow.', '交通信号灯控制车流。'],
],
'traffic jam': [
['We were stuck in a traffic jam.', '我们被堵在了路上。'],
['The traffic jam lasted an hour.', '堵车持续了一个小时。'],
],
'fare': [
['The bus fare is two yuan.', '公交车费是两元。'],
['Taxi fares went up again.', '出租车费又涨了。'],
],
'platform': [
['The train leaves from platform 3.', '火车从三号站台出发。'],
['Wait for me on the platform.', '在站台上等我。'],
],
// ========== 场景·购物 ==========
'discount': [
['There is a 20% discount today.', '今天打八折。'],
['Can you give me a discount?', '能给我打个折吗?'],
],
'refund': [
['I got a full refund.', '我拿到了全额退款。'],
['The store refused to give a refund.', '商店拒绝退款。'],
],
'receipt': [
['Please keep your receipt.', '请保留好收据。'],
['The receipt shows the total price.', '收据上写着总价。'],
],
'try on': [
['Can I try on this jacket?', '我可以试穿这件夹克吗?'],
['She tried on three dresses.', '她试穿了三条裙子。'],
],
// ========== 场景·餐厅 ==========
'order': [
['Are you ready to order?', '您准备好点餐了吗?'],
['I ordered a pizza and a salad.', '我点了一份披萨和一份沙拉。'],
],
'waiter': [
['The waiter brought us the menu.', '服务员给我们拿来了菜单。'],
['We asked the waiter for the bill.', '我们让服务员结账。'],
],
'menu': [
['Can I see the menu, please?', '请给我看一下菜单。'],
['What is on the menu today?', '今天菜单上有什么?'],
],
'tip': [
['We left a tip for the waiter.', '我们给服务员留了小费。'],
['In America, a 15% tip is common.', '在美国,一般给15%的小费。'],
],
// ========== 场景·酒店住宿 ==========
'check-in': [
['Check-in starts at 2 p.m.', '下午两点开始办理入住。'],
['We checked in at the front desk.', '我们在前台办理了入住。'],
],
'check-out': [
['Check-out is before 12 noon.', '中午十二点前退房。'],
['We checked out early in the morning.', '我们一大早就退了房。'],
],
'reservation': [
['I have a reservation for two nights.', '我预订了两晚。'],
['The reservation is under my name.', '预订是用我的名字登记的。'],
],
'luggage': [
['My luggage is too heavy.', '我的行李太重了。'],
['We left our luggage at the hotel.', '我们把行李寄存在了酒店。'],
],
// ========== 场景·机场 ==========
'flight': [
['My flight leaves at 9 a.m.', '我的航班上午九点起飞。'],
['The flight was delayed for two hours.', '航班延误了两小时。'],
],
'departure': [
['The departure time is 6:30.', '起飞时间是六点半。'],
['We waited in the departure hall.', '我们在出发大厅等候。'],
],
'arrival': [
['The arrival hall is downstairs.', '到达大厅在楼下。'],
['Our arrival was on time.', '我们准时到达了。'],
],
'passport': [
['Show me your passport, please.', '请出示您的护照。'],
['My passport expires next year.', '我的护照明年到期。'],
],
// ========== 场景·问路 ==========
'straight': [
['Go straight and turn left.', '直走然后左转。'],
['The road goes straight to the park.', '这条路直通公园。'],
],
'left': [
['Turn left at the corner.', '在拐角处左转。'],
['The bank is on your left.', '银行在你的左边。'],
],
'right': [
['Turn right after the bridge.', '过桥后右转。'],
['The school is on the right side.', '学校在右边。'],
],
'corner': [
['The shop is at the corner.', '商店在拐角处。'],
['Turn right at the next corner.', '在下一个拐角右转。'],
],
// ========== 场景·工作职场 ==========
'meeting': [
['We have a meeting at three.', '我们三点开会。'],
['The meeting lasted two hours.', '会议持续了两个小时。'],
],
'salary': [
['She earns a good salary.', '她的薪水不错。'],
['The salary is paid monthly.', '工资按月发放。'],
],
'colleague': [
['My colleagues are very friendly.', '我的同事们非常友好。'],
['He is my colleague at work.', '他是我工作上的同事。'],
],
'boss': [
['My boss is strict but fair.', '我的老板严厉但公正。'],
['She asked the boss for a raise.', '她向老板要求加薪。'],
],
// ========== 场景·学习考试 ==========
'exam': [
['I have an English exam tomorrow.', '我明天有英语考试。'],
['She passed the exam with ease.', '她轻松通过了考试。'],
],
'homework': [
['I finished my homework before dinner.', '我晚饭前做完了作业。'],
['The teacher checked our homework.', '老师检查了我们的作业。'],
],
'lecture': [
['The lecture starts at nine.', '讲座九点开始。'],
['He gave a lecture on history.', '他做了一场历史讲座。'],
],
'grade': [
['She got a good grade in math.', '她数学成绩很好。'],
['My grades improved this term.', '这学期我的成绩提高了。'],
],
// ========== 场景·租房住房 ==========
'rent': [
['The rent is 2000 yuan a month.', '租金是每月两千元。'],
['We pay the rent on the first day.', '我们每月一号交房租。'],
],
'landlord': [
['The landlord fixed the tap.', '房东修好了水龙头。'],
['Our landlord is very kind.', '我们的房东人很好。'],
],
'contract': [
['We signed a one-year contract.', '我们签了一年合同。'],
['Read the contract carefully.', '仔细阅读合同。'],
],
'move': [
['We are moving to a new house.', '我们要搬进新房子。'],
['She moved to Beijing last month.', '她上个月搬到了北京。'],
],
// ========== 场景·运动健身 ==========
'gym': [
['I go to the gym twice a week.', '我每周去两次健身房。'],
['The gym is near my office.', '健身房在我办公室附近。'],
],
'exercise': [
['Morning exercise keeps you healthy.', '晨练使你保持健康。'],
['He does exercise every day.', '他每天锻炼。'],
],
'swimming': [
['Swimming is good for your back.', '游泳对背部有好处。'],
['We went swimming in the lake.', '我们去湖里游泳了。'],
],
'match': [
['The match ended in a draw.', '比赛以平局结束。'],
['We watched a football match.', '我们看了一场足球比赛。'],
],
// ========== 场景·网络手机 ==========
'password': [
['I forgot my password.', '我忘了密码。'],
['Change your password regularly.', '定期更换密码。'],
],
'account': [
['I created a new account.', '我创建了一个新账户。'],
['My account was locked.', '我的账户被锁了。'],
],
'notification': [
['I got a notification on my phone.', '我的手机收到了一条通知。'],
['Turn off notifications at night.', '晚上关掉通知。'],
],
'app': [
['This app helps you learn English.', '这个应用帮你学英语。'],
['Download the app for free.', '免费下载这个应用。'],
],
// ========== 场景·情绪心情 ==========
'joy': [
['Her face shone with joy.', '她脸上洋溢着喜悦。'],
['The good news brought us great joy.', '这个好消息带给我们巨大的快乐。'],
],
'sadness': [
['He could not hide his sadness.', '他无法掩饰悲伤。'],
['There was sadness in her eyes.', '她眼里带着忧伤。'],
],
'fear': [
['He overcame his fear of heights.', '他克服了恐高。'],
['The child trembled with fear.', '孩子吓得发抖。'],
],
'surprise': [
['What a nice surprise!', '真是意外的惊喜!'],
['To my surprise, he came.', '令我惊讶的是,他来了。'],
],
// ========== 场景·时间日期 ==========
'date': [
['What is the date today?', '今天几号?'],
['The meeting date is fixed.', '会议日期已定。'],
],
'weekend': [
['We went camping last weekend.', '上周末我们去露营了。'],
['What do you usually do on weekends?', '你周末通常做什么?'],
],
'midnight': [
['We stayed up until midnight.', '我们熬到了午夜。'],
['The train arrives at midnight.', '火车午夜到达。'],
],
'deadline': [
['The deadline is Friday.', '截止日期是周五。'],
['I have to meet the deadline.', '我必须赶在截止日期前完成。'],
],
// ========== 场景·家庭生活 ==========
'baby': [
['The baby is sleeping soundly.', '宝宝睡得很香。'],
['She is expecting a baby.', '她怀孕了。'],
],
'wedding': [
['The wedding will be in May.', '婚礼将在五月举行。'],
['We danced at the wedding.', '我们在婚礼上跳舞。'],
],
'birthday': [
['Happy birthday to you!', '祝你生日快乐!'],
['My birthday is in October.', '我的生日在十月。'],
],
'relative': [
['A relative of mine lives in Shanghai.', '我有个亲戚住在上海。'],
['We visit our relatives every year.', '我们每年走亲戚。'],
],
// ========== 场景·美容理发 ==========
'haircut': [
['I need a haircut.', '我需要理发。'],
['That haircut suits you.', '那个发型很适合你。'],
],
'shampoo': [
['This shampoo smells great.', '这款洗发水很香。'],
['We need to buy some shampoo.', '我们需要买洗发水。'],
],
'towel': [
['Dry your hair with a towel.', '用毛巾擦干头发。'],
['The towel is soft and clean.', '毛巾又软又干净。'],
],
'mirror': [
['She looked at herself in the mirror.', '她照了照镜子。'],
['The mirror is on the wall.', '镜子挂在墙上。'],
],
// ========== 场景·修理服务 ==========
'repair': [
['The watch needs repair.', '手表需要修理。'],
['He repaired the broken chair.', '他修好了坏椅子。'],
],
'tool': [
['I need a tool to fix it.', '我需要工具来修它。'],
['The toolbox is in the garage.', '工具箱在车库里。'],
],
'electricity': [
['The electricity went out.', '停电了。'],
['We should save electricity.', '我们应该节约用电。'],
],
'guarantee': [
['The phone has a two-year guarantee.', '手机保修两年。'],
['The repair is under guarantee.', '这次维修在保修范围内。'],
],
// ========== 场景·警察求助 ==========
'police': [
['Call the police!', '快报警!'],
['The police arrived quickly.', '警察很快到了。'],
],
'thief': [
['The thief stole my wallet.', '小偷扒走了我的钱包。'],
['The police caught the thief.', '警察抓住了小偷。'],
],
'report': [
['I reported the loss to the police.', '我向警察报了丢失。'],
['She wrote a report for the meeting.', '她为会议写了份报告。'],
],
'fine': [
['He paid a fine for speeding.', '他因超速交了罚款。'],
['The fine is 200 yuan.', '罚款是两百元。'],
],
// ========== 场景·天气气候 ==========
'forecast': [
['The forecast says it will rain.', '天气预报说要下雨。'],
['Did you check the weather forecast?', '你看天气预报了吗?'],
],
'fog': [
['The fog is thick this morning.', '今天早上雾很大。'],
['Driving in fog is dangerous.', '雾天开车很危险。'],
],
'storm': [
['A storm is coming.', '暴风雨要来了。'],
['The storm knocked down trees.', '暴风雨刮倒了树木。'],
],
'degree': [
['It is 30 degrees today.', '今天三十度。'],
['The temperature dropped ten degrees.', '气温下降了十度。'],
],
// ========== 场景·衣物鞋帽 ==========
'fashion': [
['She is interested in fashion.', '她对时尚感兴趣。'],
['This style is in fashion now.', '这种款式现在很流行。'],
],
'style': [
['I like your style of dressing.', '我喜欢你的穿衣风格。'],
['The house is built in a modern style.', '房子是现代风格。'],
],
'button': [
['A button fell off my shirt.', '我的衬衫掉了一颗扣子。'],
['Press the button to start.', '按下按钮启动。'],
],
'pocket': [
['He put the key in his pocket.', '他把钥匙放进口袋。'],
['The coat has two pockets.', '这件外套有两个口袋。'],
],
// ========== 场景·节日庆典 ==========
'festival': [
['The Spring Festival is my favorite.', '春节是我最喜欢的节日。'],
['The city holds a music festival.', '这座城市举办音乐节。'],
],
'gift': [
['She opened the gift with a smile.', '她微笑着打开礼物。'],
['This book is a gift from my uncle.', '这本书是叔叔送的礼物。'],
],
'fireworks': [
['We watched the fireworks at midnight.', '我们午夜看了烟花。'],
['Fireworks lit up the sky.', '烟花照亮了夜空。'],
],
'celebrate': [
['We celebrate the New Year together.', '我们一起庆祝新年。'],
['How do you celebrate your birthday?', '你怎么庆祝生日?'],
],
// ========== 场景·自然环境 ==========
'nature': [
['I love spending time in nature.', '我喜欢亲近大自然。'],
['Nature wakes up in spring.', '春天大自然苏醒。'],
],
'forest': [
['We got lost in the forest.', '我们在森林里迷了路。'],
['The forest is full of birds.', '森林里到处是鸟。'],
],
'river': [
['The river flows through the city.', '河流穿城而过。'],
['We swam in the river.', '我们在河里游泳。'],
],
'pollution': [
['Air pollution is a serious problem.', '空气污染是个严重的问题。'],
['We must fight water pollution.', '我们必须治理水污染。'],
],
// ========== 场景·动物宠物 ==========
'pet': [
['I have a pet dog.', '我养了一只宠物狗。'],
['Pets need love and care.', '宠物需要关爱和照料。'],
],
'parrot': [
['The parrot can talk.', '这只鹦鹉会说话。'],
['Her parrot has colorful feathers.', '她的鹦鹉羽毛色彩斑斓。'],
],
'cage': [
['The bird lives in a cage.', '鸟住在笼子里。'],
['The lion escaped from the cage.', '狮子从笼子里逃了出来。'],
],
'vet': [
['We took the cat to the vet.', '我们带猫去看了兽医。'],
['The vet checked the dog\'s leg.', '兽医检查了狗的腿。'],
],
// ========== 场景·学校课堂 ==========
'classroom': [
['Our classroom is bright and clean.', '我们的教室明亮干净。'],
['The students are in the classroom.', '学生们在教室里。'],
],
'bell': [
['The bell rang and the class ended.', '铃响了,下课了。'],
['I heard the doorbell.', '我听到了门铃声。'],
],
'chalk': [
['The teacher wrote on the board with chalk.', '老师用粉笔在黑板上写字。'],
['My hands are white with chalk.', '我手上沾满了粉笔灰。'],
],
'classmate': [
['He is my classmate.', '他是我的同学。'],
['I met an old classmate yesterday.', '我昨天遇到了老同学。'],
],
// ========== 场景·厨房做饭 ==========
'cooking': [
['I enjoy cooking for my family.', '我喜欢给家人做饭。'],
['Her cooking is famous among friends.', '她的厨艺在朋友中很有名。'],
],
'fry': [
['Fry the eggs for two minutes.', '把鸡蛋煎两分钟。'],
['He fried the fish in oil.', '他用油煎了鱼。'],
],
'knife': [
['This knife is very sharp.', '这把刀非常锋利。'],
['Cut the meat with a knife.', '用刀切肉。'],
],
'pot': [
['The soup is boiling in the pot.', '汤在锅里沸腾。'],
['She bought a new cooking pot.', '她买了个新锅。'],
],
// ========== 场景·打扫家务 ==========
'sweep': [
['I sweep the floor every day.', '我每天扫地。'],
['She swept the leaves from the yard.', '她扫掉了院子里的落叶。'],
],
'mop': [
['The floor is wet, I just mopped it.', '地板是湿的,我刚拖过。'],
['He mops the kitchen floor.', '他拖厨房的地板。'],
],
'dust': [
['There is dust on the shelf.', '架子上有灰尘。'],
['She dusted the furniture.', '她擦拭了家具上的灰尘。'],
],
'tidy': [
['Keep your desk tidy.', '保持书桌整洁。'],
['The room looks clean and tidy.', '房间看起来干净整洁。'],
],
// ========== 场景·约会交友 ==========
'romance': [
['The movie is a sweet romance.', '这部电影是部甜蜜的爱情片。'],
['Their romance lasted for years.', '他们的恋情持续了多年。'],
],
'kiss': [
['She kissed the baby on the cheek.', '她亲了亲宝宝的脸颊。'],
['They shared a goodbye kiss.', '他们吻别。'],
],
'hug': [
['She gave me a warm hug.', '她给了我一个温暖的拥抱。'],
['The mother hugged her child.', '妈妈拥抱了孩子。'],
],
'love': [
['I love my family.', '我爱我的家人。'],
['They fell in love at first sight.', '他们一见钟情。'],
],
// ========== 场景·邮局快递 ==========
'post office': [
['The post office is next to the bank.', '邮局在银行旁边。'],
['I sent the letter at the post office.', '我在邮局寄了信。'],
],
'parcel': [
['A parcel arrived for you.', '有你的包裹。'],
['She sent a parcel to her mother.', '她给妈妈寄了个包裹。'],
],
'envelope': [
['Put the letter in the envelope.', '把信装进信封。'],
['I need an envelope and a stamp.', '我需要信封和邮票。'],
],
'delivery': [
['The delivery is free.', '配送免费。'],
['The package delivery took three days.', '包裹配送花了三天。'],
],
// ========== 场景·旅游观光 ==========
'sightseeing': [
['We went sightseeing in Moscow.', '我们在莫斯科观光。'],
['The city tour includes sightseeing.', '城市游包括观光。'],
],
'guide': [
['The guide spoke fluent English.', '导游英语说得很流利。'],
['A guide took us around the museum.', '导游带我们参观了博物馆。'],
],
'souvenir': [
['I bought souvenirs for my friends.', '我给朋友们买了纪念品。'],
['This shop sells local souvenirs.', '这家店卖当地纪念品。'],
],
'map': [
['Can you show me on the map?', '你能在地图上指给我看吗?'],
['We used a map to find the hotel.', '我们靠地图找到了酒店。'],
],
// ========== 高频·虚词 ==========
'the': [
['The sun is shining.', '阳光灿烂。'],
['The book on the table is mine.', '桌上的那本书是我的。'],
],
'a': [
['I have a dog and a cat.', '我有一只狗和一只猫。'],
['She is a teacher.', '她是一名教师。'],
],
'and': [
['I like tea and coffee.', '我喜欢茶和咖啡。'],
['He sang and danced all night.', '他唱跳了一整夜。'],
],
'or': [
['Do you want tea or coffee?', '你要茶还是咖啡?'],
['Hurry up, or we will be late.', '快点,否则我们要迟到了。'],
],
'but': [
['The house is small but cozy.', '房子虽小但舒适。'],
['I called him, but he did not answer.', '我给他打电话,但他没接。'],
],
'because': [
['I stayed home because it rained.', '因为下雨,我待在家里。'],
['She cried because she was happy.', '她高兴得哭了。'],
],
'so': [
['It was late, so we went home.', '天晚了,所以我们回家了。'],
['He is so kind to everyone.', '他对每个人都很好。'],
],
'if': [
['If it rains, we will stay in.', '如果下雨,我们就待在家里。'],
['Let me know if you need help.', '需要帮忙就告诉我。'],
],
'when': [
['Call me when you arrive.', '你到了就给我打电话。'],
['I was reading when the phone rang.', '电话响时我正在看书。'],
],
'while': [
['I listened to music while cooking.', '我做饭时听音乐。'],
['He likes tea, while she likes coffee.', '他喜欢茶,而她喜欢咖啡。'],
],
'after': [
['We went home after the movie.', '电影结束后我们回了家。'],
['After dinner, we took a walk.', '晚饭后我们散了步。'],
],
'before': [
['Wash your hands before eating.', '饭前洗手。'],
['I saw him before the meeting.', '开会前我见到了他。'],
],
'with': [
['I live with my parents.', '我和父母一起住。'],
['She cut the cake with a knife.', '她用刀切了蛋糕。'],
],
'without': [
['I cannot live without music.', '没有音乐我活不下去。'],
['He left without saying goodbye.', '他没道别就走了。'],
],
'about': [
['Tell me about your trip.', '给我讲讲你的旅行。'],
['The movie is about a brave girl.', '这部电影讲的是个勇敢女孩的故事。'],
],
// ========== 高频·代词 ==========
'my': [
['My mother is a nurse.', '我妈妈是护士。'],
['This is my favorite song.', '这是我最喜欢的歌。'],
],
'your': [
['Is this your bag?', '这是你的包吗?'],
['What is your name?', '你叫什么名字?'],
],
'his': [
['His car is very fast.', '他的车很快。'],
['I borrowed his pen.', '我借了他的笔。'],
],
'her': [
['Her smile is beautiful.', '她的笑容很美。'],
['I called her yesterday.', '我昨天给她打了电话。'],
],
'its': [
['The dog wagged its tail.', '狗摇了摇尾巴。'],
['The company changed its logo.', '公司更换了标志。'],
],
'our': [
['Our school is very old.', '我们的学校很古老。'],
['This is our new home.', '这是我们的新家。'],
],
'their': [
['Their children are very polite.', '他们的孩子非常有礼貌。'],
['The students opened their books.', '学生们打开了书。'],
],
'which': [
['Which color do you prefer?', '你更喜欢哪个颜色?'],
['The book which I borrowed is great.', '我借的那本书很棒。'],
],
'whose': [
['Whose coat is this?', '这是谁的外套?'],
['The girl whose bike was stolen is crying.', '自行车被偷的女孩在哭。'],
],
'myself': [
['I made the cake myself.', '蛋糕是我自己做的。'],
['I bought myself a gift.', '我给自己买了份礼物。'],
],
// ========== 高频·动词 ==========
'get': [
['I got a letter from my friend.', '我收到了朋友的来信。'],
['She gets up at six every day.', '她每天六点起床。'],
],
'make': [
['Mom made a cake for us.', '妈妈给我们做了蛋糕。'],
['This song makes me happy.', '这首歌让我开心。'],
],
'take': [
['Take an umbrella with you.', '带把伞。'],
['It takes an hour to get there.', '到那里要一个小时。'],
],
'give': [
['Give me a call tonight.', '今晚给我打电话。'],
['She gave me a book.', '她给了我一本书。'],
],
'find': [
['I cannot find my keys.', '我找不到钥匙了。'],
['He found a job in Shanghai.', '他在上海找了份工作。'],
],
'tell': [
['Tell me the truth.', '告诉我真相。'],
['She told us a funny story.', '她给我们讲了个有趣的故事。'],
],
'ask': [
['May I ask a question?', '我可以问个问题吗?'],
['He asked me for help.', '他向我求助。'],
],
'say': [
['What did you say?', '你说了什么?'],
['She said nothing and left.', '她什么也没说就走了。'],
],
'mean': [
['What does this word mean?', '这个词是什么意思?'],
['I did not mean to hurt you.', '我不是故意伤害你。'],
],
'need': [
['I need some help.', '我需要帮助。'],
['You need to sleep more.', '你需要多睡觉。'],
],
'use': [
['Can I use your phone?', '我可以用一下你的手机吗?'],
['We use computers every day.', '我们每天用电脑。'],
],
'try': [
['Try this cake, it is delicious.', '尝尝这个蛋糕,很好吃。'],
['I will try my best.', '我会尽最大努力。'],
],
'leave': [
['The train leaves at eight.', '火车八点开。'],
['Do not leave me alone.', '别丢下我。'],
],
'keep': [
['Keep the change.', '零钱不用找了。'],
['Keep quiet in the library.', '在图书馆保持安静。'],
],
'put': [
['Put the book on the shelf.', '把书放到架子上。'],
['She put sugar in the coffee.', '她往咖啡里加了糖。'],
],
// ========== 高频·名词 ==========
'thing': [
['There is one thing I must tell you.', '有件事我必须告诉你。'],
['The best thing in life is free.', '生活中最好的东西是免费的。'],
],
'way': [
['This is the way to the station.', '这是去车站的路。'],
['Everyone has their own way of learning.', '每个人都有自己的学习方法。'],
],
'people': [
['Many people love this movie.', '很多人喜欢这部电影。'],
['People are friendly here.', '这里的人们很友好。'],
],
'world': [
['I want to travel around the world.', '我想环游世界。'],
['The world is getting smaller.', '世界变得越来越小。'],
],
'life': [
['Life is full of surprises.', '生活充满惊喜。'],
['She lives a quiet life.', '她过着平静的生活。'],
],
'part': [
['This is my favorite part of the book.', '这是书里我最喜欢的部分。'],
['He took part in the contest.', '他参加了比赛。'],
],
'problem': [
['We have a problem with the car.', '我们的车出了点问题。'],
['No problem! I can help.', '没问题!我可以帮忙。'],
],
'question': [
['That is a good question.', '问得好。'],
['Do you have any questions?', '你有什么问题吗?'],
],
'answer': [
['The answer is simple.', '答案很简单。'],
['She did not answer my question.', '她没有回答我的问题。'],
],
'place': [
['This is a beautiful place.', '这是个美丽的地方。'],
['Save a place for me, please.', '请给我留个位子。'],
],
'home': [
['I am going home now.', '我现在回家。'],
['There is no place like home.', '哪里都不如家好。'],
],
'room': [
['My room is on the second floor.', '我的房间在二楼。'],
['There is no room for more people.', '没有位置容纳更多人了。'],
],
'food': [
['The food here is great.', '这里的食物很棒。'],
['We need to buy some food.', '我们需要买些食物。'],
],
'job': [
['She found a new job.', '她找到了新工作。'],
['He did a great job!', '他干得漂亮!'],
],
'news': [
['I have good news for you.', '我有好消息告诉你。'],
['We watch the news every evening.', '我们每天晚上看新闻。'],
],
// ========== 高频·形容词 ==========
'other': [
['Do you have other questions?', '你还有其他问题吗?'],
['The other shoe is under the bed.', '另一只鞋在床下。'],
],
'same': [
['We go to the same school.', '我们上同一所学校。'],
['They gave the same answer.', '他们给出了相同的答案。'],
],
'special': [
['Today is a special day.', '今天是个特别的日子。'],
['I cooked something special for you.', '我给你做了点特别的。'],
],
'free': [
['The museum is free on Sundays.', '博物馆周日免费。'],
['Are you free this evening?', '你今晚有空吗?'],
],
'full': [
['The bus is full.', '公交车坐满了。'],
['The glass is full of water.', '杯子盛满了水。'],
],
'sure': [
['Are you sure about this?', '你确定吗?'],
['I am sure he will come.', '我确信他会来。'],
],
'real': [
['This is a real diamond.', '这是真钻石。'],
['Is the story real?', '这个故事是真的吗?'],
],
'true': [
['The movie is based on a true story.', '这部电影根据真实故事改编。'],
['His words came true.', '他的话应验了。'],
],
'right': [
['Your answer is right.', '你的答案是对的。'],
['Raise your right hand.', '举起右手。'],
],
'wrong': [
['I dialed the wrong number.', '我打错电话了。'],
['There is something wrong with my phone.', '我的手机出毛病了。'],
],
'great': [
['We had a great time together.', '我们一起度过了愉快的时光。'],
['She is a great singer.', '她是位了不起的歌手。'],
],
'high': [
['The mountain is very high.', '这座山非常高。'],
['The price is too high.', '价格太高了。'],
],
'low': [
['The chair is too low for me.', '这把椅子对我来说太矮了。'],
['He speaks in a low voice.', '他低声说话。'],
],
'late': [
['I was late for school.', '我上学迟到了。'],
['It is getting late.', '天色不早了。'],
],
'early': [
['I get up early every day.', '我每天早起。'],
['We arrived early at the airport.', '我们早早就到了机场。'],
],
// ========== 高频·副词 ==========
'also': [
['I also like swimming.', '我也喜欢游泳。'],
['She is also a writer.', '她还是位作家。'],
],
'just': [
['I just finished my homework.', '我刚做完作业。'],
['It is just a small mistake.', '这只是个小错误。'],
],
'only': [
['I have only one dollar left.', '我只剩一美元了。'],
['Only she knows the truth.', '只有她知道真相。'],
],
'very': [
['The movie was very interesting.', '这部电影非常有趣。'],
['Thank you very much!', '非常感谢!'],
],
'too': [
['The coffee is too hot.', '咖啡太烫了。'],
['I like music, too.', '我也喜欢音乐。'],
],
'again': [
['Please say it again.', '请再说一遍。'],
['I want to see you again.', '我想再见到你。'],
],
'soon': [
['See you soon!', '回头见!'],
['She will be back soon.', '她很快就会回来。'],
],
'later': [
['See you later!', '一会儿见!'],
['I will call you later.', '我晚点给你打电话。'],
],
'together': [
['We studied together.', '我们一起学习。'],
['Let us go together.', '我们一起去吧。'],
],
'really': [
['I really like this song.', '我真的很喜欢这首歌。'],
['Is it really true?', '这是真的吗?'],
],
'quite': [
['The test was quite easy.', '这次考试相当简单。'],
['It is quite cold today.', '今天相当冷。'],
],
'almost': [
['I almost missed the bus.', '我差点错过公交车。'],
['The work is almost done.', '工作几乎完成了。'],
],
'enough': [
['I have enough money for lunch.', '我的钱够吃午饭。'],
['That is enough, thank you.', '够了,谢谢。'],
],
'maybe': [
['Maybe he forgot the meeting.', '也许他忘了开会。'],
['Maybe it will rain later.', '也许晚点会下雨。'],
],
'already': [
['I have already eaten.', '我已经吃过了。'],
['The movie has already started.', '电影已经开始了。'],
],
// ========== 易错·形近词 ==========
'there': [
['Put the box there, please.', '请把盒子放在那里。'],
['There are two apples on the table.', '桌上有两个苹果。'],
],
'affect': [
['The weather affects my mood.', '天气影响我的心情。'],
['Smoking affects your health.', '吸烟影响健康。'],
],
'raise': [
['Raise your hand if you know the answer.', '知道答案的请举手。'],
['They raised money for the school.', '他们为学校筹集了资金。'],
],
'hear': [
['Can you hear the birds singing?', '你听得见鸟儿歌唱吗?'],
['I heard a strange noise last night.', '昨晚我听到一个奇怪的声音。'],
],
'look': [
['Look at the beautiful sunset!', '看那美丽的日落!'],
['She looks tired today.', '她今天看起来很累。'],
],
'quiet': [
['Please keep quiet in class.', '课堂上请保持安静。'],
['We live in a quiet street.', '我们住在一条安静的街上。'],
],
'lose': [
['Do not lose your ticket.', '别把票弄丢了。'],
['We lost the game by one point.', '我们以一分之差输掉了比赛。'],
],
'beside': [
['The cat is sleeping beside the fire.', '猫在火炉旁睡觉。'],
['Come and sit beside me.', '过来坐我旁边。'],
],
// ========== 易错·搭配 ==========
'depend': [
['It depends on the weather.', '这取决于天气。'],
['Children depend on their parents.', '孩子依赖父母。'],
],
'married': [
['She is married to a doctor.', '她嫁给了一位医生。'],
['They got married last year.', '他们去年结婚了。'],
],
'insist': [
['He insisted on paying the bill.', '他坚持要买单。'],
['She insisted on coming with us.', '她坚持要跟我们一起来。'],
],
'arrive': [
['We arrived at the station on time.', '我们准时到达车站。'],
['They will arrive in Beijing tomorrow.', '他们明天到达北京。'],
],
// ========== 易错·用法 ==========
'much': [
['How much is this book?', '这本书多少钱?'],
['There is too much sugar in the tea.', '茶里糖太多了。'],
],
'fewer': [
['Fewer people came this year.', '今年来的人更少了。'],
['Eat fewer sweets and more fruit.', '少吃糖,多吃水果。'],
],
'borrow': [
['Can I borrow your pen?', '我能借你的笔吗?'],
['I borrowed this book from the library.', '我从图书馆借了这本书。'],
],
'lie': [
['The cat is lying on the sofa.', '猫躺在沙发上。'],
['He lies down for a nap after lunch.', '他午饭后躺下小睡。'],
],
'fun': [
['We had great fun at the party.', '我们在聚会上玩得很开心。'],
['Learning English can be fun.', '学英语可以很有趣。'],
],
'advice': [
['Let me give you a piece of advice.', '让我给你一条建议。'],
['She asked me for advice.', '她向我征求意见。'],
],
// ========== 易错·重音 ==========
'record': [
['This is my favorite record.', '这是我最喜欢的唱片。'],
['He broke the world record.', '他打破了世界纪录。'],
],
'present': [
['She gave me a birthday present.', '她送了我生日礼物。'],
['All the students are present today.', '今天所有学生都到齐了。'],
],
'photograph': [
['This photograph was taken in Beijing.', '这张照片是在北京拍的。'],
['He showed me an old photograph.', '他给我看了一张老照片。'],
],
'comfortable': [
['This sofa is very comfortable.', '这个沙发非常舒适。'],
['Make yourself comfortable!', '请随意,别拘束!'],
],
});
