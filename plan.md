# Plano de implementação — Trilha

## Abordagem e arquitetura

Construir uma aplicação estática, sem dependências de execução nem serviços, com HTML, CSS e JavaScript nativos. A raiz conterá `index.html` para navegação inicial e painel, `aula.html` para o detalhe imprimível, `css/styles.css`, módulos em `js/`, dados canónicos em `data/aulas.json`, `manus-routes.json` e um README de edição/publicação. Usar caminhos relativos e resolver a base da aplicação de forma compatível com subdiretórios de repositórios GitHub Pages.

`data/aulas.json` será a fonte de dados para aulas, trilhas, questão semanal e banco de questões ENEM. O painel no navegador carrega, valida e permite editar o conjunto; exporta o JSON completo para download. A publicação é manual: substituir o arquivo no repositório GitHub e aguardar o Pages. Não sugerir sincronização, autenticação ou publicação automática. O progresso e as preferências de estudante usam `localStorage`, com aviso de que não sincronizam entre dispositivos e podem ser perdidos.

A interface inicial organiza navegação pelas três séries e oferece busca local sem distinção de acentos, filtros, aulas recentes, trilhas, Recuperação, Questão da Semana, Modo ENEM e indicadores individuais. Detalhe de aula agrega série(s), disciplina, tema/trilha, objetivo, vídeo (somente links fornecidos e identificados; exemplos indisponíveis ficam não publicados), resumo, conceitos, atividade de retomada, desafio, materiais e quatro etapas de progresso. A impressão oculta navegação e gamificação e conserva título, séries, disciplina, resumo, conceitos e questões.

O painel cobre inclusão/edição de aulas, escolha de séries, vídeos, resumos, conceitos, atividades/desafios, trilhas, materiais e publicação; também atualiza a Questão da Semana e questões do banco. A validação conserva conteúdos já carregados, evita IDs duplicados e produz JSON válido. Questões demonstrativas são identificadas como autorais/demonstração; nenhuma questão ou fonte oficial será fabricada.

## Estrutura de projeto

- `index.html`: página principal, navegação por série, cartões, filtros, painéis e formulários de professor.
- `aula.html`: modelo de estudo, retomada e impressão por identificador de aula.
- `css/styles.css`: identidade visual responsiva, estados acessíveis e regras de impressão.
- `js/`: carregamento/resolução de dados, busca e filtros, renderização, progresso, impressão e lógica do editor/exportação.
- `data/aulas.json`: conteúdo demonstrativo e conteúdo que o professor substitui para publicar.
- `manus-routes.json`: declaração das rotas do site.
- `README.md`: estrutura, uso do editor, exportação, atualização manual do JSON e configuração/publicação no GitHub Pages.

## Design

Estilos considerados: editorial escolar contemporâneo — 0,08; painel neo-brutalista de alto contraste — 0,06; caderno de campo digital com cores de trilha — 0,04. Escolha: caderno de campo digital, com interface editorial e estrutura de missão.

- **Movimento:** editorial digital de caderno de campo; mistura organização escolar familiar com sinalética de exploração intelectual.
- **Princípios:** clareza antes da decoração; progresso visível sem competição; hierarquia e contraste; linguagem direta e acolhedora.
- **Filosofia de cor:** fundo marfim muito claro e tinta azul-marinho para leitura prolongada; verde-petróleo como cor própria de ação/progresso; coral e amarelo-ocre pontuam missão e destaque sem infantilizar.
- **Paradigma de layout:** faixa de navegação lateral/compacta, cabeçalho editorial e sequência vertical de secções; cartões assimétricos para missão prioritária, apoiados por listas compactas para conteúdo recente.
- **Elementos distintivos:** marcador de trilha numerado; pequenas etiquetas de série e tema; barras de progresso com segmentos das quatro etapas.
- **Interação:** ações explícitas, retorno imediato e estado persistente apenas no dispositivo; sem mecânicas competitivas.
- **Animação:** transições discretas de 120–180 ms para foco/expansão; respeitar `prefers-reduced-motion`; nenhuma animação essencial à compreensão.
- **Tipografia:** títulos com `Outfit` em pilha local/sistema e corpo com `Inter` em pilha local/sistema; corpo confortável (16 px ou mais), largura de linha contida e hierarquia de títulos consistente; sem dependência obrigatória de fonte externa.
- **Essência da marca:** uma plataforma de estudo guiado para jovens do Ensino Médio, que transforma conteúdo em percursos claros; curiosa, próxima, prática.
- **Voz:** títulos curtos e orientados à ação; microtexto honesto e não punitivo. Exemplos: “Escolha seu próximo passo.” “Seu progresso fica neste dispositivo.”
- **Marca/logótipo:** palavra “trilha” em minúsculas junto a um símbolo próprio de quatro segmentos ascendentes, evocando percurso sem usar ícone infantil.
- **Cor de marca:** verde-petróleo profundo.

## Limites conhecidos

O texto do anexo disponível termina no meio da secção de execução, depois de “Execute as”. Implementar todos os requisitos completos visíveis e não presumir requisitos adicionais.