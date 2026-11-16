import { getEstado } from './storage.js';

// Aplica tema, cor de destaque e nome do escritório.
export function aplicarAparencia() {
  const { config } = getEstado();
  document.documentElement.dataset.tema = config.tema;
  document.documentElement.dataset.cor = config.cor;
  const nome = document.getElementById('nome-escritorio');
  if (nome) nome.textContent = config.escritorio;
  document.title = config.escritorio;
}
