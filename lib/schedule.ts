export interface WeekEntry {
  id: number         // 1-based week number
  label: string      // e.g. "Dec 30"
  date: Date         // actual calendar date (Wednesday meeting)
  reading: string    // e.g. "Luke 1–5"
  readingBooks: string[]   // parsed book names
  readingChapters: string  // "chapters 1–5"
  memoryRef: string  // e.g. "Matthew 4:1-2"
  memoryDisplay: string    // formatted for display
}

// All 51 weeks — start date: Monday Dec 30, 2025
// Meeting day is Wednesday; user works Tues/Wed
const RAW: [string, string, string][] = [
  ['Dec 30', 'Luke 1–5',              'Matthew 4:1-2'],
  ['Jan 6',  'Luke 6–10',             'Matthew 5:3-10'],
  ['Jan 13', 'Luke 11–15',            'Matthew 5:3-4'],
  ['Jan 20', 'Luke 16–20',            'Matthew 5:7-8'],
  ['Jan 27', 'Luke 21–24',            'Matthew 5:9-10'],
  ['Feb 3',  'John 1–4',              'Matthew 5:13-16'],
  ['Feb 10', 'John 5–7',              'Matthew 5:17-18'],
  ['Feb 17', 'John 8–10',             'Matthew 5:21-22'],
  ['Feb 24', 'John 11–13',            'Matthew 5:23-24'],
  ['Mar 3',  'John 14–17',            'Matthew 5:27-28'],
  ['Mar 10', 'John 18–21',            'Matthew 5:33-34'],
  ['Mar 17', 'Acts 1–4',              'Matthew 5:38-39'],
  ['Mar 24', 'Acts 5–8',              'Matthew 5:43-44'],
  ['Mar 31', 'Acts 9–12',             'Matthew 6:1-2'],
  ['Apr 7',  'Acts 13–16',            'Matthew 6:5-6'],
  ['Apr 14', 'Acts 17–20',            'Matthew 6:9-10'],
  ['Apr 21', 'Acts 21–24',            'Matthew 6:14-15'],
  ['Apr 28', 'Acts 25–28',            'Matthew 6:19-20'],
  ['May 5',  'Romans 1–4',            'Matthew 6:25-26'],
  ['May 12', 'Romans 5–8',            'Matthew 6:33-34'],
  ['May 19', 'Romans 9–12',           'Matthew 7:1-2'],
  ['May 26', 'Romans 13–16',          'Matthew 7:7-8'],
  ['Jun 2',  '1 Corinthians 1–4',     'Matthew 7:13-14'],
  ['Jun 9',  '1 Corinthians 5–8',     'Matthew 7:15-16'],
  ['Jun 16', '1 Corinthians 9–12',    'Matthew 7:24-25'],
  ['Jun 23', '1 Corinthians 13–16',   'Matthew 7:26-27'],
  ['Jun 30', '2 Corinthians 1–4',     'Matthew 22:37-38'],
  ['Jul 7',  '2 Corinthians 5–9',     'Matthew 22:39-40'],
  ['Jul 14', '2 Corinthians 10–13',   'Matthew 28:18-20'],
  ['Jul 21', 'Galatians 1–6',         'Romans 1:16'],
  ['Jul 28', 'Ephesians 1–6',         'Ephesians 2:8-9'],
  ['Aug 4',  'Philippians 1–4',       'Philippians 4:6-7'],
  ['Aug 11', 'Colossians 1–4',        'Colossians 3:23-24'],
  ['Aug 18', '1 Thessalonians 1–5',   '1 Thessalonians 5:16-18'],
  ['Aug 25', '2 Thessalonians 1–3',   '2 Thessalonians 3:3'],
  ['Sep 1',  '1 Timothy 1–6',         '1 Timothy 4:12'],
  ['Sep 8',  '2 Timothy 1–4',         '2 Timothy 3:16-17'],
  ['Sep 15', 'Titus + Philemon',      'Titus 2:11-12'],
  ['Sep 22', 'Hebrews 1–6',           'Hebrews 4:12'],
  ['Sep 29', 'Hebrews 7–10',          'Hebrews 11:1'],
  ['Oct 6',  'Hebrews 11–13',         'Hebrews 12:1-2'],
  ['Oct 13', 'James 1–5',             'James 1:22'],
  ['Oct 20', '1 Peter 1–5',           '1 Peter 5:7'],
  ['Oct 27', '2 Peter 1–3',           '2 Peter 3:9'],
  ['Nov 3',  '1 John 1–5',            '1 John 4:7-8'],
  ['Nov 10', '2 John + 3 John',       '2 John 1:6'],
  ['Nov 17', 'Jude',                  'Jude 1:24-25'],
  ['Nov 24', 'Revelation 1–5',        'Revelation 1:8'],
  ['Dec 1',  'Revelation 6–11',       'Revelation 3:20'],
  ['Dec 8',  'Revelation 12–16',      'Revelation 12:11'],
  ['Dec 15', 'Revelation 17–22',      'Revelation 21:4'],
]

function parseDate(label: string, weekId: number): Date {
  // Week 1 starts Dec 30, 2025; remaining weeks roll into 2026/2027
  const baseYear = 2025
  const month = label.split(' ')[0]
  const day = parseInt(label.split(' ')[1], 10)
  const monthMap: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  }
  const m = monthMap[month]
  // Dec is year 2025; Jan+ is 2026; next Dec is still 2026
  const year = m === 11 ? baseYear : baseYear + 1
  return new Date(year, m, day)
}

function parseReading(reading: string) {
  const books: string[] = []
  if (reading.includes('+')) {
    reading.split('+').forEach(p => books.push(p.trim().split(' ')[0] || p.trim()))
  } else {
    // Extract book name (everything before the chapter dash)
    const match = reading.match(/^(.*?)\s+\d+/)
    books.push(match ? match[1] : reading)
  }
  const chapterMatch = reading.match(/(\d+[–-]\d+|\d+)$/)
  const chapters = chapterMatch ? `chapters ${chapterMatch[0]}` : ''
  return { books, chapters }
}

export const SCHEDULE: WeekEntry[] = RAW.map(([label, reading, memoryRef], idx) => {
  const { books, chapters } = parseReading(reading)
  const id = idx + 1
  const date = parseDate(label, id)

  // Format memory ref for display (e.g. Matthew 6:9-10)
  const memoryDisplay = memoryRef
    .replace(/(\d+)-(\d+)$/, '$1–$2')
    .replace(/(\d+):(\d+)/, '$1:$2')

  return {
    id,
    label,
    date,
    reading,
    readingBooks: books,
    readingChapters: chapters,
    memoryRef,
    memoryDisplay,
  }
})

/** Returns the current week based on today's date.
 *  If we're before the schedule starts, returns week 1.
 *  If we're after the schedule ends, returns the last week.
 */
export function getCurrentWeek(): WeekEntry {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let current = SCHEDULE[0]
  for (const week of SCHEDULE) {
    const weekStart = new Date(week.date)
    weekStart.setHours(0, 0, 0, 0)
    if (today >= weekStart) {
      current = week
    } else {
      break
    }
  }
  return current
}

/** True if today is Tuesday (day before Wednesday meeting) */
export function isMeetingTomorrow(): boolean {
  return new Date().getDay() === 2
}

/** True if today is Wednesday (meeting day) */
export function isMeetingToday(): boolean {
  return new Date().getDay() === 3
}

/** Format a verse reference for the bible-api.com URL */
export function refToApiSlug(ref: string): string {
  // "Matthew 6:9-10" -> "matthew+6:9-10"
  return ref.toLowerCase().replace(/\s+/g, '+').replace(/[–—]/g, '-')
}
