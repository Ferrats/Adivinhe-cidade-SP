# Adivinhe a Cidade — SP

Alpha 0.02 de um jogo geográfico mobile-first: observe a malha urbana sem nomes e tente marcar onde a cidade fica no estado de São Paulo.

## Como jogar

- Cada sessão sorteia 3 cidades distintas entre as 10 cadastradas.
- Você tem até 5 tentativas por cidade; mover o marcador não gasta tentativa.
- Cada erro revela distância e direção **do palpite para a cidade**, sem mostrar a resposta.
- Chegar a até 15 km do ponto central encerra a rodada com acerto. Essa margem não representa o limite municipal.
- A cidade só é revelada no acerto ou após o quinto erro.
- O resultado compara o melhor palpite com a cidade; o resumo mostra acertos e a média dos melhores palpites por cidade.

## Interface

- Mapa de palpite sobreposto, com painel inferior no celular.
- Histórico numerado e marcador laranja para o palpite ainda não confirmado.
- Zoom, posição e seleção preservados ao fechar e reabrir o painel dentro da mesma rodada.
- Botão “Ver todo o estado”, confirmação explícita e fechamento por Escape.
- Sem conta, banco de dados ou backend. Recarregar a página reinicia a sessão.

## Stack

React · TypeScript · Vite · MapLibre GL JS · OpenFreeMap / OpenStreetMap.

## Rodar localmente

```bash
corepack enable
pnpm install
pnpm dev
```

## Verificar

```bash
pnpm check
```

Os testes cobrem distância, direção, limite de acerto, tentativas, fim de rodada e seleção de cidades.

## Cloudflare Pages

- Build command: `pnpm run build`
- Build output directory: `dist`

## Princípios técnicos

1. Mobile first.
2. Static first.
3. Backend só quando uma funcionalidade justificar.
4. Provedor cartográfico deve continuar substituível.

## Próximos passos

Playtestar dificuldade e margem de acerto. Pistas extras, curiosidades, desafio diário, compartilhamento, streak e expansão das cidades ficam para próximas versões.
