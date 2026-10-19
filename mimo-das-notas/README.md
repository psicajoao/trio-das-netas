# Mimo das Notas — primeira versão jogável (clave de sol)

Jogo para crianças de 5 a 10 anos aprenderem a ler notas na clave de sol.
Uma nota por vez anda da direita para a esquerda na pauta; a criança toca a tecla certa no teclado de baixo.

**Tecnologia:** HTML + CSS + JavaScript puro (módulos ES), sem build e sem dependências. Roda no Chrome do Android
e pode ser instalado como app (PWA), funcionando offline. Escolhi isto por ser a solução mais simples e estável
para testar já no Android; depois dá para empacotar em APK/Google Play (ver "Próximas etapas").

## Como testar no Android (jeito mais simples)
1. No Chrome do Android abra: **https://psicajoao.github.io/trio-das-netas/mimo-das-notas/**
2. Menu do Chrome (⋮) → **Instalar app** (ou "Adicionar à tela inicial"). O ícone "Mimo" aparece na tela.
3. Abra pelo ícone, **com internet, uma vez**, e espere alguns segundos (o jogo se guarda no aparelho).
4. Depois disso funciona sem internet (teste em modo avião).
O aplicativo abre em tela cheia e deitado. Se o aparelho estiver em pé aparece o aviso "Gire o aparelho".

## Como rodar no computador (desenvolvimento)
```
cd mimo-das-notas
python3 -m http.server 8080        # ou: npx serve .
```
Abra http://localhost:8080 no Chrome. Para testar no celular na mesma rede: http://IP-DO-COMPUTADOR:8080
(o instalar/offline só funciona em https ou localhost).
Regras (sem navegador): `node tests/rules.test.mjs`. Depois de editar qualquer arquivo do jogo: `python3 build.py`
(gera ícones e o `sw.js` com nova versão, para o aparelho atualizar).

## Como se joga
- Fase 1 ensina Dó, Ré e Mi; as fases seguintes acrescentam notas (Fá, Sol, Lá, Si, Dó agudo).
- **Acerto:** a nota voa até a boca do Mimo, ele mastiga, saem estrelas, +10 pontos.
- **Erro** (tecla errada, tecla preta, ou a nota chegar à clave): a nota pega fogo, vai para a "fogueira de erros".
  O jogo continua.
- **Segunda chance:** no fim da sequência, as notas erradas voltam, uma por vez (a nota para no meio, com um aro amarelo).
  Errar só balança a nota. Depois de **2 erros na mesma nota, a tecla certa pisca**. Acerto vale +5 e apaga uma chama.
- **Estrelas** (conta os erros da 1ª rodada): 3★ = até 1 erro · 2★ = até 3 erros · 1★ = terminou a fase.
  As estrelas do topo mostram quantas ainda são possíveis. 1★ já libera a próxima fase.
- Pausa (botão amarelo): continuar, recomeçar, voltar às fases, ligar/desligar som e "cores de ajuda".
- **Cores de ajuda** (ligadas por padrão): o anel da nota e a faixa da tecla têm a mesma cor
  (Dó vermelho, Ré laranja, Mi amarelo, Fá verde, Sol turquesa, Lá azul, Si roxo). Desligue na tela de fases ou na pausa.

## Decisões a conhecer
- **Teclado:** 25 teclas, Dó central a Dó duas oitavas acima (na numeração Yamaha é "Dó3 a Dó5"; MIDI 60–84).
  Sem nomes nas teclas. Só teclas brancas são alvo; tocar numa preta conta como erro.
- **Linha suplementar:** o Dó central, para estar musicalmente correto na clave de sol, precisa de **uma** pequena
  linha suplementar abaixo da pauta. O brief pede Dó, Ré e Mi na fase 1 e também "sem linhas suplementares";
  as duas coisas não cabem juntas. Mantive só essa linha, e só no Dó central. Nenhuma outra nota usa linha
  suplementar (as fases vão de Dó4 a Dó5). Se preferir, começo a fase 1 em Mi-Fá-Sol: é só trocar `pool` em `js/phases.js`.
- **Oitavas:** a tecla tem que ser exatamente a da nota (Dó central ≠ Dó agudo).
- **Nota vazada:** a nota é um oval vazio (semibreve) para a linha aparecer por dentro.
- **Tempo:** a nota leva ~10 s para atravessar a pauta na fase 1 (8,5 s na fase 5).

## Estrutura
```
index.html            telas (inicial, fases, jogo, pausa, resultado)
css/style.css         visual (paleta do brief); tudo escala por uma unidade --u
js/notes.js           DEFINIÇÕES CENTRAIS: nome, posição na pauta, tecla, cor de cada nota
js/phases.js          fases (pool, tamanho, velocidade), sequência, pontos, estrelas  <- acrescente fases aqui
js/game.js            partida: nota móvel, acerto/erro, fogo, segunda chance, dica, fim
js/staff.js           pauta + clave + nota móvel (SVG)      js/clef.js  contorno da clave (Noto Music, OFL)
js/keyboard.js        teclado de 25 teclas                  js/mimo.js  personagem e efeitos
js/hud.js             topo, fogueira de erros               js/sound.js som (placeholders sintetizados)
js/store.js           progresso salvo no aparelho           js/main.js  telas e laço
tests/rules.test.mjs  testes das regras (pauta ↔ tecla, teclado, fases, estrelas)
build.py              gera ícones e sw.js
assets/mimo.png       Mimo recortado de referencia_mimo_original.png
```

## O que já funciona
Tela inicial · seleção de clave/fases (5 fases demonstrativas, bloqueio por estrelas, progresso salvo) · partida completa
(nota móvel, teclado multitoque, acerto/erro, fogueira, segunda chance, dica, pontos, estrelas ao vivo, pausa) ·
tela de resultado (tentar de novo / continuar) · cores de ajuda · offline · layout responsivo em paisagem · aviso em retrato.

## O que é provisório ou falta (sem enrolação)
- **Sons são placeholders** sintetizados (piano simples, "plim", "bup", mastigar). Trocar em `js/sound.js`.
- **Mimo tem uma única pose** (a original, recortada). As reações são movimentos (mastigar, balançar, pular) e
  pequenos efeitos (gota, estrelas). Poses novas (triste, comendo) dependem de arte nova do personagem.
- O recorte do Mimo foi feito por mim a partir da imagem de referência (que tinha fundo e outros elementos);
  as bordas podem ter pequenas imperfeições. O ideal é substituir por um PNG transparente original (`assets/mimo.png`).
- **Os PNGs de notas/teclado do pacote não foram usados**: as notas e o teclado são desenhados em código
  (nítidos em qualquer tela, com pauta visível dentro do oval, que o PNG cheio escondia).
  O fundo/colinas e nuvens são simples e provisórios (não é o cenário final).
- A clave de sol é o contorno de uma fonte musical livre (Noto Music), reduzida para caber.
- Ainda **não** há: clave de fá, duas pautas, linhas suplementares gerais, acordes, ritmos, melodias, MIDI externo
  (como pedido, ficam para etapas futuras; "Clave de Fá" aparece como "em breve").
- Não é salvo o meio de uma partida (só estrelas e preferências).
- **Não foi testado em aparelho Android de verdade** — só em Chromium simulado (ver relatório de testes).

## Próximas etapas sugeridas
APK / Google Play (empacotar este mesmo código com Capacitor ou Bubblewrap/TWA) · sons de piano reais ·
poses do Mimo · clave de fá · linhas suplementares · mais fases.
