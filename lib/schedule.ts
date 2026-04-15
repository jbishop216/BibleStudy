export interface WeekEntry {
  id: number           // 1-based week number
  label: string        // e.g. "December 30"
  date: Date           // calendar date of that Monday
  reading: string      // full display string, e.g. "Luke 1, Luke 2, ..."
  chapters: string[]   // individual chapter refs, e.g. ["Luke 1", "Luke 2", ...]
  memoryRef: string    // e.g. "Matthew 5:1-2"
  memoryDisplay: string
}

// ─── Raw schedule data ────────────────────────────────────────────────────────
// Format: [date label, comma-separated chapters, memory verse ref]
const RAW: [string, string, string][] = [
  ['December 30',  'Luke 1, Luke 2, Luke 3, Luke 4, Luke 5',                                           'Matthew 5:1-2'],
  ['January 6',    'Luke 6, Luke 7, Luke 8, Luke 9, Luke 10',                                          'Matthew 5:3-4'],
  ['January 13',   'Luke 11, Luke 12, Luke 13, Luke 14, Luke 15',                                      'Matthew 5:5-6'],
  ['January 20',   'Luke 16, Luke 17, Luke 18, Luke 19, Luke 20',                                      'Matthew 5:7-8'],
  ['January 27',   'Luke 21, Luke 22, Luke 23, Luke 24, Acts 1',                                       'Matthew 5:9-10'],
  ['February 3',   'Acts 2, Acts 3, Acts 4, Acts 5, Acts 6',                                           'Matthew 5:11-12'],
  ['February 10',  'Acts 7, Acts 8, Acts 9, Acts 10, Acts 11',                                         'Matthew 5:13-14'],
  ['February 17',  'Acts 12, Acts 13, Acts 14, James 1, James 2',                                      'Matthew 5:15-16'],
  ['February 24',  'James 3, James 4, James 5, Acts 15, Acts 16',                                      'Matthew 5:17-18'],
  ['March 3',      'Galatians 1, Galatians 2, Galatians 3, Galatians 4, Galatians 5',                 'Matthew 5:19-20'],
  ['March 10',     'Galatians 6, Acts 17, Acts 18, 1 Thessalonians 1, 1 Thessalonians 2',              'Matthew 5:21-22'],
  ['March 17',     '1 Thessalonians 3, 1 Thessalonians 4, 1 Thessalonians 5, 2 Thessalonians 1, 2 Thessalonians 2', 'Matthew 5:23-24'],
  ['March 24',     '2 Thessalonians 3, Acts 19, 1 Corinthians 1, 1 Corinthians 2, 1 Corinthians 3',   'Matthew 5:25-26'],
  ['March 31',     '1 Corinthians 4, 1 Corinthians 5, 1 Corinthians 6, 1 Corinthians 7, 1 Corinthians 8', 'Matthew 5:27-28'],
  ['April 7',      '1 Corinthians 9, 1 Corinthians 10, 1 Corinthians 11, 1 Corinthians 12, 1 Corinthians 13', 'Matthew 5:29-30'],
  ['April 14',     '1 Corinthians 14, 1 Corinthians 15, 1 Corinthians 16, 2 Corinthians 1, 2 Corinthians 2', 'Matthew 5:31-32'],
  ['April 21',     '2 Corinthians 3, 2 Corinthians 4, 2 Corinthians 5, 2 Corinthians 6, 2 Corinthians 7', 'Matthew 5:33-35'],
  ['April 28',     '2 Corinthians 8, 2 Corinthians 9, 2 Corinthians 10, 2 Corinthians 11, 2 Corinthians 12', 'Matthew 5:36-37'],
  ['May 5',        '2 Corinthians 13, Mark 1, Mark 2, Mark 3, Mark 4',                                 'Matthew 5:38-39'],
  ['May 12',       'Mark 5, Mark 6, Mark 7, Mark 8, Mark 9',                                           'Matthew 5:40-42'],
  ['May 19',       'Mark 10, Mark 11, Mark 12, Mark 13, Mark 14',                                      'Matthew 5:43-44'],
  ['May 26',       'Mark 15, Mark 16, Romans 1, Romans 2, Romans 3',                                   'Matthew 5:45-46'],
  ['June 2',       'Romans 4, Romans 5, Romans 6, Romans 7, Romans 8',                                 'Matthew 5:47-48'],
  ['June 9',       'Romans 9, Romans 10, Romans 11, Romans 12, Romans 13',                              'Matthew 6:1-2'],
  ['June 16',      'Romans 14, Romans 15, Romans 16, Acts 20, Acts 21',                                 'Matthew 6:3-4'],
  ['June 23',      'Acts 22, Acts 23, Acts 24, Acts 25, Acts 26',                                       'Matthew 6:5-6'],
  ['June 30',      'Acts 27, Acts 28, Colossians 1, Colossians 2, Colossians 3',                        'Matthew 6:7-8'],
  ['July 7',       'Colossians 4, Ephesians 1, Ephesians 2, Ephesians 3, Ephesians 4',                 'Matthew 6:9-11'],
  ['July 14',      'Ephesians 5, Ephesians 6, Philippians 1, Philippians 2, Philippians 3',             'Matthew 6:12-13'],
  ['July 21',      'Philippians 4, Philemon, Hebrews 1, Hebrews 2, Hebrews 3',                         'Matthew 6:14-15'],
  ['July 28',      'Hebrews 4, Hebrews 5, Hebrews 6, Hebrews 7, Hebrews 8',                           'Matthew 6:16-18'],
  ['August 4',     'Hebrews 9, Hebrews 10, Hebrews 11, Hebrews 12, Hebrews 13',                       'Matthew 6:19-21'],
  ['August 11',    '1 Timothy 1, 1 Timothy 2, 1 Timothy 3, 1 Timothy 4, 1 Timothy 5',                 'Matthew 6:22-24'],
  ['August 18',    '1 Timothy 6, 2 Timothy 1, 2 Timothy 2, 2 Timothy 3, 2 Timothy 4',                 'Matthew 6:25-26'],
  ['August 25',    'Titus 1, Titus 2, Titus 3, 1 Peter 1, 1 Peter 2',                                 'Matthew 6:27-28'],
  ['September 1',  '1 Peter 3, 1 Peter 4, 1 Peter 5, 2 Peter 1, 2 Peter 2',                           'Matthew 6:29-30'],
  ['September 8',  '2 Peter 3, John 1, John 2, John 3, John 4',                                        'Matthew 6:31-32'],
  ['September 15', 'John 5, John 6, John 7, John 8, John 9',                                           'Matthew 6:33-34'],
  ['September 22', 'John 10, John 11, John 12, John 13, John 14',                                      'Matthew 7:1-2'],
  ['September 29', 'John 15, John 16, John 17, John 18, John 19',                                      'Matthew 7:3-4'],
  ['October 6',    'John 20, John 21, 1 John 1, 1 John 2, 1 John 3',                                  'Matthew 7:5-6'],
  ['October 13',   '1 John 4, 1 John 5, 2 John, 3 John, Jude',                                        'Matthew 7:7-8'],
  ['October 20',   'Revelation 1, Revelation 2, Revelation 3, Revelation 4, Revelation 5',              'Matthew 7:9-10'],
  ['October 27',   'Revelation 6, Revelation 7, Revelation 8, Revelation 9, Revelation 10',             'Matthew 7:11-12'],
  ['November 3',   'Revelation 11, Revelation 12, Revelation 13, Revelation 14, Revelation 15',         'Matthew 7:13-14'],
  ['November 10',  'Revelation 16, Revelation 17, Revelation 18, Revelation 19, Revelation 20',         'Matthew 7:15-16'],
  ['November 17',  'Revelation 21, Revelation 22, Matthew 1, Matthew 2, Matthew 3',                     'Matthew 7:17-18'],
  ['November 24',  'Matthew 4, Matthew 5, Matthew 6, Matthew 7, Matthew 8',                             'Matthew 7:19-20'],
  ['December 1',   'Matthew 9, Matthew 10, Matthew 11, Matthew 12, Matthew 13',                         'Matthew 7:21-23'],
  ['December 8',   'Matthew 14, Matthew 15, Matthew 16, Matthew 17, Matthew 18',                        'Matthew 7:24-25'],
  ['December 15',  'Matthew 19, Matthew 20, Matthew 21, Matthew 22, Matthew 23',                        'Matthew 7:26-27'],
  ['December 22',  'Matthew 24, Matthew 25, Matthew 26, Matthew 27, Matthew 28',                        'Matthew 7:28-29'],
]

// ─── Date parsing ─────────────────────────────────────────────────────────────
const MONTH_MAP: Record<string, number> = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
}

function parseDate(label: string): Date {
  const [monthName, dayStr] = label.split(' ')
  const month = MONTH_MAP[monthName]
  const day = parseInt(dayStr, 10)
  // Dec 30 = start of schedule in 2025; all other months are 2026
  const year = month === 11 && day >= 22 ? 2025 : 2026
  return new Date(year, month, day)
}

// ─── Build schedule ───────────────────────────────────────────────────────────
export const SCHEDULE: WeekEntry[] = RAW.map(([label, chaptersStr, memoryRef], idx) => {
  const chapters = chaptersStr.split(',').map(s => s.trim())
  const reading = chaptersStr  // use as-is for display
  const memoryDisplay = memoryRef.replace(/(\d+)-(\d+)$/, '$1–$2')

  return {
    id: idx + 1,
    label,
    date: parseDate(label),
    reading,
    chapters,
    memoryRef,
    memoryDisplay,
  }
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the current week based on today's date */
export function getCurrentWeek(): WeekEntry {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let current = SCHEDULE[0]
  for (const week of SCHEDULE) {
    const weekStart = new Date(week.date)
    weekStart.setHours(0, 0, 0, 0)
    if (today >= weekStart) current = week
    else break
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

/** Normalize a chapter reference for bible-api.com */
export function chapterToApiSlug(ref: string): string {
  return encodeURIComponent(ref.toLowerCase().trim())
}
