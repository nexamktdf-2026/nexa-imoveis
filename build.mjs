// Gera o site estático a partir de /content (imóveis em JSON + config). Sem dependências.
import fs from "fs";import path from "path";
const R=process.cwd(),CONTENT=process.env.CONTENT_DIR||path.join(R,"content"),OUT=process.env.OUT_DIR||path.join(R,"dist");
const rj=f=>JSON.parse(fs.readFileSync(f,"utf8"));
const cfg=fs.existsSync(path.join(CONTENT,"config.json"))?rj(path.join(CONTENT,"config.json")):{};
const site=(cfg.siteUrl||process.env.URL||"").replace(/\/$/,"");
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
const slugify=s=>String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const ST={disponivel:"Disponível",reservado:"Reservado",vendido:"Vendido",alugado:"Alugado",indisponivel:"Indisponível"};
const money=n=>typeof n==="number"?n.toLocaleString("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}):String(n);
const has=v=>v!==undefined&&v!==null&&v!==""&&!(Array.isArray(v)&&!v.length);
// 1) ler imóveis: só publicados e não arquivados entram no site
const dir=path.join(CONTENT,"imoveis");const items=[];
for(const f of fs.existsSync(dir)?fs.readdirSync(dir).filter(x=>x.endsWith(".json")):[]){
  const r=rj(path.join(dir,f));
  if(!r.publicado||r.arquivado)continue;
  if(!r.codigo||!r.titulo){console.warn("AVISO: "+f+" sem código/título, ignorado");continue}
  const L=r.localizacao||{},fotos=[r.imagemPrincipal,...(r.galeria||[])].filter(Boolean);
  if(!r.imagemPrincipal)console.warn("AVISO: "+r.codigo+" sem imagem principal");
  const car=[...(r.caracteristicas||[]),...(r.diferenciais||[])];if(r.suites)car.unshift(r.suites+" suíte(s)");
  const fin=[r.financiamento,r.condicao,r.entrada&&"Entrada: "+r.entrada,r.obsComercial,r.minhaCasaMinhaVida&&"Minha Casa Minha Vida: sujeito às regras do programa e à análise de cada pessoa."].filter(has).join(" · ");
  const slug=r.slug||slugify(r.codigo+"-"+r.titulo);
  const i={id:r.id||r.codigo,codigo:r.codigo,titulo:r.titulo,slug,tipo:r.tipo,finalidade:r.finalidade,status:ST[r.status],destaque:!!r.destaque,
   cidade:L.cidade,bairro:L.bairro,local:[L.bairro,L.cidade].filter(Boolean).join(", ")||L.regiao,referencia:L.referencia,
   preco:has(r.preco)?money(r.preco):undefined,precoNum:typeof r.preco==="number"?r.preco:undefined,
   metragem:has(r.area)?r.area+" m²":undefined,quartos:r.quartos,banheiros:r.banheiros,vagas:r.vagas,
   descricao:r.descricao,descricaoCurta:r.descricaoCurta,caracteristicas:car,financiamento:fin||undefined,fotos,data:r.dataCadastro,seo:r.seo||{}};
  for(const k in i)if(!has(i[k])&&i[k]!==false)delete i[k];
  items.push(i)}
const seen=new Set();for(const i of items){if(seen.has(i.slug))throw new Error("slug duplicado: "+i.slug);seen.add(i.slug)}
// 2) saída
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const cp=(a,b)=>fs.existsSync(a)&&fs.cpSync(a,b,{recursive:true});
cp(path.join(R,"static"),OUT);cp(path.join(R,"admin"),path.join(OUT,"admin"));
const tpl=fs.readFileSync(path.join(R,"src/index.html"),"utf8");
const J=o=>JSON.stringify(o).replace(/</g,"\\u003c").replace(/\u2028|\u2029/g,"");
const data=(open)=>`var WHATS=${J(String(cfg.whatsapp||"").replace(/\D/g,""))};var CONTATO=${J({telefone:cfg.telefone||"",endereco:cfg.endereco||"",horario:cfg.horario||"",instagram:cfg.instagram||"",email:cfg.email||"",creci:cfg.creci||""})};var HISTORIA=${J(cfg.historia||"")};var IMOVEIS=${J(items)};`+(open?`window.OPEN=${J(String(open))};`:"");
let an="";const a=cfg.analytics||{};
if(a.gtmId)an+=`<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':Date.now(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f)})(window,document,'script','dataLayer',${J(a.gtmId)});</script>`;
if(a.ga4Id)an+=`<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(a.ga4Id)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${J(a.ga4Id)});</script>`;
const page=(open,head)=>{let h=tpl.replace("/*__DATA__*/",()=>data(open)).replace("<!--__ANALYTICS__-->",()=>head+an);return h};
fs.writeFileSync(path.join(OUT,"index.html"),page(null,site?`<link rel="canonical" href="${site}/">`:""));
const urls=[site+"/"];
for(const i of items){
  const where=[i.tipo,i.cidade&&"em "+i.cidade].filter(Boolean).join(" ");
  const title=i.seo.title||`${i.titulo}${where?" – "+where:""} | NEXA Imóveis`;
  const desc=i.seo.description||i.descricaoCurta||[i.titulo,where,i.codigo&&"Código "+i.codigo].filter(Boolean).join(". ")+". Fale com a NEXA Imóveis.";
  const url=site?`${site}/imoveis/${i.slug}/`:"",img=i.fotos&&i.fotos[0]?(site&&i.fotos[0].startsWith("/")?site:"")+i.fotos[0]:"";
  const ld={"@context":"https://schema.org","@type":"RealEstateListing",name:i.titulo,description:desc};
  if(url)ld.url=url;if(img)ld.image=img;if(i.precoNum)ld.offers={"@type":"Offer",price:i.precoNum,priceCurrency:"BRL"};
  const head=`<meta property="og:type" content="website">${url?`<link rel="canonical" href="${url}"><meta property="og:url" content="${url}">`:""}${img?`<meta property="og:image" content="${esc(img)}">`:""}<script type="application/ld+json">${J(ld)}</script>`;
  let h=page(i.id,head).replace(/<title>.*?<\/title>/,()=>`<title>${esc(title)}</title>`).replace(/(<meta name="description" content=")[^"]*/,(m,p)=>p+esc(desc)).replace(/(<meta property="og:title" content=")[^"]*/,(m,p)=>p+esc(title)).replace(/(<meta property="og:description" content=")[^"]*/,(m,p)=>p+esc(desc));
  fs.mkdirSync(path.join(OUT,"imoveis",i.slug),{recursive:true});fs.writeFileSync(path.join(OUT,"imoveis",i.slug,"index.html"),h);urls.push(url)}
fs.writeFileSync(path.join(OUT,"robots.txt"),`User-agent: *\nDisallow: /admin/\n`+(site?`Sitemap: ${site}/sitemap.xml\n`:""));
if(site)fs.writeFileSync(path.join(OUT,"sitemap.xml"),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${u}</loc></url>`).join("")}</urlset>`);
console.log(`OK: ${items.length} imóvel(is) publicado(s) → ${OUT}`);
