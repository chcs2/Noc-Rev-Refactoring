# NocRev — Documentação de Funcionalidades

Este documento mapeia cada uma das **10 funcionalidades** descritas no
*Documento de Visão e Escopo* para os arquivos e funções correspondentes
no código. Em seguida, mostra onde os conceitos extras de **Polimorfismo**
e **Herança** aparecem.

> Convenção: caminhos são relativos à raiz do projeto (`noc-rev/`).
> Linhas no formato `arquivo.jsx:função` apontam para a função/componente
> exato. Os comentários de cabeçalho de cada arquivo também citam o número
> do requisito (ex: `req. 3.1.2`).

---

## Mapa rápido (TL;DR)

| #   | Funcionalidade                                         | Arquivos principais                                                                                           |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 1   | Autenticação e Perfil                                  | `src/context/AuthContext.jsx`, `src/pages/Login.jsx`, `src/pages/Cadastro.jsx`, `src/pages/Perfil.jsx`        |
| 2   | Sistema de Avaliação e Diário (Log)                    | `src/components/LogEntryForm.jsx`, `src/pages/Diario.jsx`, `UserDataContext.jsx → registrarLog/editarLog/excluirLog` |
| 3   | Criação de Listas                                      | `src/pages/Listas.jsx`, `src/pages/ListaDetalhe.jsx`, `UserDataContext.jsx → criarLista/atualizarLista/...`   |
| 4   | Interação Social                                       | `src/pages/Usuarios.jsx`, `src/pages/UsuarioPerfil.jsx`, `UserDataContext.jsx → seguir/curtirReview/comentarEmLista` |
| 5   | Modelagem de Dados Universal                           | `src/domain/Obra.js` + subclasses, `src/domain/factory.js`, `src/components/ObraCard.jsx`                     |
| 6   | Sistema de Progresso Flexível                          | `src/pages/SerieDetail.jsx`, `src/pages/EpisodioDetail.jsx`, `UserDataContext.jsx → episodioVisto/marcarSerieInteiraVista` |
| 7   | Filtros Híbridos de Busca                              | `src/components/FiltrosHibridos.jsx`, `src/pages/Browse.jsx`                                                  |
| 8   | Listas Mistas                                          | `src/components/AdicionarALista.jsx`, `src/pages/ListaDetalhe.jsx`, `UserDataContext.jsx → adicionarItemNaLista` |
| 9   | Estatísticas Pessoais Avançadas (Dashboard)            | `src/pages/Estatisticas.jsx`, `src/utils/stats.js`                                                            |
| 10  | Sistema de "Streaks" e Desafios (Gamificação)          | `src/utils/streak.js`, `src/pages/Perfil.jsx`, `src/pages/Home.jsx`                                           |
| ⭐  | **Polimorfismo**                                        | Métodos sobrescritos em `src/domain/{Filme,Serie,Minisserie,Documentario,Episodio}.js`                        |
| ⭐  | **Herança**                                             | `extends Obra` / `extends Filme` / `extends Serie` em `src/domain/`                                           |

---

## 3.1. Funcionalidades Base

### 1) Autenticação e Perfil — *req. 3.1.1*

**Onde mora:**

- `src/context/AuthContext.jsx` — provider que mantém os usuários
  cadastrados e o usuário atual em `localStorage`. Função `cadastrar()`,
  `login()`, `logout()`, `atualizarPerfil()`, `alternarPrivacidade()`.
- `src/pages/Login.jsx` — formulário de login (mock por username, sem
  senha — protótipo).
- `src/pages/Cadastro.jsx` — formulário de cadastro com username,
  displayName, biografia e visibilidade pública/privada.
- `src/pages/Perfil.jsx` — edição de displayName, biografia, foto (URL)
  e botão de alternar visibilidade.
- `src/pages/UsuarioPerfil.jsx` — visualização do perfil de outro usuário
  (respeita perfis privados).

**Estados implementados:** Deslogado, Autenticado, Perfil Público, Perfil
Privado, Conta Suspensa (campo `suspenso` em `auth.users`).

**Ações:** todas as cinco do documento — cadastrar, login/logout, editar
texto, foto (URL), alternar visibilidade.

---

### 2) Sistema de Avaliação e Diário (Log) — *req. 3.1.2*

**Onde mora:**

- `src/components/LogEntryForm.jsx` — formulário com data de
  visualização, nota (estrelas 0.5–5), checkbox "Curtir" e textarea de
  resenha.
- `src/components/StarRating.jsx` — widget de estrelas com suporte a
  meias-estrelas.
- `src/pages/Diario.jsx` — listagem cronológica do diário, com edição e
  exclusão de registros.
- `src/context/UserDataContext.jsx` → funções `registrarLog`,
  `editarLog`, `excluirLog`, `listarDiarioDoUsuario`.
- O botão "**+ Registrar no diário**" aparece nas páginas de detalhe
  (`FilmeDetail.jsx`, `SerieDetail.jsx`, `EpisodioDetail.jsx`).

**Estados implementados:** Obra não avaliada (sem entry), Obra
registrada (entry presente), Curtida (`curtido: true`), Com nota
(`nota > 0`), Com resenha (`resenha !== ''`).

**Ações:** buscar obra, selecionar data no calendário, atribuir nota,
escrever resenha, curtir, salvar/editar/excluir registro.

---

### 3) Criação de Listas — *req. 3.1.3*

**Onde mora:**

- `src/pages/Listas.jsx` — criar nova lista, alternar visibilidade
  (Pública / Privada / Não Listada), excluir lista.
- `src/pages/ListaDetalhe.jsx` — exibe os itens, suporta reordenação
  (botões ↑/↓), remoção e renderiza comentários.
- `src/context/UserDataContext.jsx` → funções `criarLista`,
  `atualizarLista`, `excluirLista`, `adicionarItemNaLista`,
  `removerItemDaLista`, `reordenarLista`, `listarListasDoUsuario`.

**Estados implementados:** Lista Vazia (`itens.length === 0`), Lista
Povoada, Lista Pública, Lista Privada, Lista Não-Listada
(`visibilidade: 'naoListada'`).

**Ações:** criar, nomear/descrever, adicionar/remover itens, reordenar
(setas), excluir lista inteira.

---

### 4) Interação Social — *req. 3.1.4*

**Onde mora:**

- `src/pages/Usuarios.jsx` — busca de usuários por nome/username, botão
  Seguir/Deixar de Seguir.
- `src/pages/UsuarioPerfil.jsx` — perfil de outro usuário, com listas
  públicas, diário e botão de curtir reviews.
- `src/pages/ListaDetalhe.jsx` — formulário de comentário, exclusão e
  edição.
- `src/context/UserDataContext.jsx` → funções `seguir`, `deixarDeSeguir`,
  `estaSeguindo`, `curtirReview`, `reviewCurtido`, `contarLikesReview`,
  `comentarEmLista`, `editarComentarioLista`, `excluirComentarioLista`,
  `listarComentariosDeLista`.

**Estados implementados:** Não seguindo, Seguindo, Solicitação pendente
(perfis privados retornam dados apenas se você for seguidor), Comentário
ativo.

**Ações:** buscar usuários, seguir/parar de seguir, curtir resenhas,
inserir/editar/excluir comentários.

---

## 3.2. Funcionalidades Diferenciais

### 5) Modelagem de Dados Universal — *req. 3.2.1*

**Onde mora:**

- `src/domain/Obra.js` — superclasse abstrata com `id`, `titulo`,
  `posterPath`, `dataLancamento`, `generos`, `sinopse` e os métodos
  polimórficos.
- `src/domain/Filme.js`, `src/domain/Serie.js`,
  `src/domain/Minisserie.js`, `src/domain/Documentario.js`,
  `src/domain/Episodio.js` — instâncias concretas.
- `src/domain/factory.js` — funções `obraDeFilmeTmdb`,
  `obraDeSerieTmdb`, `obraDeEpisodioTmdb`, `obraDeIndice` (recriação a
  partir do localStorage).
- `src/components/ObraCard.jsx` — UI uniforme que aceita qualquer
  subclasse de Obra (chama somente métodos da superclasse).

**Como demonstra o requisito:** todos os tipos compartilham a entidade
matriz `Obra`. Diretores e gêneros são tratados de forma genérica
(`obra.diretores`, `obra.criadores`, `obra.generos`). As telas de
detalhe (`FilmeDetail`, `SerieDetail`) usam o mesmo molde, ajustando
apenas o que cada subtipo expõe (`getResumoMetadados()` muda entre
"112 min" e "5 temporadas · 42 episódios").

---

### 6) Sistema de Progresso Flexível — *req. 3.2.2*

**Onde mora:**

- `src/pages/SerieDetail.jsx`:
  - botão `Marcar série inteira como vista` chama
    `marcarSerieInteiraVista` no contexto.
  - cada `<EpisodeRow>` permite check-in granular via
    `alternarEpisodioVisto`.
  - barra de % concluído (`progresso-barra`) calculada com
    `contarEpisodiosVistosDaSerie`.
- `src/pages/EpisodioDetail.jsx` — registro/avaliação por episódio.
- `src/context/UserDataContext.jsx` → funções `episodioVisto`,
  `alternarEpisodioVisto`, `marcarSerieInteiraVista`,
  `contarEpisodiosVistosDaSerie`.

**Estados implementados:** Não iniciado (0 vistos), Em andamento
(0 < vistos < total), Concluído (vistos === total).

**Ações:** marcar obra completa como vista, check-in por temporada (em
massa via `marcarSerieInteiraVista` filtrado por temporada — extensível),
check-in por episódio individual, % de conclusão na barra.

---

### 7) Filtros Híbridos de Busca — *req. 3.2.3*

**Onde mora:**

- `src/components/FiltrosHibridos.jsx` — UI de checkboxes (Filmes,
  Séries, Minisséries, Documentários, Episódios) + slider de nota
  mínima.
- `src/pages/Browse.jsx` — aplica os filtros sobre a busca multi do
  TMDB (`/search/multi`) e cruza com o diário do usuário para o filtro
  por nota.
- A URL conserva o estado dos filtros (`?q=...&tipos=Filme,Série&notaMin=4`).

**Estados implementados:** Filtros limpos (todos os tipos selecionados,
nota mínima 0), Filtros aplicados.

**Ações:** marcar checkboxes simultâneos, definir nota mínima no
slider, disparar a busca (input do navbar), botão "Limpar filtros".

---

### 8) Listas Mistas — *req. 3.2.4*

**Onde mora:**

- `src/components/AdicionarALista.jsx` — popover na página de detalhe
  (Filme, Série, Episódio…) que aceita qualquer Obra na mesma lista.
- `src/pages/ListaDetalhe.jsx` — renderiza a grade misturando
  `ObraCard` para Filmes, Séries e Episódios na mesma coleção,
  identificando-os pelo selo (📺, 🎬, 📼, etc.) vindo de
  `obra.getIconeSelo()`.
- `src/context/UserDataContext.jsx` → função `adicionarItemNaLista`
  trabalha com `obra.getIdentificadorUnico()` (não importa o subtipo).

**Estados implementados:** Lista heterogênea em edição (com itens de
tipos diferentes), Lista heterogênea publicada
(`visibilidade: 'publica'`).

**Ações:** inserir filmes, episódios e séries na mesma lista; selos
visuais identificam o tipo (POLIMORFISMO via `getIconeSelo()`).

---

### 9) Estatísticas Pessoais Avançadas (Dashboard) — *req. 3.2.5*

**Onde mora:**

- `src/utils/stats.js` — funções `calcularEstatisticas` e
  `anosDisponiveis`. Computa total de horas, média de notas,
  agrupamento por tipo, gênero, diretor/criador e ano.
- `src/pages/Estatisticas.jsx` — Dashboard com KPIs e gráficos de
  barra (sem libs externas).

**Estados implementados:** Dados não processados (não logado),
Dashboard renderizado, Filtragem de período ativa
(`anoFiltro` no select).

**Ações:** acessar a aba "Estatísticas" via navbar, filtrar por ano ou
"Todos os tempos", visualizar soma de horas, top gêneros e top
diretores/criadores.

> ⚠️ A soma de horas usa o método polimórfico
> `obra.getDuracaoMinutos()` — ver seção Polimorfismo abaixo.

---

### 10) Sistema de "Streaks" e Desafios (Gamificação) — *req. 3.2.6*

**Onde mora:**

- `src/utils/streak.js` — `calcularStreak(diary)` retorna
  `{ ativo, semanas, ultimaSemana, proximoVencimento }`.
  `selosConquistados(diary, streak)` retorna a lista de selos
  desbloqueados.
- `src/pages/Home.jsx` — banner de streak na página inicial.
- `src/pages/Perfil.jsx` — exibição do streak e dos selos do usuário.

**Estados implementados:** Streak inativo, Streak ativo (X semanas),
Desafio em andamento (a função de selos serve como "desafios"
implícitos), Selo desbloqueado.

**Ações:** visualização do streak na home/perfil, conferência da data
do último log (cálculo automático), zeragem em caso de inatividade
(janela semanal), atribuição automática de selos quando metas são
cumpridas.

---

## ⭐ Conceitos extras: Polimorfismo e Herança

### Herança

A hierarquia de classes está em **`src/domain/`** e tem dois níveis em
duas cadeias:

```
Obra (abstrata)
├── Filme            (extends Obra)
│   └── Documentario (extends Filme)         ← cadeia de 3 níveis
├── Serie            (extends Obra)
│   └── Minisserie   (extends Serie)         ← cadeia de 3 níveis
└── Episodio         (extends Obra)
```

**Onde verificar a palavra-chave `extends`:**

- `src/domain/Filme.js:6` — `class Filme extends Obra`
- `src/domain/Documentario.js:8` — `class Documentario extends Filme`
- `src/domain/Serie.js:6` — `class Serie extends Obra`
- `src/domain/Minisserie.js:7` — `class Minisserie extends Serie`
- `src/domain/Episodio.js:7` — `class Episodio extends Obra`

Todos os construtores das subclasses chamam `super(props)` para
inicializar os atributos comuns da `Obra`. O construtor de
`Obra` rejeita instanciação direta (proteção contra "abstrata"):

```js
if (new.target === Obra) {
  throw new Error('Obra é abstrata — instancie Filme, Serie, ...')
}
```

### Polimorfismo

Os métodos abaixo são declarados em `Obra` e **sobrescritos** em cada
subclasse — quem chama o método não precisa saber o tipo concreto:

| Método                       | Comportamento polimórfico                                                     |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `getTipo()`                  | retorna `'Filme'`, `'Série'`, `'Minissérie'`, `'Documentário'` ou `'Episódio'` |
| `getDuracaoMinutos()`        | Filme retorna `runtime`; Série retorna `numEpisodios * duracaoMediaEpisodio`; Episódio retorna seu próprio runtime |
| `getResumoMetadados()`       | string apropriada — `"112 min"` vs. `"5 temporadas · 42 episódios"`           |
| `getIdentificadorUnico()`    | `filme:123`, `serie:456`, `episodio:456:1:2`, etc.                            |
| `getRota()`                  | URL apropriada — `/filme/:id`, `/serie/:id`, `/serie/:id/temporada/.../...`   |
| `getIconeSelo()`             | 🎬 / 📺 / 🎞️ / 🎥 / 📼 — distingue tipo em Listas Mistas                       |
| `paraIndice()`               | serialização para `localStorage` (cada subclasse adiciona seus próprios campos) |

**Onde o polimorfismo é EXPLORADO no app (sem o caller saber o tipo):**

- `src/components/ObraCard.jsx` — chama `obra.getTipo()`,
  `obra.getRota()`, `obra.getIconeSelo()`, `obra.getResumoMetadados()`
  sem nenhum `if (instanceof ...)`.
- `src/utils/stats.js → calcularEstatisticas` — `obra.getDuracaoMinutos()`
  é chamado uniformemente sobre Filmes, Séries e Episódios para somar
  horas assistidas.
- `src/context/UserDataContext.jsx → registrarObraNoIndice` — usa
  `obra.getIdentificadorUnico()` e `obra.paraIndice()` para persistir
  qualquer subtipo.
- `src/components/AdicionarALista.jsx` — adiciona qualquer Obra à lista
  via `obra.getIdentificadorUnico()` (Listas Mistas).

**Recriação polimórfica a partir do localStorage:**
`src/domain/factory.js → obraDeIndice(item)` despacha pelo campo `tipo`
e devolve a subclasse correta — útil para reconstruir as listas do
usuário entre sessões.

---

## Estrutura de pastas (para referência)

```
src/
├── api/
│   └── tmdb.js                   Cliente do TMDB (séries + filmes + episódios)
├── components/
│   ├── Navbar.jsx                Navegação + busca + auth
│   ├── ObraCard.jsx              Card polimórfico (req. 3.2.1)
│   ├── StarRating.jsx            Estrelas 0.5–5 (req. 3.1.2)
│   ├── LogEntryForm.jsx          Formulário do diário (req. 3.1.2)
│   ├── FiltrosHibridos.jsx       UI dos filtros (req. 3.2.3)
│   └── AdicionarALista.jsx       Popover de listas mistas (req. 3.2.4)
├── context/
│   ├── AuthContext.jsx           Autenticação e Perfil (req. 3.1.1)
│   └── UserDataContext.jsx       Diário + Listas + Social + Progresso
├── domain/                       ← Hierarquia de classes (HERANÇA + POLIMORFISMO)
│   ├── Obra.js                   Superclasse abstrata
│   ├── Filme.js                  extends Obra
│   ├── Documentario.js           extends Filme
│   ├── Serie.js                  extends Obra
│   ├── Minisserie.js             extends Serie
│   ├── Episodio.js               extends Obra
│   └── factory.js                Conversão TMDB → Obra; reconstrução
├── pages/
│   ├── Home.jsx                  Descoberta + banner de streak
│   ├── Browse.jsx                Filtros Híbridos (req. 3.2.3)
│   ├── FilmeDetail.jsx
│   ├── SerieDetail.jsx           inclui Sistema de Progresso Flexível
│   ├── EpisodioDetail.jsx
│   ├── Login.jsx / Cadastro.jsx  (req. 3.1.1)
│   ├── Perfil.jsx                Edição + selos + streak
│   ├── UsuarioPerfil.jsx         Ver outro usuário (req. 3.1.4)
│   ├── Usuarios.jsx              Descobrir e seguir
│   ├── Diario.jsx                Histórico de logs (req. 3.1.2)
│   ├── Listas.jsx                CRUD de listas (req. 3.1.3)
│   ├── ListaDetalhe.jsx          Itens + comentários (req. 3.1.3 + 3.2.4 + 3.1.4)
│   ├── Watchlist.jsx             "Para Assistir" rápido
│   └── Estatisticas.jsx          Dashboard (req. 3.2.5)
├── utils/
│   ├── storage.js                Wrapper de localStorage
│   ├── stats.js                  Cálculo do Dashboard (req. 3.2.5)
│   └── streak.js                 Cálculo do Streak (req. 3.2.6)
├── App.jsx                       Roteamento
├── main.jsx                      Entry-point + providers
└── index.css                     Tema escuro inspirado no Letterboxd
```

---

## Como rodar

1. `npm install`
2. Configure `.env` com `VITE_TMDB_API_KEY=...` (chave gratuita em
   [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api))
3. `npm run dev`

Existem 3 usuários demo já semeados (`maria`, `joao`, `ana`) — basta
clicar neles na tela de Login para experimentar as funcionalidades
sociais sem precisar criar contas separadas.
