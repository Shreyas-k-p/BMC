import { Department } from '../types';

export const DEPARTMENTS_LIST: Department[] = ['AI', 'CSE', 'CY', 'ME', 'CE', 'ECE', 'EEE', 'IC'];

export const BASE_DEMO_NAMES: { name: string; department: Department }[] = [
  { name: 'Arun Kumar', department: 'ECE' },
  { name: 'Anjali Menon', department: 'CSE' },
  { name: 'Rahul Krishnan', department: 'AI' },
  { name: 'Neha Nair', department: 'CY' },
  { name: 'Vishnu Prasad', department: 'ME' },
  { name: 'Fathima Hameed', department: 'ECE' },
  { name: 'Kiran Joseph', department: 'EEE' },
  { name: 'Meera Das', department: 'CE' },
  { name: 'Abhishek S', department: 'IC' },
  { name: 'Devika Pillai', department: 'CSE' },
  { name: 'Rohit Chandran', department: 'ME' },
  { name: 'Kavya Madhavan', department: 'ECE' },
  { name: 'Nikhil Babu', department: 'AI' },
  { name: 'Aparna Vijay', department: 'CY' },
  { name: 'Gautam Ramesh', department: 'EEE' },
  { name: 'Pooja Suresh', department: 'CE' },
  { name: 'Siddharth Raj', department: 'IC' },
  { name: 'Rhea Thomas', department: 'CSE' },
  { name: 'Harikrishnan M', department: 'ECE' },
  { name: 'Ananya Varma', department: 'AI' },
  { name: 'Mohammed Afsal', department: 'ME' },
  { name: 'Lakshmi Priya', department: 'CY' },
  { name: 'Naveen George', department: 'EEE' },
  { name: 'Shruthi Nair', department: 'CE' },
  { name: 'Adarsh Mohan', department: 'IC' },
  { name: 'Malavika S', department: 'CSE' },
  { name: 'Deepak Sankar', department: 'ME' },
  { name: 'Roshni Paul', department: 'ECE' },
  { name: 'Sarath Kumar', department: 'AI' },
  { name: 'Sneha B', department: 'CY' }
];

export const DEMO_PARTICIPANTS = BASE_DEMO_NAMES;

export function generateDemoParticipants(count: number): { name: string; department: Department }[] {
  const result: { name: string; department: Department }[] = [];
  const firstNames = [
    'Arun', 'Anjali', 'Rahul', 'Neha', 'Vishnu', 'Fathima', 'Kiran', 'Meera',
    'Abhishek', 'Devika', 'Rohit', 'Kavya', 'Nikhil', 'Aparna', 'Gautam', 'Pooja',
    'Siddharth', 'Rhea', 'Harikrishnan', 'Ananya', 'Mohammed', 'Lakshmi', 'Naveen',
    'Shruthi', 'Adarsh', 'Malavika', 'Deepak', 'Roshni', 'Sarath', 'Sneha'
  ];
  const lastNames = [
    'Kumar', 'Menon', 'Krishnan', 'Nair', 'Prasad', 'Hameed', 'Joseph', 'Das',
    'Pillai', 'Chandran', 'Madhavan', 'Babu', 'Vijay', 'Ramesh', 'Suresh', 'Raj',
    'Thomas', 'Varma', 'Afsal', 'Priya', 'George', 'Mohan', 'Sankar', 'Paul'
  ];

  for (let i = 0; i < count; i++) {
    if (i < BASE_DEMO_NAMES.length) {
      result.push(BASE_DEMO_NAMES[i]);
    } else {
      const fname = firstNames[i % firstNames.length];
      const lname = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
      const dept = DEPARTMENTS_LIST[i % DEPARTMENTS_LIST.length];
      result.push({ name: `${fname} ${lname}`, department: dept });
    }
  }
  return result;
}
