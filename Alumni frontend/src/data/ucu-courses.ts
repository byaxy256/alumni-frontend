// UCU Courses Database with Faculty, Degree Level, and Duration Mappings

export type DegreeLevel = 'diploma' | 'bachelor' | 'postgraduate';

export interface Course {
  name: string;
  faculty: string;
  degreeLevel: DegreeLevel;
  duration: 3 | 4; // years
}

export const UCU_FACULTIES = [
  'Faculty of Science & Technology',
  'Faculty of Business & Management',
  'Faculty of Education',
  'Faculty of Social Sciences',
  'Faculty of Theology',
] as const;

export const UCU_COURSES: Course[] = [
  // Faculty of Science & Technology - Bachelor Programs
  { name: 'Bachelor of Computer Science', faculty: 'Faculty of Science & Technology', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Software Engineering', faculty: 'Faculty of Science & Technology', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Information Technology', faculty: 'Faculty of Science & Technology', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Cybersecurity', faculty: 'Faculty of Science & Technology', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Data Science', faculty: 'Faculty of Science & Technology', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Physics', faculty: 'Faculty of Science & Technology', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Chemistry', faculty: 'Faculty of Science & Technology', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Biology', faculty: 'Faculty of Science & Technology', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Mathematics', faculty: 'Faculty of Science & Technology', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Environmental Science', faculty: 'Faculty of Science & Technology', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Engineering (Civil)', faculty: 'Faculty of Science & Technology', degreeLevel: 'bachelor', duration: 4 },
  { name: 'Bachelor of Engineering (Electrical)', faculty: 'Faculty of Science & Technology', degreeLevel: 'bachelor', duration: 4 },
  { name: 'Bachelor of Engineering (Mechanical)', faculty: 'Faculty of Science & Technology', degreeLevel: 'bachelor', duration: 4 },
  { name: 'Bachelor of Nursing', faculty: 'Faculty of Science & Technology', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Pharmacy', faculty: 'Faculty of Science & Technology', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Public Health', faculty: 'Faculty of Science & Technology', degreeLevel: 'bachelor', duration: 3 },
  
  // Faculty of Science & Technology - Diploma Programs
  { name: 'Diploma in Information Technology', faculty: 'Faculty of Science & Technology', degreeLevel: 'diploma', duration: 3 },
  { name: 'Diploma in Engineering (Civil)', faculty: 'Faculty of Science & Technology', degreeLevel: 'diploma', duration: 3 },
  { name: 'Diploma in Engineering (Electrical)', faculty: 'Faculty of Science & Technology', degreeLevel: 'diploma', duration: 3 },
  { name: 'Diploma in Nursing', faculty: 'Faculty of Science & Technology', degreeLevel: 'diploma', duration: 3 },
  { name: 'Diploma in Laboratory Science', faculty: 'Faculty of Science & Technology', degreeLevel: 'diploma', duration: 3 },

  // Faculty of Business & Management - Bachelor Programs
  { name: 'Bachelor of Business Administration', faculty: 'Faculty of Business & Management', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Accounting', faculty: 'Faculty of Business & Management', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Finance', faculty: 'Faculty of Business & Management', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Economics', faculty: 'Faculty of Business & Management', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Marketing', faculty: 'Faculty of Business & Management', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Management', faculty: 'Faculty of Business & Management', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Entrepreneurship', faculty: 'Faculty of Business & Management', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of International Business', faculty: 'Faculty of Business & Management', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Human Resource Management', faculty: 'Faculty of Business & Management', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Supply Chain Management', faculty: 'Faculty of Business & Management', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Tourism and Hospitality', faculty: 'Faculty of Business & Management', degreeLevel: 'bachelor', duration: 3 },
  
  // Faculty of Business & Management - Diploma Programs
  { name: 'Diploma in Business Administration', faculty: 'Faculty of Business & Management', degreeLevel: 'diploma', duration: 3 },
  { name: 'Diploma in Accounting', faculty: 'Faculty of Business & Management', degreeLevel: 'diploma', duration: 3 },
  { name: 'Diploma in Marketing', faculty: 'Faculty of Business & Management', degreeLevel: 'diploma', duration: 3 },

  // Faculty of Education - Bachelor Programs
  { name: 'Bachelor of Education (Primary)', faculty: 'Faculty of Education', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Education (Secondary)', faculty: 'Faculty of Education', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Education (Mathematics)', faculty: 'Faculty of Education', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Education (English)', faculty: 'Faculty of Education', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Education (Science)', faculty: 'Faculty of Education', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Education (Special Needs)', faculty: 'Faculty of Education', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Curriculum and Instruction', faculty: 'Faculty of Education', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Educational Leadership', faculty: 'Faculty of Education', degreeLevel: 'bachelor', duration: 3 },
  
  // Faculty of Education - Diploma Programs
  { name: 'Diploma in Primary Education', faculty: 'Faculty of Education', degreeLevel: 'diploma', duration: 3 },
  { name: 'Diploma in Secondary Education', faculty: 'Faculty of Education', degreeLevel: 'diploma', duration: 3 },

  // Faculty of Social Sciences - Bachelor Programs
  { name: 'Bachelor of Law', faculty: 'Faculty of Social Sciences', degreeLevel: 'bachelor', duration: 4 },
  { name: 'Bachelor of Social Work', faculty: 'Faculty of Social Sciences', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Sociology', faculty: 'Faculty of Social Sciences', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Psychology', faculty: 'Faculty of Social Sciences', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Political Science', faculty: 'Faculty of Social Sciences', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Anthropology', faculty: 'Faculty of Social Sciences', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of History', faculty: 'Faculty of Social Sciences', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Geography', faculty: 'Faculty of Social Sciences', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Communication & Media Studies', faculty: 'Faculty of Social Sciences', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Development Studies', faculty: 'Faculty of Social Sciences', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Public Administration', faculty: 'Faculty of Social Sciences', degreeLevel: 'bachelor', duration: 3 },
  
  // Faculty of Social Sciences - Diploma Programs
  { name: 'Diploma in Social Work', faculty: 'Faculty of Social Sciences', degreeLevel: 'diploma', duration: 3 },
  { name: 'Diploma in Public Administration', faculty: 'Faculty of Social Sciences', degreeLevel: 'diploma', duration: 3 },

  // Faculty of Theology - Bachelor Programs
  { name: 'Bachelor of Theology', faculty: 'Faculty of Theology', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Divinity', faculty: 'Faculty of Theology', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Religious Studies', faculty: 'Faculty of Theology', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Christian Education', faculty: 'Faculty of Theology', degreeLevel: 'bachelor', duration: 3 },
  { name: 'Bachelor of Pastoral Studies', faculty: 'Faculty of Theology', degreeLevel: 'bachelor', duration: 3 },
  
  // Faculty of Theology - Diploma Programs
  { name: 'Diploma in Theology', faculty: 'Faculty of Theology', degreeLevel: 'diploma', duration: 3 },
];

/**
 * Get faculty by course name
 */
export function getFacultyByProgram(programName: string): string {
  const course = UCU_COURSES.find(c => c.name === programName);
  return course?.faculty || '';
}

/**
 * Get duration by course name
 */
export function getDurationByProgram(programName: string): 3 | 4 {
  const course = UCU_COURSES.find(c => c.name === programName);
  return course?.duration || 3;
}

/**
 * Get all courses for a specific faculty
 */
export function getCoursesByFaculty(faculty: string): Course[] {
  return UCU_COURSES.filter(c => c.faculty === faculty);
}

/**
 * Get all courses for a specific degree level
 */
export function getCoursesByDegreeLevel(degreeLevel: DegreeLevel): Course[] {
  return UCU_COURSES.filter(c => c.degreeLevel === degreeLevel);
}

/**
 * Get all courses for a specific faculty and degree level
 */
export function getCoursesByFacultyAndLevel(faculty: string, degreeLevel: DegreeLevel): Course[] {
  return UCU_COURSES.filter(c => c.faculty === faculty && c.degreeLevel === degreeLevel);
}

/**
 * Get all unique degree levels available
 */
export function getAvailableDegreeLevels(): DegreeLevel[] {
  const levels = new Set<DegreeLevel>();
  UCU_COURSES.forEach(c => levels.add(c.degreeLevel));
  return Array.from(levels);
}
