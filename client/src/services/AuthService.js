import users from "../utils/users";

export default class AuthService {

  static isAuthenticated() {
    let local = localStorage.getItem('user');
    if (local) {
      local = JSON.parse(local);
      const isFound = users.find(u => u.email === local.email && u.password === local.password);
      return isFound
    }

    return false
  }

  static login(email, password) {
    const isFound = users.find(u => u.email === email && u.password === password);
    if (isFound) {
      localStorage.setItem('user', JSON.stringify(isFound));
      localStorage.setItem('isAuthenticated', true);
    }
    return isFound
  }

  static logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/'
  }

}