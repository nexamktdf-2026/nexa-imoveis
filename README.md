# NEXA Imóveis CMS

Site público (V2, design preservado) + painel `/admin` para cadastrar imóveis sem mexer no código.

## Como funciona (onde ficam os dados)
- Cada imóvel é um arquivo em `content/imoveis/*.json`; dados da empresa em `content/config.json`; fotos em `static/uploads/`.
- Tudo fica **no Git** (repositório). A Netlify só hospeda: a cada alteração salva no painel, ela roda `node build.mjs` e publica o site. **Não existe banco de dados.**
- `build.mjs` lê o conteúdo e gera: home, uma página por imóvel (`/imoveis/<slug>/`, com SEO próprio), `sitemap.xml` e `robots.txt`.
- Só entram no site imóveis **publicados** e **não arquivados**.

## Dia a dia (em `seu-site.com/admin`)
1. **Cadastrar:** Imóveis → Novo Imóvel. Obrigatórios: código (único, ex. NI-001), título, tipo, cidade. O resto é opcional; campo vazio não aparece no site.
2. **Editar / duplicar / excluir:** abra o imóvel (Decap oferece Duplicar e Excluir; ao duplicar, troque o código).
3. **Fotos:** em "Imagem principal" e "Galeria" use *Escolher imagem* → enviar. Arraste a galeria para ordenar; para trocar a principal, escolha outra imagem no campo. Cada imóvel usa só as suas fotos.
4. **Publicar / despublicar:** chave "Publicado no site". Desligada = rascunho (não aparece).
5. **Arquivar:** chave "Arquivado" (some do site, dados ficam).
6. **Destacar:** chave "Imóvel em destaque" (até 3 aparecem na seção de destaques).
7. **Status:** campo Status. Só aparece no site se preenchido.
8. **Dados da NEXA:** Configurações → "Dados da NEXA Imóveis". **WhatsApp:** só números com 55+DDD (ex.: 5562900000000). Com WhatsApp vazio, os botões levam ao formulário.

## Deploy na Netlify
1. Suba esta pasta para um repositório Git (GitHub/GitLab) e conecte na Netlify (build `node build.mjs`, publish `dist`; já está no `netlify.toml`).
2. Preencha `siteUrl` nas Configurações (ou a Netlify usa a própria URL) para canonical, Open Graph e sitemap.
3. Para testar local: `node build.mjs` e abra `dist/index.html` (para imagens e rotas, use um servidor estático).

## O que depende de configuração externa (não está pronto sozinho)
- **Login do painel:** `admin/config.yml` usa `git-gateway`, que exige Netlify Identity + Git Gateway ativados no site, com convite dos usuários. Confirme na documentação atual da Netlify se Identity está disponível para o seu projeto; se não estiver, troque o `backend` do Decap por GitHub/GitLab com OAuth (ver docs do Decap CMS). **Não existe login fictício no código.**
- **Upload de fotos:** é feito pelo Decap, gravando no Git. Não há redimensionamento automático: envie fotos já comprimidas (ex.: ~1600 px de largura). Para miniaturas otimizadas, avalie o Netlify Image CDN.
- **Analytics:** informe GTM/GA4 em Configurações; nada é carregado sem ID. O site já envia o evento `view_imovel` ao `dataLayer`.
- **Mapa, endereço, CRECI, telefone, Instagram:** aparecem só depois de preenchidos.

## Preparado para o futuro
- Leads/CRM: todo botão de WhatsApp já carrega o código do imóvel na mensagem; um formulário futuro pode enviar `codigo`, origem e data para um serviço externo.
- Conteúdo em JSON por imóvel permite trocar o CMS (Decap, Netlify Visual Editor ou outro) sem refazer o site.
