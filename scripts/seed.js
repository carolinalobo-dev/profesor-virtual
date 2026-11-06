// Carga consultas de ejemplo en un servidor ya iniciado: npm run seed
const base = process.env.API_URL ?? 'http://localhost:3000/api/v1';

const samples = [
  ['Lucía Fernández', 'Desarrollo Web', '¿Cuándo es la fecha de entrega del TP3?'],
  ['Martín Gómez', 'Python Inicial', '¿Dónde encuentro el material de la clase 5?'],
  ['Sofía Ramírez', 'Desarrollo Web', 'Tuve un problema personal grave y necesito una prórroga para mi examen final.'],
  ['Diego Paz', 'Data Analytics', 'Tengo un reclamo: no estoy conforme con la nota de mi trabajo práctico.'],
  ['Ana Torres', 'Python Inicial', '¿A qué hora es la clase del jueves?'],
  ['Julián Ortiz', 'Data Analytics', '¿Hasta cuándo puedo entregar la tarea de SQL?'],
];

for (const [studentName, course, message] of samples) {
  const response = await fetch(`${base}/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentName, course, message, channel: 'WebChat' }),
  });
  const { data } = await response.json();
  console.log(`${data?.derivated ? 'TICKET' : 'IA    '} · ${studentName}`);
}
