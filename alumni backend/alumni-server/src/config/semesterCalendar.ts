// src/config/semesterCalendar.ts - UCU Semester calendar and grace period logic

export type SemesterType = 'ADVENT' | 'EASTER' | 'TRINITY';

export interface Semester {
    id: string; // "2026-ADVENT" format
    year: number;
    type: SemesterType;
    startDate: Date;
    endDate: Date;
    registrationDeadline: Date;
    tuitionPaymentDeadline: Date;
    examStartDate: Date;
    nextSemesterId: string;
}

/**
 * UCU Academic Calendar
 * - Advent Semester: September
 * - Easter Semester: January
 * - Trinity Semester: May
 * - 17-week semesters (15 weeks teaching + 2 weeks exams)
 * - Grace period: Loan taken in Semester X must be paid by start of Semester X+1
 */
export const SEMESTERS: Semester[] = [
    // 2025 Semesters
    {
        id: '2025-TRINITY',
        year: 2025,
        type: 'TRINITY',
        startDate: new Date('2025-05-12'),
        endDate: new Date('2025-08-31'),
        registrationDeadline: new Date('2025-05-12'),
        tuitionPaymentDeadline: new Date('2025-06-30'),
        examStartDate: new Date('2025-08-04'),
        nextSemesterId: '2025-ADVENT',
    },
    {
        id: '2025-ADVENT',
        year: 2025,
        type: 'ADVENT',
        startDate: new Date('2025-09-08'),
        endDate: new Date('2025-12-21'),
        registrationDeadline: new Date('2025-09-08'),
        tuitionPaymentDeadline: new Date('2025-10-31'),
        examStartDate: new Date('2025-11-24'),
        nextSemesterId: '2026-EASTER',
    },
    
    // 2026 Semesters
    {
        id: '2026-EASTER',
        year: 2026,
        type: 'EASTER',
        startDate: new Date('2026-01-12'),
        endDate: new Date('2026-04-30'),
        registrationDeadline: new Date('2026-01-12'),
        tuitionPaymentDeadline: new Date('2026-02-28'),
        examStartDate: new Date('2026-04-13'),
        nextSemesterId: '2026-TRINITY',
    },
    {
        id: '2026-TRINITY',
        year: 2026,
        type: 'TRINITY',
        startDate: new Date('2026-05-11'),
        endDate: new Date('2026-08-30'),
        registrationDeadline: new Date('2026-05-11'),
        tuitionPaymentDeadline: new Date('2026-06-30'),
        examStartDate: new Date('2026-08-03'),
        nextSemesterId: '2026-ADVENT',
    },
    {
        id: '2026-ADVENT',
        year: 2026,
        type: 'ADVENT',
        startDate: new Date('2026-09-07'),
        endDate: new Date('2026-12-20'),
        registrationDeadline: new Date('2026-09-07'),
        tuitionPaymentDeadline: new Date('2026-10-31'),
        examStartDate: new Date('2026-11-23'),
        nextSemesterId: '2027-EASTER',
    },
    
    // 2027 Semesters
    {
        id: '2027-EASTER',
        year: 2027,
        type: 'EASTER',
        startDate: new Date('2027-01-11'),
        endDate: new Date('2027-04-29'),
        registrationDeadline: new Date('2027-01-11'),
        tuitionPaymentDeadline: new Date('2027-02-28'),
        examStartDate: new Date('2027-04-12'),
        nextSemesterId: '2027-TRINITY',
    },
    {
        id: '2027-TRINITY',
        year: 2027,
        type: 'TRINITY',
        startDate: new Date('2027-05-10'),
        endDate: new Date('2027-08-29'),
        registrationDeadline: new Date('2027-05-10'),
        tuitionPaymentDeadline: new Date('2027-06-30'),
        examStartDate: new Date('2027-08-02'),
        nextSemesterId: '2027-ADVENT',
    },
    {
        id: '2027-ADVENT',
        year: 2027,
        type: 'ADVENT',
        startDate: new Date('2027-09-06'),
        endDate: new Date('2027-12-19'),
        registrationDeadline: new Date('2027-09-06'),
        tuitionPaymentDeadline: new Date('2027-10-31'),
        examStartDate: new Date('2027-11-22'),
        nextSemesterId: '2028-EASTER',
    },
];

/**
 * Get current semester based on date
 */
export function getCurrentSemester(date: Date = new Date()): Semester | null {
    return SEMESTERS.find(s => date >= s.startDate && date <= s.endDate) || null;
}

/**
 * Get semester by ID
 */
export function getSemesterById(id: string): Semester | null {
    return SEMESTERS.find(s => s.id === id) || null;
}

/**
 * Get next semester after given semester
 */
export function getNextSemester(semesterId: string): Semester | null {
    const semester = getSemesterById(semesterId);
    if (!semester) return null;
    return getSemesterById(semester.nextSemesterId) || null;
}

/**
 * Check if a loan is overdue
 * Loan taken in Semester X must be paid by start of Semester X+1
 */
export function isLoanOverdue(loanCreatedDate: Date, currentDate: Date = new Date()): boolean {
    const loanSemester = SEMESTERS.find(s => loanCreatedDate >= s.startDate && loanCreatedDate <= s.endDate);
    if (!loanSemester) return false;
    
    const nextSemester = getNextSemester(loanSemester.id);
    if (!nextSemester) return false;
    
    // Loan is overdue if we're past the start of the next semester
    return currentDate >= nextSemester.startDate;
}

/**
 * Get grace period end date for a loan
 * Returns the start date of the next semester
 */
export function getGracePeriodEndDate(loanCreatedDate: Date): Date | null {
    const loanSemester = SEMESTERS.find(s => loanCreatedDate >= s.startDate && loanCreatedDate <= s.endDate);
    if (!loanSemester) return null;
    
    const nextSemester = getNextSemester(loanSemester.id);
    return nextSemester?.startDate || null;
}

/**
 * Get semester ID from date
 */
export function getSemesterIdFromDate(date: Date): string | null {
    const semester = getCurrentSemester(date);
    return semester?.id || null;
}

/**
 * Format semester for display
 */
export function formatSemester(semesterId: string): string {
    const semester = getSemesterById(semesterId);
    if (!semester) return semesterId;
    return `${semester.type} ${semester.year}`;
}
