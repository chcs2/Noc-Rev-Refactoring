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

### Padrão Criacional Prototype 🧬

- 
  O que é o padrão: O Prototype é um padrão de projeto criacional que permite copiar (clonar) objetos complexos sem que o código cliente precise depender de suas classes concretas ou conhecer seus detalhes internos.

- `src/domain/obra.js` - A superclasse define a interface base de clonagem que é herdada por todos os tipos de obras, o mesmo foi implementado o método clone() que utiliza new this.constructor para garantir o polimorfismo na hora da cópia, o método também aplica o spread operator [...] para realizar a clonagem profunda (Deep Copy) dos arrays de generos, diretores e criadores, assegurando que o clone tenha vida própria na memória.

- `src/domain/factory.js` - Para recriar objetos complexos salvos no localStorage (que perdem seus métodos e viram texto), foi construído um registro de protótipos, assim como o objeto constante moldesPrototipo, que armazena uma instância limpa de cada classe (Filme, Série, Episódio, etc.) para servir de "molde de métodos". Já a função obraDeIndice utiliza Object.create(Object.getPrototypeOf(prototipoMolde)) para recriar a obra baseada no molde correto, eliminando a necessidade de switch/cases gigantes e mantendo o princípio de aberto/fechado (Open/Closed).

- `src/context/UserDataContext.jsx` - O contexto da aplicação atua como o "Cliente" do padrão Prototype. A função duplicarObraPersonalizada recebe uma obraOriginal genérica e invoca o método obraOriginal.clone(), e sem precisar saber a classe concreta da obra, o sistema pega o clone exato e altera apenas os atributos exclusivos dessa nova variante (como gerar um novo id e aplicar um novoTitulo) antes de salvá-lo no banco.

- `src/pages/Listas.jsx` - A função duplicarLista(listaPrototipo) gera uma cópia exata de uma lista do usuário, também foi feita a clonagem profunda ([...listaPrototipo.itens]) para garantir que as edições na cópia não afetem os itens da lista original.

- `src/pages/Diario.jsx` - A função prepararNovaRevisao permite usar os dados de uma avaliação antiga (nota, curtida, resenha) como molde (protótipo) para preencher automaticamente o formulário de uma nova linha do tempo/visualização da mesma obra.


### Padrão Estrutural Composite 🌿

- O que é o padrão: Responsável por permitir que a aplicação trate tanto uma obra isolada (um episódio) quanto uma coleção complexa de obras (uma temporada ou série) de forma unificada. Isso elimina a necessidade do código cliente fazer dezenas de validações if/else para saber com que tipo de dado está lidando.

- `src/domain/obra.js` - A classe Obra atua como o Component do padrão, definindo o contrato padrão para todos os elementos da árvore, ela também estabelece métodos de estrutura estrutural como adicionarFilho, removerFilho e getFilhos. Por padrão (e visando a transparência do padrão), ela assume que o elemento é uma folha e lança um erro caso alguém tente adicionar um filho a ela. Também fornece métodos padronizados de cálculo, como getDuracaoTotal() e getContagemEpisodios().

- `src/domain/Episodio.js` - O Episódio representa a Leaf (Folha) do Composite e é a menor unidade granular estrutural e não suporta a adição de filhos. É neste arquivo que a recursão matemática termina: o método getContagemEpisodios() devolve o valor exato de 1, já o método getDuracaoTotal() interrompe a busca e retorna o valor direto de this.runtime.

- `src/domain/Serie.js` & `src/domain/Temporada.js`- Estas classes são os Composites reais, possuindo uma propriedade filhos (um array) para guardar outras obras internamente. O nó raiz (Serie.js) tem uma trava onde seu método adicionarFilho só aceita a entrada de objetos do tipo 'Temporada'. Por sua vez, o nó intermediário (Temporada.js) restringe a entrada apenas para 'Episódio'. E ao invés de guardarem a duração total estática no banco, ambas as classes implementam um método getDuracaoTotal() dinâmico que utiliza .reduce para iterar sobre seus filhos e somar a duração repassada por eles. Já o método setVisto(status) nessas classes pega a ordem de visualização e a propaga como um efeito cascata para todos os filhos iterando sobre this.filhos.

- `src/domain/Factory.js` - É necessário um "montador" para que essa estrutura não fique solta na memória.A função montarArvoreCompositeSerie atua como o "Mestre de Obras" (Tree Builder), ela instancia os três níveis de classes (Série, Temporada, Episódio) traduzindo os dados puros da API  e utilizando os métodos do Composite, ela liga cada folha (Episódio) no nó intermediário correspondente (Temporada), e em seguida, pendura todos os nós intermediários na raiz (Série).

- `src/context/UserDataContext.jsx` - O benefício prático desse padrão pode ser visto no momento em que o usuário interage com o sistema de progressos. Na função marcarSerieInteiraVista(serieArvore), o padrão brilha intensamente.  Em vez de fazer lógicas complexas de alteração individual, a função simplesmente chama serieArvore.setVisto(true) e deixa a árvore se auto-atualizar. Logo em seguida, o contexto executa a função local salvarRecursivo(obra), que verifica se a obra possui o método getFilhos para mergulhar na árvore e persistir todo o status atualizado no banco de dados sem precisar saber a profundidade real dos elementos.


### Padrão Comportamental Observer 👁️

- O que é o padrão: O Observer define uma dependência de um-para-muitos entre objetos. Quando o estado de um objeto muda, todos os seus dependentes (os observadores) são notificados e atualizados automaticamente. Ele foi aplicado para criar um sistema global de eventos e notificações sem gerar acoplamento rígido entre os componentes do React. Isso permite que uma ação que ocorre nas profundezas da aplicação dispare um aviso que pode ser escutado por qualquer outro componente, sem que um precise importar o outro diretamente.

- `src/context/UserDataContext.jsx` - A lógica central do padrão está na classe EventNotifier, a classe possui um dicionário observers e expõe os métodos inscrever e desinscrever, eles permitem que qualquer parte do sistema adicione ou remova funções de callback atreladas a eventos específicos. O método notificar(evento, dados) é responsável por percorrer a lista de observadores de um evento e executar todos os callbacks, e uma constante chamada appEvents é exportada, servindo como a "central de rádio" única de toda a aplicação. Ainda neste arquivo, dentro do provedor de contexto de dados, várias funções disparam eventos para o sistema avisando que uma mutação ocorreu. Ao duplicar uma obra de forma personalizada, o evento 'OBRA_CLONADA' é emitido e o registro de um novo diário dispara o 'NOVO_LOG_DIARIO'. E também, alternar um item na lista de interesse dispara o 'WATCHLIST_ALTERADA', inclusive utilizando um setTimeout para notificar de forma assíncrona e não travar o fluxo de renderização. As alterações no progresso emitem 'EPISODIO_STATUS_ALTERADO' e 'SERIE_COMPLETA_VISTA'.

- `src/utils/useAppObserver.js` - Para conectar a classe tradicional EventNotifier ao ecossistema do React, foi criado o hook customizado useAppObserver. Ele utiliza o useEffect para gerenciar o ciclo de vida da inscrição e quando um componente que usa este hook é renderizado, ele chama appEvents.inscrever. O retorno do useEffect garante que appEvents.desinscrever seja chamado quando o componente for desmontado (fechado). Isso é crucial para evitar travamentos e vazamentos de memória (memory leaks) causados por tentativas de atualizar componentes que não estão mais na tela.

- `src/App.jsx` - A aplicação prática do desacoplamento pode ser vista no componente raiz. O componente NotificadorGlobal é importado e posicionado logo no topo da hierarquia, fora do sistema de rotas (Routes), ele fica invisível e escutando as ações globais passivamente. Assim, independentemente da rota em que o usuário esteja, os eventos disparados pelo UserDataContext.jsx serão capturados e exibidos por este componente.



---