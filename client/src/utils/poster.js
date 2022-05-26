export default function poster(text, size = 100, background = 'fff') {
  return `https://eu.ui-avatars.com/api/?name=${text}&size=${size}&background=${background}&rounded=true`
}