# NocRev

Rede social de avaliação e registro de mídia, no estilo Letterboxd, mas
sem fragmentação entre filmes e séries. Construído em React + Vite,
consumindo dados da API do TMDB.

> Para o mapeamento detalhado das **10 funcionalidades** (e dos conceitos
> de **Polimorfismo** e **Herança**) veja **[`DOCUMENTACAO.md`](./DOCUMENTACAO.md)**.

## Funcionalidades

**Base**

- Autenticação e Perfil (cadastro, login, biografia, foto, público/privado)
- Sistema de Avaliação e Diário (data, estrelas 0.5–5, curtir, resenha)
- Criação de Listas (públicas, privadas, não listadas)
- Interação Social (seguir, curtir reviews, comentar em listas)

**Diferenciais**

- Modelagem de Dados Universal — Filmes, Séries, Minisséries, Documentários
  e Episódios compartilham a entidade matriz `Obra` (com herança e polimorfismo)
- Sistema de Progresso Flexível — marque a obra inteira ou episódio a episódio
- Filtros Híbridos de Busca — checkboxes por tipo de mídia + slider de nota mínima
- Listas Mistas — combine filmes, séries e episódios na mesma coleção
- Estatísticas Pessoais Avançadas — horas, gêneros, diretores, ano
- Streaks e selos (gamificação semanal)

## Setup

1. Tenha Node.js 18+ instalado.
2. `npm install`
3. Crie o arquivo `.env` na raiz com sua chave do TMDB:
   ```
   VITE_TMDB_API_KEY=sua_chave_aqui
   ```
   Pegue uma chave gratuita em
   [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).
4. `npm run dev` — abre em http://localhost:5173

### Usuários demo

Há três usuários "semeados" para experimentar a parte social sem ter que
criar várias contas: **maria**, **joao** e **ana**. Na tela de login, eles
aparecem listados — basta clicar.

## Stack

- React 18 + Vite
- React Router v6
- TMDB API (séries, filmes, episódios, busca multi)
- Persistência em `localStorage` (sem backend)

## Estrutura

```
src/
├── api/tmdb.js                  Cliente TMDB
├── domain/                       Hierarquia de Obra (HERANÇA + POLIMORFISMO)
│   ├── Obra.js
│   ├── Filme.js  Documentario.js
│   ├── Serie.js  Minisserie.js
│   ├── Episodio.js
│   └── factory.js               TMDB → Obra; reconstrução
├── context/
│   ├── AuthContext.jsx          Autenticação e Perfil
│   └── UserDataContext.jsx      Diário + Listas + Social + Progresso
├── components/                  Componentes reutilizáveis
├── pages/                       Páginas/rotas
├── utils/
│   ├── storage.js               localStorage namespaced
│   ├── stats.js                 Cálculo do Dashboard
│   └── streak.js                Cálculo de streaks
├── App.jsx                      Roteamento
├── main.jsx                     Entry-point + providers
└── index.css                    Tema escuro
```

## Notas técnicas

- Todos os dados de usuário ficam em `localStorage` no namespace
  `nocrev:*`. Cada usuário tem seu próprio prefixo
  (`nocrev:user:<id>:diary`, `nocrev:user:<id>:lists`, etc.).
- O índice global de obras (`nocrev:obraIndex`) cacheia metadados das
  obras visitadas para que listas e diário possam ser reconstruídos sem
  rebuscar o TMDB.
- A autenticação é mock — não há senha nem servidor. Substitua
  `AuthContext.jsx` por chamadas a um backend real para produção.

___

## Arquitetura e padrões

**Padrão Criacional Prototype**

- 
  O que é o padrão: O Prototype é um padrão de projeto criacional que permite copiar (clonar) objetos complexos sem que o código cliente precise depender de suas classes concretas ou conhecer seus detalhes internos.

- `domain/obra.js` - A superclasse define a interface base de clonagem que é herdada por todos os tipos de obras, o mesmo foi implementado o método clone() que utiliza new this.constructor para garantir o polimorfismo na hora da cópia, o método também aplica o spread operator [...] para realizar a clonagem profunda (Deep Copy) dos arrays de generos, diretores e criadores, assegurando que o clone tenha vida própria na memória.

- `domain/factory.js` - Para recriar objetos complexos salvos no localStorage (que perdem seus métodos e viram texto), foi construído um registro de protótipos, assim como o objeto constante moldesPrototipo, que armazena uma instância limpa de cada classe (Filme, Série, Episódio, etc.) para servir de "molde de métodos". Já a função obraDeIndice utiliza Object.create(Object.getPrototypeOf(prototipoMolde)) para recriar a obra baseada no molde correto, eliminando a necessidade de switch/cases gigantes e mantendo o princípio de aberto/fechado (Open/Closed).

- `context/UserDataContext.jsx` - O contexto da aplicação atua como o "Cliente" do padrão Prototype. A função duplicarObraPersonalizada recebe uma obraOriginal genérica e invoca o método obraOriginal.clone(), e sem precisar saber a classe concreta da obra, o sistema pega o clone exato e altera apenas os atributos exclusivos dessa nova variante (como gerar um novo id e aplicar um novoTitulo) antes de salvá-lo no banco.

- `pages/Listas.jsx` - A função duplicarLista(listaPrototipo) gera uma cópia exata de uma lista do usuário, também foi feita a clonagem profunda ([...listaPrototipo.itens]) para garantir que as edições na cópia não afetem os itens da lista original.

- `pages/Diario.jsx` - A função prepararNovaRevisao permite usar os dados de uma avaliação antiga (nota, curtida, resenha) como molde (protótipo) para preencher automaticamente o formulário de uma nova linha do tempo/visualização da mesma obra.



---