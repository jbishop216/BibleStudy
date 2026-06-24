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
  // ── Updated schedule (new readings from June 10 onward) ──────────────────────
  ['June 10',      'Romans 4, Romans 5, Romans 6, Romans 7, Romans 8',                                                'Matthew 5:47-48'],
  ['June 17',      'Romans 9, Romans 10, Romans 11, Romans 12, Romans 13',                                             'Romans 3:23'],
  ['June 24',      'Romans 14, Romans 15, Romans 16',                                                                  'Romans 5:8'],
  ['July 1',       'Colossians 1, Colossians 2, Colossians 3, Colossians 4',                                           'Romans 6:23'],
  ['July 8',       'Ephesians 1, Ephesians 2, Ephesians 3, Ephesians 4, Ephesians 5, Ephesians 6',                    'Romans 10:9'],
  ['July 15',      'Philippians 1, Philippians 2, Philippians 3, Philippians 4',                                       'Romans 10:9'],
  ['July 22',      'Hebrews 1, Hebrews 2, Hebrews 3, Hebrews 4, Hebrews 5, Hebrews 6',                               'Romans 10:9'],
  ['July 29',      'Hebrews 7, Hebrews 8, Hebrews 9, Hebrews 10, Hebrews 11, Hebrews 12, Hebrews 13',                'Romans 10:9'],
  ['August 5',     '1 Timothy 1, 1 Timothy 2, 1 Timothy 3, 1 Timothy 4, 1 Timothy 5, 1 Timothy 6',                   'Romans 10:9'],
  ['August 12',    '2 Timothy 1, 2 Timothy 2, 2 Timothy 3, 2 Timothy 4',                                               'Romans 10:9'],
  ['August 19',    'Titus 1, Titus 2, Titus 3, Philemon, Jude',                                                       'Romans 10:9'],
  ['August 26',    '1 Peter 1, 1 Peter 2, 1 Peter 3, 1 Peter 4, 1 Peter 5',                                           'Romans 10:9'],
  ['September 2',  '2 Peter 1, 2 Peter 2, 2 Peter 3',                                                                 'Romans 10:9'],
  ['September 9',  'John 1, John 2, John 3, John 4, John 5',                                                           'Romans 10:9'],
  ['September 16', 'John 6, John 7, John 8, John 9, John 10',                                                          'Romans 10:9'],
  ['September 23', 'John 11, John 12, John 13, John 14, John 15',                                                      'Romans 10:9'],
  ['September 30', 'John 16, John 17, John 18, John 19, John 20, John 21',                                            'Romans 10:9'],
  ['October 7',    '1 John 1, 1 John 2, 1 John 3, 1 John 4, 1 John 5',                                               'Romans 10:9'],
  ['October 14',   'Matthew 1, Matthew 2, Matthew 3, Matthew 4, Matthew 5',                                            'Romans 10:9'],
  ['October 21',   'Matthew 6, Matthew 7, Matthew 8, Matthew 9, Matthew 10',                                           'Romans 10:9'],
  ['October 28',   'Matthew 11, Matthew 12, Matthew 13, Matthew 14, Matthew 15',                                       'Romans 10:9'],
  ['November 4',   'Matthew 16, Matthew 17, Matthew 18, Matthew 19, Matthew 20',                                       'Romans 10:9'],
  ['November 11',  'Matthew 21, Matthew 22, Matthew 23, Matthew 24, Matthew 25',                                       'Romans 10:9'],
  ['November 18',  'Matthew 26, Matthew 27, Matthew 28, Revelation 21, Revelation 22',                                 'Romans 10:9'],
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

/** Returns the current week based on today's date.
 *
 *  The date in the schedule marks when you START STUDYING FOR THE NEXT WEEK.
 *  So the "current" active week is always one behind the last date that has
 *  passed. Example: April 14 triggers week-16 study, meaning week 15 is the
 *  current/active meeting week.
 */
export function getCurrentWeek(): WeekEntry {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let foundIdx = 0
  for (let i = 0; i < SCHEDULE.length; i++) {
    const weekStart = new Date(SCHEDULE[i].date)
    weekStart.setHours(0, 0, 0, 0)
    if (today >= weekStart) foundIdx = i
    else break
  }

  // One week back — the date that just passed marks the start of NEXT week's
  // study, so the current meeting week is the previous entry.
  const currentIdx = Math.max(0, foundIdx - 1)
  return SCHEDULE[currentIdx]
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
