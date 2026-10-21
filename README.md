# Trilha — aprender no seu ritmo

Plataforma estática e responsiva para organizar aulas, trilhas, retomada e prática no Ensino Médio. A primeira edição traz Filosofia e conteúdo explicitamente demonstrativo. Funciona sem servidor próprio, base de dados, chaves secretas, APIs pagas ou cadastro de estudantes.

## Estrutura

- `index.html`: início, séries, busca, questão semanal, modo ENEM e painel do professor.
- `aula.html`: estudo dirigido e visualização imprimível de uma aula.
- `css/styles.css`: identidade visual, layout responsivo, acessibilidade e impressão.
- `js/app.js`: início, pesquisa, progresso, filtros, questões e edição/exportação dos dados.
- `js/lesson.js`: detalhe, etapas, atividades e impressão.
- `data/aulas.json`: fonte dos conteúdos. As mudanças são publicadas substituindo este arquivo no repositório.
- `manus-routes.json`: declaração das páginas do site.

## Editar conteúdos sem programar

1. Abra **Área do professor** na página inicial.
2. Em **Aulas**, escolha uma aula existente para editar ou selecione **Nova aula**. Associe uma ou mais séries, selecione uma trilha existente e preencha os campos. Ao editar, palavras-chave, rótulos de materiais e estado do vídeo são preservados; marque explicitamente se um vídeo já está disponível aos estudantes.
3. Em **Trilhas**, crie ou edite título, disciplina, séries, descrição e aulas associadas. Uma aula pertence a uma trilha de cada vez; ao movê-la, as referências recíprocas são atualizadas. Também é possível retirar aulas ou excluir a trilha sem excluir as aulas.
4. Use **Questão da Semana** para substituir a questão selecionada e **Questões ENEM** para acrescentar, editar ou excluir questões. Para marcar uma questão como oficial, a referência deve identificar INEP (ou usar um URL HTTPS em domínio `gov.br`), ENEM, o ano e o número da questão/item. O site não consulta nem verifica a autenticidade ou disponibilidade da fonte: confirme-a no documento oficial antes de publicar; não use a opção oficial para exemplos inventados.
5. Clique em **Exportar JSON**. O arquivo inclui os dados carregados e alterados nesta sessão. IDs devem ser globalmente únicos e válidos; o painel verifica campos essenciais, formatos de resposta, links HTTP/HTTPS ou relativos seguros e relações entre aulas e trilhas. Uma questão declarada oficial sem origem e item identificáveis é recusada. Exporte antes de recarregar a página.
6. No seu repositório, substitua `data/aulas.json` pelo arquivo baixado e faça commit/push. O GitHub Pages fará a publicação conforme a configuração do repositório. O painel não publica por você.

As alterações feitas no formulário permanecem na memória da página até exportar o JSON. Faça o download antes de recarregar ou fechar a página. O arquivo inicial contém dados de demonstração, não aulas publicadas.

## Publicar gratuitamente no GitHub Pages

1. Crie um repositório GitHub e envie os arquivos desta pasta para a raiz da branch `main`.
2. Em **Settings → Pages**, selecione a origem de publicação pela branch `main` e pasta `/(root)` (ou configure a pasta escolhida, se mover os arquivos).
3. Aguarde a conclusão do deploy e acesse o endereço Pages indicado pelo GitHub. URLs e links internos são relativos e funcionam em repositórios de projeto.
4. Para cada atualização, substitua `data/aulas.json`, faça commit e push. Nenhuma credencial GitHub é guardada no site.

É possível verificar localmente usando um servidor estático, por exemplo `python3 -m http.server 8000`, e abrir `http://localhost:8000`. Abrir via `file://` pode impedir o carregamento do JSON por restrições do navegador.

## Dados e demonstrações

Cada aula contém identificador, título, séries, disciplina, tema, trilha, objetivo, vídeo, resumo, conceitos-chave, atividade de recuperação, atividade, desafio, materiais, questões de estudo e status. Uma aula demonstrativa é partilhada entre 1º e 2º anos sem duplicação do registro. Os exemplos não fornecem links de vídeo ou de materiais funcionais: estão marcados como demonstração e não publicados. A Questão da Semana e a questão de prática são autorais fictícias, explicitamente identificadas como não oficiais. Não há questões oficiais ou fontes inventadas no conjunto inicial. Fontes de questões acrescentadas depois são informação declarada pelo professor, não autenticada automaticamente pelo site.

## Progresso e privacidade

As quatro etapas (Assistir, Estudar, Praticar, Refletir) só são concluídas quando o estudante escolhe marcá-las. O progresso usa armazenamento local do navegador, não exige conta, não sincroniza entre dispositivos e pode ser perdido ao limpar os dados do navegador. Não há ranking público; atividades ou vídeos externos não são concluídos automaticamente.
