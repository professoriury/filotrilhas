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
