export default function poster(text, size=50, background='fff') {
  return `https://eu.ui-avatars.com/api/?name=${text}&size=${size}&background=${background}&rounded=true`
}