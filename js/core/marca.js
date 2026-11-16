// "Marca" do escritório: avatar, logotipo, carimbo e papel timbrado personalizados.
// Tudo é validado aqui (cores só em #rrggbb, emojis curtos) porque vai parar em SVG/estilos.

export const PALETA = [
  { cor: '#c2185b', nome: 'Rosa' },
  { cor: '#7b1fa2', nome: 'Lilás' },
  { cor: '#283593', nome: 'Azul-marinho' },
  { cor: '#1565c0', nome: 'Azul' },
  { cor: '#00796b', nome: 'Turquesa' },
  { cor: '#2e7d32', nome: 'Verde' },
  { cor: '#b34700', nome: 'Laranja' },
  { cor: '#c62828', nome: 'Vermelho' },
  { cor: '#5d4037', nome: 'Marrom' },
];
export const FORMAS_LOGO = [['quadrado', 'Quadrado'], ['circulo', 'Redondo']];
export const FORMAS_CARIMBO = [['redondo', 'Redondo'], ['oval', 'Oval'], ['retangular', 'Retangular'], ['festivo', 'Festivo']];
export const TIMBRES = [['simples', 'Simples'], ['bolinhas', 'Bolinhas'], ['listras', 'Listras'], ['estrelas', 'Estrelas']];
export const AVATARES = ['👩‍💼', '👩‍⚕️', '👩‍🏫', '👩‍🍳', '🕵️‍♀️', '👩‍🚀', '👩‍🔬', '👩‍⚖️', '🧑‍🎨', '🦸‍♀️', '🧙‍♀️', '🧚', '👸', '🐱', '🦄', '🐼'];
export const EMOJIS_MARCA = ['⭐', '🌟', '💖', '🦋', '🌈', '🍀', '🌸', '🚀', '🦄', '🐾', '🎀', '👑'];

export function marcaPadrao() {
  return {
    avatar: '👩‍💼',
    logoEmoji: '', logoForma: 'quadrado',
    corDocs: '',
    carimboForma: 'redondo', carimboCor: '', carimboEmoji: '', carimboFrase: '',
    timbre: 'simples',
  };
}

const cor = (v) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : '');
const emoji = (v, padrao) => (typeof v === 'string' ? [...v].slice(0, 12).join('') : padrao);
const opcao = (v, lista, padrao) => (lista.some(([k]) => k === v) ? v : padrao);

// Aceita qualquer coisa e devolve uma marca segura e completa.
export function normalizarMarca(m) {
  const p = marcaPadrao();
  m = m && typeof m === 'object' ? m : {};
  return {
    avatar: emoji(m.avatar, p.avatar) || p.avatar,
    logoEmoji: emoji(m.logoEmoji, ''),
    logoForma: opcao(m.logoForma, FORMAS_LOGO, p.logoForma),
    corDocs: cor(m.corDocs),
    carimboForma: opcao(m.carimboForma, FORMAS_CARIMBO, p.carimboForma),
    carimboCor: cor(m.carimboCor),
    carimboEmoji: emoji(m.carimboEmoji, ''),
    carimboFrase: typeof m.carimboFrase === 'string' ? m.carimboFrase.replace(/[<>"'&]/g, '').trim().slice(0, 18) : '',
    timbre: opcao(m.timbre, TIMBRES, p.timbre),
  };
}
