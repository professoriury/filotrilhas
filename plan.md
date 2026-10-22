# Plano de implementação — Trilha

## Abordagem e arquitetura

Manter o site de estudantes como aplicação estática de HTML, CSS e JavaScript nativos, sem servidor, base de dados, contas de estudantes ou APIs pagas. Remover da página pública a navegação e toda a interface de edição/exportação do professor; preservar busca, séries, trilhas, aulas, questões e progresso local.

Manter `data/aulas.json` como fonte de dados. Criar um editor como arquivo HTML autónomo fora da raiz e do repositório publicados. O professor abre-o localmente num navegador, carrega o JSON atual, edita aulas, trilhas, Questão da Semana e questões ENEM, valida referências/IDs/links e exporta um novo `aulas.json`. O editor não faz requisições de rede nem guarda credenciais, não envia dados e não publica sozinho.

Atualizar o README com um passo a passo para carregar o JSON no editor, exportar e substituir `data/aulas.json` em `professoriury/filotrilhas` usando a interface GitHub, fazendo commit na `main`. Documentar GitHub Pages: no plano Free a origem do Pages precisa ser pública; se a fonte permanecer privada, é necessário um plano GitHub que permita Pages privado; o site publicado continua público. Não alterar a visibilidade do repositório nem publicar nesta tarefa.

Vídeo é um link HTTP/HTTPS validado. O detalhe da aula abre-o numa nova aba, não incorpora um player. Documentar partilha do Video Overview do NotebookLM: link direto de vídeo ou caderno com permissões adequadas; em contas Workspace/Education, o acesso público pode estar limitado ao domínio. Se necessário, descarregar o vídeo e alojá-lo numa plataforma escolar autorizada, depois usar o seu link.

## Estrutura de projeto

- `index.html`: experiência pública de estudantes, sem menu ou painel de professor.
- `aula.html`: estudo guiado, atividades, progresso e impressão.
- `css/styles.css`: identidade visual responsiva e impressão existente; estilos do painel removido deixam de ser usados.
- `js/app.js`: pesquisa, cartões, trilhas, questões e progresso; sem handlers de edição/exportação.
- `js/lesson.js`: detalhe de aula e botão de link de vídeo externo validado.
- `data/aulas.json`: conteúdo canónico das aulas, trilhas e questões.
- `manus-routes.json`: declaração das rotas públicas, sem alterações se as páginas continuarem iguais.
- `README.md`: instruções offline, atualização pelo GitHub, publicação e partilha de vídeos.
- Editor offline: um HTML autónomo entregue separadamente, fora do repositório do site e não publicado aos alunos.

## Design

Manter o caderno de campo digital já escolhido para o site dos estudantes: clareza antes da decoração, progresso sem competição e sinalética de missão. O editor offline usa a mesma identidade de marca em formulário acessível e simples, com avisos claros de importação/exportação; não exige dependências nem recursos externos.

- **Essência da marca:** uma plataforma de estudo guiado para jovens do Ensino Médio, que transforma conteúdo em percursos claros; curiosa, próxima, prática.
- **Voz:** direta e acolhedora; exemplos: “Escolha seu próximo passo.” e “Seu progresso fica neste dispositivo.”
- **Cor e elementos:** verde-petróleo profundo, fundo claro, etiquetas de série e passos numerados, mantendo contraste e legibilidade.

## Limites

O site continua público e estático; o editor separado protege a interface de edição de ficar exposta no site, mas não é um sistema autenticado nem sincroniza automaticamente com o GitHub. Para atualizar o conteúdo publicado, o professor precisa exportar e substituir o JSON no repositório. Não mudar a visibilidade do repositório, ligar Pages ou publicar sem pedido explícito.


## Atualização aprovada — trilhas e estrutura das aulas

Manter os três registros atuais de trilha, IDs e vínculos de aulas/séries; alterar somente os nomes para “Aprender a Filosofar”, “Pensadores(as) e Correntes” e “Temas Filosóficos”, atualizando descrições para refletir os novos eixos. Na página da aula, manter o objetivo de aprendizagem no topo e ordenar o conteúdo como: “Assistir Vídeo”, “Resumo do Conteúdo”, “Conceitos-chave”, “Recomendações POP”, “Atividade Reflexiva”, “Estudo Dirigido” e “Referências”. Retirar “Modo Recuperação” da navegação, do destaque da página inicial, das páginas de aula e do editor; a pedido explícito do usuário, apagar os campos e textos legados `recovery` do JSON, sem migrá-los para outra seção.

Adicionar o campo `recommendations` ao conteúdo da aula e à edição offline. Manter `activity` como atividade principal e preservar o texto `challenge` já existente como uma pergunta complementar dentro do mesmo bloco reflexivo; o editor o apresenta como complementar opcional. O texto POP já registrado na primeira aula passa para `recommendations`. A relação entre atividade e recomendação é editorial/opcional, sem ligação técnica obrigatória.

Reutilizar `materials` como dados de Referências, ampliando o editor offline para aceitar uma citação textual por linha ou `Rótulo | URL`; links continuam sujeitos à validação existente e citações sem URL são texto simples. O renderizador apresenta ambos sob “Referências”. Atualizar busca/validação para incluir recomendações e referências textuais. Manter arquitetura estática, rotas, progresso e demais recursos atuais. Atualizar README, `TODO.md`, `data/aulas.json`, `js/app.js`, `js/lesson.js` e o HTML autónomo do editor conforme necessário.


## Curadoria histórica do ENEM (2020–2025)

Incluir todas as edições de 2020 a 2025 e todas as aplicações oficiais disponíveis por edição: regular, PPL, reaplicações e aplicações extras. Usar um caderno padrão por aplicação para evitar duplicar as versões de cor que reorganizam o mesmo conteúdo; preservar no registro o dia, a aplicação, o caderno/cor e o número exato da questão. Classificar como Filosofia, por decisão pedagógica da Trilha, somente itens com conteúdo filosófico claro; não atribuir essa etiqueta ao INEP. Copiar enunciado e alternativas com fidelidade e validar o gabarito no arquivo oficial correspondente. `application` deve identificar a aplicação/dia/caderno; `source` deve citar INEP/ENEM/ano/número e incluir URL oficial da prova e do gabarito. Questões com imagem/gráfico devem manter a referência ao PDF oficial, sem inventar nem substituir o estímulo visual. Itens sem prova e gabarito oficiais verificáveis ficam fora da lista confirmada e são relatados como pendentes. Guardar os resultados intermediários de pesquisa fora do repositório; integrar somente registros verificados em `data/aulas.json`, com IDs únicos, `provenance: oficial` e status apropriado.


## Interação de resposta às questões ENEM

Reutilizar os botões de alternativas já existentes em `js/app.js`, que hoje dão feedback visual genérico. Tornar a alternativa selecionada identificável por estado acessível (`aria-pressed` e grupo rotulado), informar explicitamente se a resposta escolhida está correta ou incorreta e, no erro, destacar também a alternativa correta. Preservar filtros, comentário/análise e o funcionamento estático local; não exigir conta nem enviar respostas para servidor.


## Conferência e estado das questões ENEM

O campo `source` deve identificar ENEM, ano, número do item e referências oficiais da prova e do gabarito. O editor offline permite assinalar `sourceVerified` como confirmação manual do professor, não como auditoria automática do site. Alterações de ano, aplicação, enunciado, alternativas, gabarito, fonte, proveniência ou estado limpam a marca e exigem nova conferência. Uma questão oficial só pode ter estado `published` com a marca presente; rascunhos oficiais permanecem fora da página do estudante.

Uma questão anulada deve ter proveniência `oficial`, fonte conferida, estado `annulled` e `correctIndex: null`. O campo de alternativa correta é desativado no editor. No site, as opções são mostradas sem seleção ou correção automática e a anulação é indicada explicitamente. Fontes HTTPS em domínios `gov.br` são apresentadas como links seguros em nova aba. O feedback de resposta anuncia de modo explícito acerto/erro e destaca a resposta correta quando a escolha está errada, sem conta, persistência de resposta ou envio para servidor.


O contrato de fonte oficial foi endurecido: prova/caderno e gabarito exigem dois URLs HTTPS distintos em domínios `gov.br`, rotulados no campo `source`; uma menção textual a INEP ou um único URL não bastam. A validação de domínio/formato é local; `sourceVerified` continua sendo uma conferência humana explícita, não uma auditoria automatizada dos PDFs.


### Estados de publicação visíveis ao estudante

O frontend exclui aulas e trilhas `draft` das séries, busca, recentes, trilhas, progresso e da resolução direta de `aula.html`; um cartão de aula não revela o título de uma trilha rascunho. Questões ENEM `draft` e todas as questões `oficial` com `sourceVerified` diferente de `true` são omitidas dos filtros e da listagem, mesmo se o estado for `demo`. O editor só deixa guardar uma questão oficial não conferida como `draft`. Como todos os arquivos publicados por GitHub Pages são públicos, `draft` significa “oculto na interface”, não “privado”; o professor não deve colocar informação confidencial no JSON publicado.


### Navegação compacta do Modo ENEM

A listagem do modo ENEM mostrará uma única questão por vez. Um controle acessível com setas anterior/próxima e contador da questão atual em relação ao total percorre apenas os resultados filtrados; alterar ano, aplicação, disciplina ou tema volta à primeira questão. As respostas escolhidas permanecem em memória durante a navegação, para que o aluno possa consultar o feedback ao retornar, sem enviar nem persistir respostas no servidor.
