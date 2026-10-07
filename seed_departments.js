const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

const db = new Database('./backend/database.sqlite');

const depts = [
  {
    name: 'Dr. Altaf Hussain Bhat (Gen)',
    code: 'DOC035',
    floor: 'Unknown Floor',
    description: 'Senior Consultant',
    url: 'https://hms.jjmhospitalkashipur.com/qd/DOC035'
  },
  {
    name: 'Dr. Swami Prasad Gupta (Medicine)',
    code: 'DOC036',
    floor: '1st Floor, Block-A',
    description: 'Cardiologist',
    url: 'https://hms.jjmhospitalkashipur.com/qd/DOC036'
  },
  {
    name: 'Dr. Ashok Kumar Sirohi (Ortho)',
    code: 'DOC037',
    floor: 'Ground Floor, Block-B',
    description: 'Orthopedic Surgeon',
    url: 'https://hms.jjmhospitalkashipur.com/qd/DOC037'
  },
  {
    name: 'Dr. Arun Pachauri (Paediatrics)',
    code: 'DOC038',
    floor: '1st Floor, Block-A',
    description: 'Pediatrician',
    url: 'https://hms.jjmhospitalkashipur.com/qd/DOC038'
  },
  {
    name: 'Dr. Yamini Goel (Gen)',
    code: 'DOC039',
    floor: 'Unknown Floor',
    description: 'Senior Consultant',
    url: 'https://hms.jjmhospitalkashipur.com/qd/DOC039'
  },
  {
    name: 'Dr. Ashok Goel (Gen)',
    code: 'DOC040',
    floor: 'Unknown Floor',
    description: 'Cardiologist',
    url: 'https://hms.jjmhospitalkashipur.com/qd/DOC040'
  },
  {
    name: 'Dr. Brij Mohan Goel (Radiology)',
    code: 'DOC041',
    floor: 'Ground Floor, Block-A',
    description: 'Senior Consultant',
    url: 'https://hms.jjmhospitalkashipur.com/qd/DOC041'
  }
];

const insert = db.prepare(`
  INSERT INTO departments (id, name, code, floor, description, default_queue_url, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
`);

for (const d of depts) {
  try {
    insert.run(
      // using simple rand string instead of uuid module just to avoid dependency issues if it is not installed globally
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15), 
      d.name,
      d.code,
      d.floor,
      d.description,
      d.url,
      new Date().toISOString()
    );
    console.log('Inserted ' + d.code);
  } catch(e) {
    console.log('Error inserting ' + d.code + ': ' + e.message);
  }
}

console.log('Done.');
