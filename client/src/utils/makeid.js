const names = [
  'James', 'Mike',
  'Joe', 'Sami', 'Ahmed',
  'Fathi', 'Shamir', 'Jean',
  'Vlad', 'Kao', 'George',
  'Billel', 'Kamel', 'Haikel',
  'Khaeled', 'Ramzi',
  'Loa', 'Paolo',
  'Salah', 'Mandi',
  'Saif', 'Wahbi',
  'Pirko', 'John',
  'Vidka', 'Malony',
  'Messi', 'Ronaldo',
  'Mario', 'Khabib',
  'Pedri', 'Maldini',
  'Dybala', 'Simeone',
  'Pogba', 'Hakimi'
];

export default function makeid() {
  return names[Math.floor(Math.random() * names.length)] + '-' + Date.now();
}