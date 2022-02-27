const names = ['James', 'Mike', 'Joe' , 'Sami', 'Ahmed', 'Fathi', 'Shamir', 'Jean', 'Vlad', 'Kao', 'George',
'Billel', 'Kamel', 'Haikel', 
'Khaeled', 'Ramzi',
'Loa', 'Paolo',
'Salah', 'Mandi',
'Saif', 'Wahbi'
]

export default function makeid() {
  return names[Math.floor(Math.random() * names.length)] + '-' + Date.now();
}