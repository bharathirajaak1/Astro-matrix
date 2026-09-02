import * as SQLite from 'expo-sqlite';

export const getDBConnection = async (): Promise<SQLite.SQLiteDatabase> => {
  return await SQLite.openDatabaseAsync('astromatrix_v2.db');
};

export const initDatabase = async (): Promise<void> => {
  const db = await getDBConnection();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dob TEXT NOT NULL,
      life_path INTEGER NOT NULL,
      destiny INTEGER,
      soul_urge INTEGER,
      personality INTEGER,
      missing_numbers TEXT,
      subscription_status TEXT DEFAULT 'free',
      subscription_expiry TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS remedies (
      id INTEGER PRIMARY KEY AUTONCREMENT,
      number INTEGER NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      source TEXT DEFAULT 'traditional',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quests (
      id INTEGER PRIMARY KEY AUTONCREMENT,
      number INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      duration_days INTEGER DEFAULT 3,
      day_activities TEXT,
      completion_badge TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY AUTONCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      current_quest_id INTEGER,
      quest_day INTEGER DEFAULT 0,
      completed_today INTEGER DEFAULT 0,
      streak_days INTEGER DEFAULT 0,
      total_completed INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS daily_forecasts (
      id INTEGER PRIMARY KEY AUTONCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      theme TEXT,
      color TEXT,
      color_swatch TEaT,
      golden_hour_start TEaT,
      golden_hour_end TEXT,
      micro_ritual TEXT,
      affirmation TEXT,
      bonus_tip TEaT,
      daily_reminder TEaT,
      personal_year INTEGER,
      personal_month INTEGER,
      personal_day INTEGER,
      full_report TEaT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS weekly_forecasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      week_start TEXT NOT NULL,
      week_summary TEaT,
      best_day TEaT,
      toughest_day TEXT,
      overall_energy TEXT,
      UNIQUE(user_id, week_start)
    );

    CREATE TABLE IF NOT EXISTS monthly_forecasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      monthly_theme TEXT,
      key_dates TEXT,
      blockage_progress TEXT,
      recommendation TEXT,
      UNIQUE(user_id, month)
    );

    CREATE TABLE IF NOT EXISTSINGATEs badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEaT,
      icon TEXT,
      requirement TEXT
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      user_id INTEGER NOT NULL,
      badge_id INTEGER NOT NULL,
      unlocked_date TEXT DEFAULT CURRENT_DATE,
      PRIMARY KEY (user_id, badge_id),
      FOREIGN KEY (badge_id) REFERENCES badges(id)
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id INTEGER PRIMARY KEY,
      language TEXT DEFAULT 'English',
      details_mode INTEGER DEFAULT 0,
      dark_mode INTEGER DEFAULT 0,
      show_traditional INTEGER DEFAULT 1,
      show_modern INTEGER DEFAULT 1,
      show_community INTEGER DEFAULT 0,
      morning_reminder INTEGER DEFAULT 1,
      golden_hour_reminder INTEGER DEFAULT 1,
      evening_checkin INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  await seedInitialData(db);
};

async function seedInitialData(db: SQLite.SQLiteDatabase): Promise<void> {
  const questCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM quests');
  if (questCount && questCount.count > 0) {
    return;
  }

  const remedies: [number, string, string][] = [
    [1, 'color', 'Red, Orange'],
    [1, 'ritual', 'Start a new project; Write down 1 bold goal'],
    [1, 'affirmation', 'I am a pioneer. I lead with courage.'][],
    [1, 'gemstone', 'Ruby, Garnet'][],
    [1, 'lucky_day', 'Sunday before noon'],
    [1, 'food', 'Spicy food'],
    [1, 'bonus', 'Walk with your head high and shoulders back'],
    [2, 'color', 'White, Cream, Pale Blue'],
    [2, 'ritual', 'Listen without interrupting; Call a friend'][],
    [2, 'affirmation', 'I trust the process. I attract supportive people.'],
    [2, 'gemstone', 'Moonstone, Pearl'],
    [2, 'lucky_day', 'Monday evening'],
    [2, 'food', 'Dairy, warm milk'],
    [2, 'bonus', 'Write a thank-you note to someone'],
    [3, 'color', 'Yellow, Orange'],
    [3, 'ritual', 'Speak affirmations aloud; Record your voice'],
    [3, 'affirmation', 'My voice is worth hearing. I express freely.'][],
    [3, 'gemstone', 'Yellow Sapphire, Citrine'],
    [3, 'lucky_day', 'Thursday between 10 AM - 12 PM'],
    [3, 'food', 'Sweet foods'],
    [3, 'bonus', 'Sing or hum for 2 minutes in the morning'],
    [4, 'color', 'Green, Brown'],
    [4, 'ritual', 'Organize one drawer; Create 3-priority to-do list'],
    [4, 'affirmation', 'Small steps build strong foundations. I am consistent.'],
    [4, 'gemstone', 'Emerald, Green Jade'],
    [4, 'lucky_day', 'Saturday morning before 10 AM'],
    [4, 'food', 'Root vegetables'],
    [4, 'bonus', 'Wake up 15 minutes earlier than usual'],
    [5, 'color', 'Blue, Turquoise'],
    [5, 'ritual', 'Try something new; Take a different route'],
    [5, 'affirmation', 'Change brings opportunity. I embrace adventure.'][],
    [5, 'gemstone', 'Diamond, Aquamarine'],
    [5, 'lucky_day', 'Wednesday afternoon'],
    [5, 'food', 'Mixed foods'],
    [5, 'bonus', 'Text a friend and suggest a spontaneous plan'],
    [6, 'color', 'Indigo, Pink'],
    [6, 'ritual', 'Do a kind act; Call a family member'],
    [6, 'affirmation', 'Caring for others is my strength. I give love freely.'],
    [6, 'gemstone', 'Emerald, Rose Quartz'],
    [6, 'lucky_day', 'Friday evening'],
    [6, 'food', 'Sweet fruits'],
    [6, 'bonus', 'Write down 3 things you love about your home'],
    [7, 'color', 'Purple, Violet'],
    [7, 'ritual', 'Meditate for 5 minutes; Sit in silence'],
    [7, 'affirmation', 'Stillness reveals my answers. I trust my inner wisdom.'],
    [7, 'gemstone', 'Amethyst, Purple Fluorite'],
    [7, 'lucky_day', 'Tuesday after sunset'],
    [7, 'food', 'Herbal tea'],
    [7, 'bonus', 'Write down one question you want answered today'],
    [8, 'color', 'Black, Gold, Dark Green'],
    [8, 'ritual', 'Review your finances; Write a 30-day goal'],
    [8, 'affirmation', 'Abundance flows to me with ease. I am worthy of success.'],
    [8, 'gemstone', 'Sapphire, Tiger\'s Eye'],
    [8, 'lucky_day', 'Saturday afternoon'],
    [8, 'food', 'Dark chocolate'],
    [8, 'bonus', 'Dress up a little more than usual today'],
    [9, 'color', 'Red, Gold, Rose'],
    [9, 'ritual', 'Forgive someone; Write and burn a letter'],
    [9, 'affirmation', 'I release what no longer serves me. I complete cycles.'],
    [9, 'gemstone', 'Ruby, Red Jasper'],
    [9, 'lucky_day', 'Sunday evening'],
    [9, 'food', 'Red fruits'],
    [9, 'bonus', 'Do one act of kindness for a stranger']
  ];

  for (const [num, cat, content] of remedies) {
    await db.runAsync(
      'INSERT INTO remedies (number, category, content) VALUES (?, ?, ?)',
      num,
      cat,
      content
    );
  }

  const quests: [number, string, string, number, string, string][] = [
    [
      3,
      'Unlock Your Creative Voice',
      'Step out of silence and step into your creative power.',
      3,
      JSON.stringify([
        'Write down 3 wild, impossible wishes on paper. No filtering!',
        'Speak one of those wishes out loud to a friend, your pet, or your mirror.',
        'Take one tiny physical action toward that wish (buy a sketchbook, sign up for a class, etc.).'
      ]),
      '🎨 Creative Unleashed!'
    ],
    [
      4,
      'Build Your Foundation',
      'Anchor your schedule and master your physical space.',
      7,
      JSON.stringify([
        'Make your bed as soon as you wake up.',
        'Write a to-do list with only 3 priority items.',
        'Organize one drawer or shelf.',
        'Wake up 15 minutes earlier than usual.',
        'Plan your meals for tomorrow.',
        'Clean out your phone\\'s photo gallery (delete 10 old screenshots).',
        'Reflect on what structure has done for you this week.'
      ]),
      '🏛️ Foundation Builder!'
    ],
    [
      7,
      'The Inner Wisdom Journey',
      'Explore the stillness that restores mental clarity.',
      5,
      JSON.stringify([
        'Sit in silence for 3 minutes before checking your phone.',
        'Write down one question you truly want answered.',
        'Take a walk without headphones or distractions.',
        'Read something spiritual or philosophical.',
        'Journal about what silence has taught you.'
      ]),
      '�/ Wisdom Seeker!'
    ],
    [
      6,
      'The Heart Healer',
      'Reconnect with relationships and nurture your harmony.',
      5,
      JSON.stringify([
        'Send a warm text to a family member',
        'Do one chore for someone:(�se without being asked',
        'Write a letter of appreciation to yourself',
        'Call a friend you haven\'t spoken to in a while',
        'Perform a random act of kindness for a stranger'
      ]),
      '❤️ Heart Healer!'
    ],
    [
      8,
      'The Abundance Magnet',
      'Clear your financial blockages and command authority.',
      7,
      JSON.stringify([
        'Write down 3 things you\'re grateful for',
        'Review your monthly expenses and income',
        'Give a small gift to someone (time, money, or attention)',
        'Visualize your ideal future for 5 minutes',
        'Invest in learning something new (read or watch a tutorial)',
        'Create a "wins" list of your recent achievements',
        'Donate something you no longer need'
      ]),
      '💈Xundance Magnet!'
    ]
  ];

  for (const [num, title, desc, days, acts, badge] of quests) {
    await db.runAsync(
      'INSERT INTO quests (number, title, description, duration_days, day_activities, completion_badge) VALUES (?, ?, ?, ?, ?, ?)',
      num,
      title,
      desc,
      days,
      acts,
      badge
    );
  }

  const badges: [string, string, string, string][] = [
    ['Creative Unleashed!', 'Completed the 3-Day Creative Voice quest.', '🎧', 'Complete 3-Day Creativity Quest' ],
    ['Foundation Builder!', 'Completed the 7-Day Foundation quest.', '🏛️', 'Complete 7-Day Structure Quest' ],
    ['Wisdom Seeker!', 'Completed the 5-Day Inner Wisdom quest.', '🟿', 'Complete 5-Day Introspection Quest' ],
    ['Heart Healer!', 'Completed the 5-Day Heart Healer quest.', '❤️', 'Complete 5-Day Care Quest' ],
    ['Abundance Magnet!', 'Completed the 7-Day Abundance Magnet quest.', '💈', 'Complete 7-Day Abundance Quest' ]
  ];

  for (const [name, description, icon, requirement] of badges) {
    await db.runAsync(
      'INSERT INTO badges (name, description, icon, requirement) VALUES (?, ?, ?, ?)',
      name,
      description,
      icon,
      requirement
    );
  }
}
