import { supabase } from '../config/supabaseClient.js';

const loginForm = document.getElementById('login-form');
const errorBox = document.getElementById('error');
const errorText = document.getElementById('error-text');
const loginBtn = document.getElementById('login-btn');
const groups = Array.from(document.querySelectorAll('[data-group]'));

async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    window.location.href = 'dashboard.html';
  }
}
checkSession();

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.style.display = 'none';
  errorText.textContent = '';
  loginBtn.textContent = 'Entrando...';
  loginBtn.disabled = true;

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
      
    if (error) throw error;
    window.location.href = 'dashboard.html';

  } catch (error) {
    const msg = error.message === 'Invalid login credentials' ? 'Credenciais inválidas ou acesso não autorizado' : error.message;
    errorText.textContent = msg;
    errorBox.style.display = 'flex';
    loginBtn.textContent = 'Entrar';
    loginBtn.disabled = false;
  }
});
groups.forEach(g => {
  const input = g.querySelector('.input');
  input.addEventListener('focus', () => g.classList.add('focused'));
  input.addEventListener('blur', () => g.classList.remove('focused'));
});
