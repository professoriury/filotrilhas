# Trilha — aprender no seu ritmo

Plataforma estática para estudantes do Ensino Médio, com aulas, trilhas, questões, busca, impressão e progresso local. As aulas apresentam vídeo, resumo, conceitos-chave, Recomendações POP, Atividade Reflexiva, Estudo Dirigido e Referências; o Modo Recuperação foi removido. O site não tem servidor, banco de dados, conta de estudante ou sincronização de progresso.

## Arquivos do projeto

- `index.html`: início e recursos dos estudantes. Não contém Área do professor.
- `aula.html`: aula, vídeo externo, seções reflexivas, Referências e Estudo Dirigido imprimível.
- `css/styles.css`: identidade visual, acessibilidade, responsividade e impressão.
- `js/app.js`: busca, filtros, trilhas, questões e progresso.
- `js/lesson.js`: sequência de conteúdo da aula, etapas, vídeo, Referências e impressão.
- `data/aulas.json`: arquivo único de aulas, trilhas, Questão da Semana e questões ENEM.
- `manus-routes.json`: rotas públicas declaradas.

O arquivo **Editor offline — Trilha** é entregue separadamente. Guarde-o numa pasta privada do computador do professor; não o coloque no repositório `professoriury/filotrilhas` nem na pasta publicada. Ele abre localmente no navegador e não envia dados pela internet.

## Atualizar aulas usando o editor offline

1. Baixe a versão mais recente de `data/aulas.json` em [professoriury/filotrilhas](https://github.com/professoriury/filotrilhas/tree/main/data). No GitHub, abra o arquivo e escolha **Download raw file** (ou **Raw** e depois guardar como `aulas.json`). Sempre comece pelo arquivo mais recente, para não apagar alterações de outra edição.
2. Abra o arquivo HTML separado **Editor offline — Trilha** (o download desta entrega, fora do repositório e do site) no Chrome, Edge ou Firefox. Clique em **Abrir aulas.json** e selecione o arquivo baixado. O editor não precisa de servidor ou conexão.
3. Na aba **Aulas**, selecione uma existente ou clique **Nova aula**. Preencha título, série(s), disciplina, tema, trilha, objetivo, resumo, conceitos, Recomendações POP, Atividade Reflexiva, pergunta complementar opcional e questões do Estudo Dirigido. Em Referências, use uma citação por linha ou `Rótulo | URL`; os links com URL devem ser HTTP/HTTPS ou caminhos relativos seguros. Os IDs devem continuar únicos. As três trilhas existentes correspondem a “Aprender a Filosofar”, “Pensadores(as) e Correntes” e “Temas Filosóficos”; seus IDs e vínculos devem ser preservados.
4. Na aba **Trilhas**, crie ou edite a trilha e selecione as aulas associadas. O editor sincroniza a associação dos dois lados. Atualize a Questão da Semana e as questões ENEM nas respetivas abas; não marque como oficial algo cuja fonte não confirmou.
5. Clique **Exportar aulas.json**. Se a validação apontar um erro, corrija o campo indicado e exporte novamente. Guarde o arquivo exportado e não feche a janela antes de exportar.
6. No GitHub, abra `professoriury/filotrilhas`, entre em `data/aulas.json` e clique no lápis **Edit this file**. Substitua o conteúdo pelo conteúdo do arquivo exportado. Use **Commit changes** na branch `main`, com uma mensagem como `Atualiza conteúdos das aulas`. Isso grava a alteração no repositório; não use o editor público do site, pois essa área foi removida.

## Publicar no GitHub Pages

O repositório `professoriury/filotrilhas` está privado. O GitHub Pages estático é gratuito no GitHub Free quando a fonte é um repositório público; no plano Free, a fonte precisa ser pública. Se quiser manter o repositório privado, use um plano GitHub que permita Pages para repositórios privados. **Mesmo com a origem privada, o site publicado no Pages fica acessível publicamente.** Não coloque nomes, notas ou outros dados pessoais dos estudantes nos arquivos do site.

Para configurar Pages, em `professoriury/filotrilhas`, abra **Settings → Pages**. Em **Build and deployment**, escolha **Deploy from a branch**, selecione `main` e a pasta `/(root)` e clique **Save**. O `index.html` já está na raiz. O GitHub apresenta o endereço e o estado da implantação na mesma página; uma primeira publicação ou alteração pode levar alguns minutos. Depois da configuração, cada commit enviado à branch/pasta escolhida aciona a publicação. Antes de tornar o repositório público, lembre-se de que isso também torna o código e o histórico visíveis, não apenas as aulas.

Se não quiser tornar o repositório público nem usar um plano GitHub com Pages privado, outra possibilidade é publicar a versão estática pelo Webdev/Manus. Este projeto ainda precisa da configuração de saída estática no Webdev e não está publicado por esse caminho. Não acionei publicação nesta alteração. A API do GitHub não permitiu verificar o estado do Pages; confira Settings → Pages antes de fazer commit em main, pois um commit pode publicar automaticamente se o Pages já estiver ativo.

## Incluir um vídeo do NotebookLM

A aula aceita um URL HTTP/HTTPS ou um caminho relativo seguro dentro do repositório (por exemplo, `videos/aula.mp4`), um rótulo e uma indicação de disponibilidade. No site atual, os estudantes veem um botão que abre o link numa nova aba; o vídeo **não** aparece incorporado num player. No editor, adicione o URL no campo **Link do vídeo**, escolha um rótulo e marque que está disponível somente depois de testar o acesso.

Para compartilhar um Video Overview do NotebookLM/Gemini Notebook, abra a visão geral, escolha **Share** e copie o link. A ajuda oficial informa que quem recebe o vídeo precisa ter acesso ao caderno completo ou o caderno precisa estar compartilhado como **Anyone with a link**. Antes de ativar um link público, confira quais fontes e materiais estão no caderno. Em contas Google Workspace/Education, a partilha pública pode estar desativada ou limitada às pessoas do mesmo domínio. Consulte a [ajuda oficial de Video Overviews](https://support.google.com/gemininotebook/answer/16454555?hl=pt-BR).

Como alternativa, o NotebookLM permite descarregar o vídeo. Pode colocar o ficheiro numa plataforma autorizada pela escola (por exemplo, Drive com acesso limitado ao domínio escolar) e inserir no editor o link de partilha testado. Um vídeo do YouTube como **não listado** é acessível a quem tiver o URL; isso não equivale a uma proteção por palavra-passe. O link de Drive/YouTube continua a abrir em nova aba no site.

## Dados e privacidade dos estudantes

O editor offline trabalha numa cópia carregada manualmente. Guardar dados no editor não atualiza o repositório: é preciso exportar o JSON e fazer commit em `main`. O site usa `localStorage` para guardar o progresso no dispositivo do aluno; esse progresso não se sincroniza entre aparelhos e pode ser perdido quando os dados do navegador são limpos. Não há contas de estudante, ranking público ou recolha de nomes/notas. O site e os links do Pages são públicos; não armazene neles dados que precisem de acesso restrito.

As questões declaradas oficiais continuam sendo informação fornecida pelo professor, não verificada automaticamente. Para ENEM, a referência deve indicar INEP ou um domínio HTTPS `gov.br`, ENEM, ano e número da questão/item; confirme a fonte no documento oficial antes de publicar.
