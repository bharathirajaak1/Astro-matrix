import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDBConnection(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  const db = await SQLite.openDatabaseAsync('astromatrix.db');
  await initTables(db);
  await seedInitialData(db);
  dbInstance = db;
  return db;
}

async function initTables(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dob TEXT NOT NULL,
      life_path INTEGER NOT NULL,
      destiny INTEGER NOT NULL,
      soul_urge INTEGER NOT NULL,
      personality INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      reading_text TEXT NOT NULL,
      saved INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS remedies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      days INTEGER NOT NULL,
      completion_badge TEXT NOT NULL,
      day_activities TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_quests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quest_id INTEGER NOT NULL,
      current_day INTEGER DEFAULT 1,
      completed INTEGER DEFAULT 0,
      started_at TEXT NOT NULL,
      last_completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_name TEXT NOT NULL,
      associated_number INTEGER NOT NULL,
      frequency TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      last_sent TEXT
    );

    CREATE TABLE IF NOT EXISTS app_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      remedy_source TEXT DEFAULT 'traditional',
      notifications_enabled INTEGER DEFAULT 1,
      morning_reminder_time TEXT DEFAULT '08:00',
      golden_hour_alerts INTEGER DEFAULT 1,
      evening_checkin_time TEXT DEFAULT '21:00',
      dark_mode INTEGER DEFAULT 0
    );
  `);
}

async function seedInitialData(db: SQLite.SQLiteDatabase): Promise<void> {
  const countRes = await db.getFirstAsync<{ count: number }>(
    'SELECT count(*) as count FROM remedies'
  );
  if (countRes && countRes.count > 0) {
    return;
  }

  const remedies: [number, string, string][] = [
    [1, 'color', 'Red, Orange, Gold'],
    [1, 'ritual', 'Face east at sunrise for 60 seconds; plan one bold action'],
    [1, 'affirmation', 'I am a pioneer. I lead with courage.'],
    [1, 'gemstone', 'Ruby, Garnet'],
    [1, 'lucky_day', 'Sunday morning'],
    [1, 'food', 'Ginger, honey, sunflower seeds'],
    [1, 'bonus', 'Stand straight with shoulders back before opening doors'],

    [2, 'color', 'White, Cream, Silver'],
    [2, 'ritual', 'Listen without interrupting; Call a friend'],
    [2, 'affirmation', 'My sensitivity is my strength. I create harmony.'],
    [2, 'gemstone', 'Pearl, Moonstone'],
    [2, 'lucky_day', 'Monday evening'],
    [2, 'food', 'Melon, coconut water, milk'],
    [2, 'bonus', 'Keep a glass of water on your bedside table'],

    [3, 'color', 'Yellow, Saffron'],
    [3, 'ritual', 'Write 3 creative ideas or speak an affirmation out loud'],
    [3, 'affirmation', 'My voice is worth hearing. I express freely.'],
    [3, 'gemstone', 'Yellow Sapphire, Citrine'],
    [3, 'lucky_day', 'Thursday morning'],
    [3, 'food', 'Turmeric, bananas, chickpeas'],
    [3, 'bonus', 'Sing or hum during your morning routine'],

    [4, 'color', 'Earthen Brown, Forest Green'],
    [4, 'ritual', 'Organize one drawer or write today’s top 3 tasks'],
    [4, 'affirmation', 'Small steps build strong foundations.'],
    [4, 'gemstone', 'Emerald, Green Jade'],
    [4, 'lucky_day', 'Saturday morning'],
    [4, 'food', 'Root vegetables, leafy greens'],
    [4, 'bonus', 'Wake up 15 minutes earlier than usual'],

    [5, 'color', 'Sky Blue, Turquoise'],
    [5, 'ritual', 'Take a different walking route; spend 5 minutes stretching'],
    [5, 'affirmation', 'Change brings opportunity. I embrace adventure.'],
    [5, 'gemstone', 'Aquamarine, Turquoise'],
    [5, 'lucky_day', 'Wednesday midday'],
    [5, 'food', 'Carrots, mint, walnuts'],
    [5, 'bonus', 'Try a fresh recipe or new beverage'],

    [6, 'color', 'Pastel Pink, Indigo Blue'],
    [6, 'ritual', 'Do one act of kindness without expecting return'],
    [6, 'affirmation', 'I give love freely and accept care gratefully.'],
    [6, 'gemstone', 'Diamond, Rose Quartz'],
    [6, 'lucky_day', 'Friday afternoon'],
    [6, 'food', 'Almonds, pomegranate, figs'],
    [6, 'bonus', 'Place fresh flowers in your work room'],

    [7, 'color', 'Deep Violet, Sea Green'],
    [7, 'ritual', 'Take 5 minutes of mindful silence with no screens'],
    [7, 'affirmation', 'I trust inner wisdom and seek truth.'],
    [7, 'gemstone', 'Amethyst, Cat’s Eye'],
    [7, 'lucky_day', 'Tuesday morning'],
    [7, 'food', 'Herbal teas, mushrooms, berries'],
    [7, 'bonus', 'Read 5 pages of inspiring non-fiction'],

    [8, 'color', 'Charcoal Grey, Navy Blue'],
    [8, 'ritual', 'Review your weekly spending; define one milestone'],
    [8, 'affirmation', 'I create lasting abundance through focused action.'],
    [8, 'gemstone', 'Blue Sapphire, Lapis Lazuli'],
    [8, 'lucky_day', 'Saturday dusk'],
    [8, 'food', 'Sesame seeds, dates, dark beans'],
    [8, 'bonus', 'Donate clothes or items you do not use'],

    [9, 'color', 'Warm Coral, Rose Gold'],
    [9, 'ritual', 'Forgive one frustration and let it go cleanly'],
    [9, 'affirmation', 'I release what is complete and welcome transformation.'],
    [9, 'gemstone', 'Ruby, Red Jasper'],
    [9, 'lucky_day', 'Sunday evening'],
    [9, 'food', 'Pomegranate, beetroot, tomatoes'],
    [9, 'bonus', 'Do one anonymous act of kindness for someone']
  ];

  for (const [num, cat, content] of remedies) {
    await db.runAsync(
      'INSERT INTO remedies (number, category, content) VALUES (?, ?, ?)',
      num,
      cat,
      content
    );
  }

  const quests = [
    {
      num: 3,
      title: 'Find Your Authentic Voice',
      desc: 'Overcome self-doubt and share ideas freely.',
      days: 3,
      badge: 'Creative Spark!',
      activities: JSON.stringify([
        'Write 3 honest thoughts in a journal without editing.',
        'Share an idea or story with a colleague or friend.',
        'Record a short voice note describing your biggest dream.'
      ])
    },
    {
      num: 4,
      title: 'Build Your Foundation',
      desc: 'Master discipline and create grounding structures.',
      days: 5,
      badge: 'Foundation Builder!',
      activities: JSON.stringify([
        'Clear one physical desk or drawer completely.',
        'Plan tomorrow with exact 30-minute task blocks.',
        'Wake up at a set time without pressing snooze.',
        'Clean out your phone gallery and delete clutter.',
        'Reflect on what structure has done for you this week.'
      ])
    },
    {
      num: 7,
      title: 'The Inner Sage Path',
      desc: 'Deepen intuition and release restlessness.',
      days: 7,
      badge: 'Inner Light!',
      activities: JSON.stringify([
        '10 minutes quiet breathing before touching your phone.',
        'Take a silent walk in nature without earbuds.',
        'Read inspiring philosophy or poetry for 15 minutes.',
        'Spend an evening without social media.',
        'Write down 5 truths you know about yourself.',
        'Practice mindful eating with one meal in full quiet.',
        'Write a letter of gratitude to your past self.'
      ])
    }
  ];

  for (const q of quests) {
    await db.runAsync(
      'INSERT INTO quests (number, title, description, days, completion_badge, day_activities) VALUES (?, ?, ?, ?, ?, ?)',
      q.num,
      q.title,
      q.desc,
      q.days,
      q.badge,
      q.activities
    );
  }
}
