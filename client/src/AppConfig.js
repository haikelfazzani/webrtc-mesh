const AppConfig = {
  BACKEND_URL: process.env.NODE_ENV === 'production'
    ? 'https://webrtc-mesh.onrender.com'
    : 'http://localhost:5000'
}

export default AppConfig;