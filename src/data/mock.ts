// Sample data taken from the Figma prototype. All names and records are fictional.

export type Rag = 'red' | 'amber' | 'green' | 'grey'
export type EncounterStatus = 'open' | 'returned' | 'ready' | 'coded'
export type TaskStatus = 'todo' | 'progress' | 'waiting' | 'done'
export type Role = 'provider' | 'nurse' | 'coder'

export interface Patient {
  id: string
  name: string
  initials: string
  mrn: string
  age: number
  sex: string
  dob: string
  plan: string
  pcp: string
  acuity: string
  town: string
  address: string
  phone: string
  codeStatus?: string
  safety?: string
}

export interface Encounter {
  id: string
  patientId: string
  type: string
  date: string
  status: EncounterStatus
  done: number
  nextStep: string
  closesIn?: string
}

export interface CodingNote {
  id: string
  encounterId: string
  author: string
  authorInitials: string
  date: string
  title: string
  body: string
  section: string
  resolved: boolean
}

export interface CareGap {
  patientId: string
  priority: 'High' | 'Moderate' | 'Low'
  carePlan: number
  bp: number
  retinopathy: number
  digoxin: number
  diuretic: number
  lastReview: string
  acuity: 'A' | 'B' | 'C'
  lastVisitDays: number
}

export interface Task {
  id: string
  title: string
  patientId: string
  status: TaskStatus
  due: string
  owner: string
  note?: string
}

export interface Visit {
  id: string
  day: number // 0 = Mon 16 Jan
  start: string
  minutes: number
  patientId: string
  type: string
  town: string
  flag?: string
  done?: boolean
}

export interface Notification {
  id: string
  title: string
  body: string
  time: string
  to: string
  unread: boolean
}

export const patients: Patient[] = [
  { id: 'js', name: 'John Smith', initials: 'JS', mrn: '1234567890', age: 85, sex: 'Male', dob: '21 Mar 1931', plan: 'BlueCross TPA', pcp: 'Dr Carla Camio', acuity: 'A', town: 'Amherst', address: '12 Oak Ridge Rd, Amherst', phone: '(716) 555 0142', codeStatus: 'DNR', safety: 'Unsafe after hours' },
  { id: 'jsu', name: 'John Susliet', initials: 'JS', mrn: '1010453', age: 56, sex: 'Male', dob: '02 Feb 1960', plan: 'Medicare Advantage', pcp: 'Dr Michael Wong', acuity: 'B', town: 'Buffalo', address: '88 Elmwood Ave, Buffalo', phone: '(716) 555 0193' },
  { id: 'mj', name: 'Martin Jackson', initials: 'MJ', mrn: '1010455', age: 72, sex: 'Male', dob: '14 Jul 1944', plan: 'Medicare Advantage', pcp: 'Dr Michael Wong', acuity: 'B', town: 'Cheektowaga', address: '5 Harlem Rd, Cheektowaga', phone: '(716) 555 0120' },
  { id: 'as', name: 'Allen Sanchez', initials: 'AS', mrn: '1010457', age: 68, sex: 'Male', dob: '03 Nov 1948', plan: 'Medicaid', pcp: 'Dr Michael Wong', acuity: 'B', town: 'Kenmore', address: '41 Delaware Rd, Kenmore', phone: '(716) 555 0171' },
  { id: 'wj', name: 'William Jones', initials: 'WJ', mrn: '1010454', age: 79, sex: 'Male', dob: '22 Jan 1938', plan: 'Medicare Advantage', pcp: 'Dr Michael Wong', acuity: 'B', town: 'Kenmore', address: '19 Victoria Blvd, Kenmore', phone: '(716) 555 0110' },
  { id: 'an', name: 'Adam Nelson', initials: 'AN', mrn: '1010459', age: 81, sex: 'Male', dob: '09 Sep 1935', plan: 'Medicare Advantage', pcp: 'Dr Michael Wong', acuity: 'B', town: 'Tonawanda', address: '7 Brighton Rd, Tonawanda', phone: '(716) 555 0156' },
  { id: 'cl', name: 'Clark Lewis', initials: 'CL', mrn: '1010456', age: 77, sex: 'Male', dob: '11 Apr 1939', plan: 'Medicare Advantage', pcp: 'Dr Michael Wong', acuity: 'B', town: 'Lockport', address: '3 Locust St, Lockport', phone: '(716) 555 0133' },
  { id: 'cc', name: 'Chris Campbell', initials: 'CC', mrn: '1010462', age: 74, sex: 'Male', dob: '30 May 1942', plan: 'Medicare Advantage', pcp: 'Dr Michael Wong', acuity: 'B', town: 'Lockport', address: '48 Market St, Lockport', phone: '(716) 555 0188', codeStatus: 'DNR', safety: 'Escort after hours' },
  { id: 'sg', name: 'Scott Green', initials: 'SG', mrn: '1010458', age: 70, sex: 'Male', dob: '18 Aug 1946', plan: 'Medicare Advantage', pcp: 'Dr Michael Wong', acuity: 'B', town: 'Kenmore', address: '60 Parkwood Ave, Kenmore', phone: '(716) 555 0102' },
  { id: 'rw', name: 'Rossalyn Warren', initials: 'RW', mrn: '1010461', age: 83, sex: 'Female', dob: '05 Dec 1933', plan: 'Medicare Advantage', pcp: 'Dr Michael Wong', acuity: 'A', town: 'Amherst', address: '22 Maple Rd, Amherst', phone: '(716) 555 0177' },
  { id: 'mja', name: 'Michael James', initials: 'MJ', mrn: '1010463', age: 66, sex: 'Male', dob: '12 Mar 1950', plan: 'Medicaid', pcp: 'Dr Michael Wong', acuity: 'C', town: 'Tonawanda', address: '14 Niagara St, Tonawanda', phone: '(716) 555 0119' },
  { id: 'ok', name: 'Olga Khazan', initials: 'OK', mrn: '1010464', age: 88, sex: 'Female', dob: '27 Jun 1928', plan: 'Medicare Advantage', pcp: 'Dr Michael Wong', acuity: 'A', town: 'Buffalo', address: '9 Linwood Ave, Buffalo', phone: '(716) 555 0164' },
  { id: 'gl', name: 'Grace Lee', initials: 'GL', mrn: '1010465', age: 71, sex: 'Female', dob: '01 Oct 1945', plan: 'Medicare Advantage', pcp: 'Dr Michael Wong', acuity: 'B', town: 'Kenmore', address: '30 Colvin Blvd, Kenmore', phone: '(716) 555 0108' },
  { id: 'rd', name: 'Rosa Diaz', initials: 'RD', mrn: '1010466', age: 69, sex: 'Female', dob: '19 Feb 1947', plan: 'Medicaid', pcp: 'Dr Michael Wong', acuity: 'B', town: 'Buffalo', address: '71 Grant St, Buffalo', phone: '(716) 555 0126' },
]

export const patientById = (id: string) => patients.find((p) => p.id === id) as Patient

export const encounters: Encounter[] = [
  { id: 'e1', patientId: 'jsu', type: 'Maintenance visit', date: '21 Jun 2016', status: 'open', done: 7, nextStep: 'Resume', closesIn: '4 hrs left' },
  { id: 'e2', patientId: 'mj', type: 'Maintenance visit', date: '21 Sep 2016', status: 'returned', done: 15, nextStep: 'Add CKD stage' },
  { id: 'e3', patientId: 'as', type: 'Informational visit', date: '31 Aug 2016', status: 'returned', done: 15, nextStep: 'Link diabetes' },
  { id: 'e4', patientId: 'wj', type: 'Telephonic visit', date: '10 Jun 2016', status: 'ready', done: 15, nextStep: 'With coder' },
  { id: 'e5', patientId: 'an', type: 'Maintenance visit', date: '21 Jun 2016', status: 'ready', done: 15, nextStep: 'With coder' },
  { id: 'e6', patientId: 'cl', type: 'Annual visit', date: '18 Jun 2016', status: 'ready', done: 15, nextStep: 'With coder' },
  { id: 'e7', patientId: 'sg', type: 'Maintenance visit', date: '14 Jun 2016', status: 'open', done: 11, nextStep: 'Finish plan', closesIn: '2 days left' },
  { id: 'e8', patientId: 'cc', type: 'Annual visit', date: '09 Jun 2016', status: 'ready', done: 15, nextStep: 'With coder' },
  { id: 'e9', patientId: 'rw', type: 'Annual visit', date: '02 Jun 2016', status: 'coded', done: 15, nextStep: 'Done' },
  { id: 'e10', patientId: 'gl', type: 'Follow-up', date: '28 May 2016', status: 'ready', done: 15, nextStep: 'With coder' },
  { id: 'e11', patientId: 'rd', type: 'Maintenance visit', date: '24 May 2016', status: 'open', done: 3, nextStep: 'Resume', closesIn: '5 days left' },
  { id: 'e12', patientId: 'ok', type: 'Urgent visit', date: '20 May 2016', status: 'coded', done: 15, nextStep: 'Done' },
  { id: 'e13', patientId: 'mja', type: 'Maintenance visit', date: '17 May 2016', status: 'coded', done: 15, nextStep: 'Done' },
  { id: 'e14', patientId: 'js', type: 'Maintenance visit', date: '05 Jan 2017', status: 'coded', done: 15, nextStep: 'Done' },
  { id: 'e15', patientId: 'js', type: 'Annual visit', date: '20 Oct 2016', status: 'coded', done: 15, nextStep: 'Done' },
  { id: 'e16', patientId: 'cl', type: 'Telephonic visit', date: '12 May 2016', status: 'coded', done: 15, nextStep: 'Done' },
]

export const codingNotes: CodingNote[] = [
  { id: 'n1', encounterId: 'e2', author: 'Coder 1', authorInitials: 'C1', date: '30 Dec 2016', title: 'Missing CKD stage', body: 'CKD is documented without a stage. Add the stage, or state it is unknown or pending labs.', section: 'Assessment and plan', resolved: false },
  { id: 'n2', encounterId: 'e2', author: 'Dr Michael Wong', authorInitials: 'MW', date: '29 Dec 2016', title: 'Diabetic without linkage', body: 'Linked diabetes to its complication.', section: 'Diagnosis assessment', resolved: true },
  { id: 'n3', encounterId: 'e3', author: 'Coder 2', authorInitials: 'C2', date: '02 Jan 2017', title: 'Diabetes not linked', body: 'Type 2 diabetes is listed without a linked complication or control status. Link it to the right section.', section: 'Diagnosis assessment', resolved: false },
]

export const encounterNoteSections = [
  { name: 'History of present illness', text: 'Reason for visit: cough, abdominal pain, anxiety. Barking cough at night for two nights.' },
  { name: 'Past medical history', text: 'Chronic kidney disease, hypertension, cataract, osteoarthritis, pneumonia.' },
  { name: 'Review of systems', text: 'Blurry vision, sore throat, tinnitus, chest pain, dyspnoea on exertion.' },
  { name: 'Assessment and plan', text: 'Chronic kidney disease. Continue therapy, patient education, refer to dietician.\nHypertension, unstable. Modify therapy, follow up with PCP.' },
  { name: 'Diagnosis assessment', text: 'Diabetes: plan suspect, recapture with insulin use.' },
]

export const careGaps: CareGap[] = [
  { patientId: 'mj', priority: 'High', carePlan: 2, bp: 6, retinopathy: 0, digoxin: 6, diuretic: 0, lastReview: '11 Feb 2016', acuity: 'B', lastVisitDays: 12 },
  { patientId: 'as', priority: 'Low', carePlan: 1, bp: 6, retinopathy: 0, digoxin: 6, diuretic: 0, lastReview: '11 Feb 2016', acuity: 'B', lastVisitDays: 20 },
  { patientId: 'wj', priority: 'Moderate', carePlan: 2, bp: 5, retinopathy: 0, digoxin: 5, diuretic: 0, lastReview: '11 Feb 2016', acuity: 'B', lastVisitDays: 8 },
  { patientId: 'cl', priority: 'High', carePlan: 2, bp: 3, retinopathy: 0, digoxin: 3, diuretic: 0, lastReview: '11 Feb 2016', acuity: 'B', lastVisitDays: 27 },
  { patientId: 'cc', priority: 'High', carePlan: 1, bp: 3, retinopathy: 0, digoxin: 3, diuretic: 0, lastReview: '09 Sep 2016', acuity: 'B', lastVisitDays: 4 },
  { patientId: 'sg', priority: 'Moderate', carePlan: 1, bp: 2, retinopathy: 0, digoxin: 2, diuretic: 0, lastReview: '11 Feb 2016', acuity: 'B', lastVisitDays: 15 },
  { patientId: 'jsu', priority: 'High', carePlan: 1, bp: 1, retinopathy: 0, digoxin: 1, diuretic: 0, lastReview: '11 Feb 2016', acuity: 'B', lastVisitDays: 2 },
  { patientId: 'an', priority: 'Moderate', carePlan: 2, bp: 0, retinopathy: 0, digoxin: 0, diuretic: 0, lastReview: '11 Feb 2016', acuity: 'B', lastVisitDays: 22 },
  { patientId: 'js', priority: 'High', carePlan: 1, bp: 4, retinopathy: 1, digoxin: 2, diuretic: 1, lastReview: '05 Jan 2017', acuity: 'A', lastVisitDays: 11 },
  { patientId: 'rw', priority: 'Moderate', carePlan: 0, bp: 1, retinopathy: 2, digoxin: 0, diuretic: 0, lastReview: '02 Jun 2016', acuity: 'A', lastVisitDays: 45 },
  { patientId: 'ok', priority: 'High', carePlan: 2, bp: 5, retinopathy: 0, digoxin: 0, diuretic: 3, lastReview: '20 May 2016', acuity: 'A', lastVisitDays: 52 },
  { patientId: 'gl', priority: 'Low', carePlan: 0, bp: 1, retinopathy: 0, digoxin: 0, diuretic: 0, lastReview: '28 May 2016', acuity: 'B', lastVisitDays: 33 },
]

export const tasks: Task[] = [
  { id: 't1', title: 'Update home access notes', patientId: 'an', status: 'todo', due: 'Wed 18', owner: 'YO' },
  { id: 't2', title: 'Close diabetic eye exam gap', patientId: 'wj', status: 'todo', due: 'Tue 24', owner: 'KW' },
  { id: 't3', title: 'Renew oxygen authorisation', patientId: 'js', status: 'todo', due: 'Sat 28', owner: 'FD' },
  { id: 't4', title: 'Review returned note', patientId: 'as', status: 'progress', due: 'Today', owner: 'YO', note: 'Missing diabetes link' },
  { id: 't5', title: 'Sign PHQ-9 screening', patientId: 'mj', status: 'progress', due: 'Today', owner: 'YO' },
  { id: 't6', title: 'Fall risk follow-up call', patientId: 'js', status: 'progress', due: 'Fri 20', owner: 'KW' },
  { id: 't7', title: 'Repeat INR draw before visit', patientId: 'js', status: 'waiting', due: 'Tue 17', owner: 'KW', note: 'Waiting on the lab' },
  { id: 't8', title: 'Memory clinic referral', patientId: 'js', status: 'done', due: 'Done 11 Jan', owner: 'KW' },
]

export const visits: Visit[] = [
  { id: 'v1', day: 0, start: '08:00', minutes: 60, patientId: 'rw', type: 'Annual', town: 'Amherst', done: true },
  { id: 'v2', day: 0, start: '09:30', minutes: 60, patientId: 'cc', type: 'Annual', town: 'Lockport', flag: 'Escort after hours · DNR' },
  { id: 'v3', day: 0, start: '11:00', minutes: 45, patientId: 'mja', type: 'Maintenance', town: 'Tonawanda' },
  { id: 'v4', day: 0, start: '13:30', minutes: 45, patientId: 'ok', type: 'Urgent', town: 'Buffalo' },
  { id: 'v5', day: 0, start: '15:00', minutes: 45, patientId: 'js', type: 'Maintenance', town: 'Amherst', flag: 'Unsafe after hours · DNR' },
  { id: 'v6', day: 0, start: '16:15', minutes: 45, patientId: 'gl', type: 'Follow-up', town: 'Kenmore' },
  { id: 'v7', day: 1, start: '09:00', minutes: 45, patientId: 'mj', type: 'Maintenance', town: 'Cheektowaga' },
  { id: 'v8', day: 1, start: '11:00', minutes: 45, patientId: 'an', type: 'Maintenance', town: 'Tonawanda' },
  { id: 'v9', day: 2, start: '10:00', minutes: 45, patientId: 'as', type: 'Informational', town: 'Kenmore' },
  { id: 'v10', day: 2, start: '14:00', minutes: 60, patientId: 'wj', type: 'Annual', town: 'Kenmore' },
  { id: 'v11', day: 4, start: '09:30', minutes: 45, patientId: 'rd', type: 'Maintenance', town: 'Buffalo' },
  { id: 'v12', day: 4, start: '13:00', minutes: 45, patientId: 'gl', type: 'Follow-up', town: 'Kenmore' },
  { id: 'v13', day: 4, start: '15:00', minutes: 60, patientId: 'sg', type: 'Annual', town: 'Kenmore' },
]

export const notifications: Notification[] = [
  { id: 'no1', title: 'Martin Jackson returned by coding', body: 'Missing CKD stage in Assessment and plan', time: '8 min ago', to: '/coding', unread: true },
  { id: 'no2', title: 'INR result for John Smith', body: '3.8 on 13 Jan, up from 2.6', time: '1 hr ago', to: '/patients/js', unread: true },
  { id: 'no3', title: 'Kay Williams sent a message', body: 'Mary says John missed two evening warfarin doses', time: '2 hrs ago', to: '/patients/js', unread: true },
  { id: 'no4', title: 'Allen Sanchez returned by coding', body: 'Diabetes not linked to a complication', time: 'Yesterday', to: '/coding', unread: false },
]

export const problems = [
  { id: 'p1', name: 'Atrial fibrillation', last: '11 Jan 2017', rag: 'red' as Rag, status: 'Unstable', action: 'Address today' },
  { id: 'p2', name: 'Dementia', last: '11 Jan 2017', rag: 'red' as Rag, status: 'Unstable', action: 'Address today' },
  { id: 'p3', name: 'Hypertension', last: '05 Jan 2017', rag: 'amber' as Rag, status: 'Above target', action: 'Review' },
  { id: 'p4', name: 'Anaemia', last: '13 Sep 2016', rag: 'amber' as Rag, status: 'Due this year', action: 'Schedule' },
  { id: 'p5', name: 'Chronic obstructive pulmonary disease', last: '24 May 2015', rag: 'green' as Rag, status: 'Stable', action: '' },
  { id: 'p6', name: 'Congestive heart failure', last: '10 Feb 2015', rag: 'green' as Rag, status: 'Stable', action: '' },
]

export const medications = [
  { name: 'Toprol XL', dose: '25 mg · twice daily' },
  { name: 'Donepezil', dose: '5 mg · daily' },
  { name: 'Diovan HCT', dose: '12.5 mg · weekly' },
  { name: 'Warfarin', dose: '5 mg · evening' },
  { name: 'Lasix', dose: '20 mg · morning' },
]

export const briefSources = [
  { label: 'Lab · 13 Jan', text: 'INR 3.8, up from 2.6 at the last visit.' },
  { label: 'Message · Kay · 12 Jan', text: 'Mary says he missed two evening warfarin doses, then took a double dose.' },
  { label: 'Problem list · 11 Jan', text: 'New confusion in the evenings. Memory clinic referral is in.' },
  { label: 'Task · done', text: 'Memory clinic referral completed 11 Jan.' },
  { label: 'Vitals · 05 Jan', text: 'Home blood pressure 152/88, above target.' },
  { label: 'Encounter · 05 Jan', text: 'Maintenance visit, warfarin dose unchanged.' },
  { label: 'POLST · 20 Oct 2016', text: 'DNR. Full supportive care otherwise.' },
  { label: 'Safety · 02 Jan', text: 'Unsafe neighbourhood after hours.' },
  { label: 'Medications · 21 Jun', text: 'Last reconciliation 21 Jun 2016.' },
]

export const encounterSections = [
  'Visit details', 'Present illness', 'Medical history', 'Social history', 'Surgical history', 'Review of systems',
  'Vitals', 'Physical exam', 'Assessment and plan', 'Nutrition', 'Depression screening', 'Diagnosis assessment',
  'Advance care plan', 'PCP communication', 'Behavioural health',
]

export const phqQuestions = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed or hopeless',
  'Trouble sleeping, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself',
  'Trouble concentrating',
  'Moving slowly, or being restless',
  'Thoughts of being better off dead, or of self-harm',
]
