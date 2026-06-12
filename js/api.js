// ============================================================
// ACADEMIA ADDISON - API CLIENT
// Conexión a servidor Oracle
// Usado por: platform.js, examen-engine.js, admin.js
// ============================================================

const API_URL = 'https://academia-addison.duckdns.org';

async function getFirebaseToken() {
  const user = firebase.auth().currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

async function apiCall(endpoint, options = {}) {
  const token = await getFirebaseToken();
  if (!token) return null;
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });
    if (response.status === 401) {
      console.error('Token expirado');
      return null;
    }
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    console.error('API Error:', e);
    return null;
  }
}

// Funciones reutilizables
async function loadRanking() {
  return await apiCall('/api/ranking');
}

async function loadGroupRanking(group) {
  return await apiCall(`/api/ranking/${group}`);
}

async function saveExamResult(data) {
  return await apiCall('/api/examenes/resultado', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async function saveProgress(data) {
  return await apiCall('/api/progreso', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async function getMe() {
  return await apiCall('/api/me');
}
