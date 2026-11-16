// Lista de profissões. Para criar uma nova: copie um arquivo desta pasta,
// importe aqui e acrescente na lista abaixo.
import medica from './medica.js';
import veterinaria from './veterinaria.js';
import dentista from './dentista.js';
import advogada from './advogada.js';
import juiza from './juiza.js';
import professora from './professora.js';
import chef from './chef.js';
import detetive from './detetive.js';
import jornalista from './jornalista.js';
import astronauta from './astronauta.js';
import cientista from './cientista.js';

export const PROFISSOES = [
  medica, veterinaria, dentista, advogada, juiza, professora,
  chef, detetive, jornalista, astronauta, cientista,
];

// A primeira entidade é a "principal" (ex.: Paciente); as demais pertencem a ela (ex.: Consulta).
PROFISSOES.forEach((p) => {
  p.entidades.forEach((e, i) => { e.pai = i === 0 ? null : p.entidades[0].id; });
  p.documentos = p.documentos || [];
});

export const porId = (id) => PROFISSOES.find((p) => p.id === id);
