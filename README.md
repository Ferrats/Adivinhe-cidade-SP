# Adivinhe a Cidade — SP

Alpha 0.01.1 de um jogo geográfico mobile-first: observe a malha urbana sem nomes e tente marcar onde a cidade fica no estado de São Paulo.

## Alpha 0.01

- 10 cidades de teste
- mapa misterioso sem labels
- palpite por toque no mapa de SP
- cálculo de distância em quilômetros
- comparação visual entre o palpite e a cidade correta
- contorno do estado e navegação limitada à região de jogo
- feedback de carregamento e falha dos mapas
- resumo com erro médio e melhor palpite
- sem conta, banco de dados ou backend

## Stack

- React
- TypeScript
- Vite
- MapLibre GL JS
- OpenFreeMap / OpenStreetMap

## Rodar localmente

```bash
corepack enable
pnpm install
pnpm dev
```

## Build

```bash
pnpm test
pnpm build
```

A saída estática é gerada em `dist/`, pronta para Cloudflare Pages.

### Cloudflare Pages

- Build command: `pnpm run build`
- Build output directory: `dist`

## Princípios técnicos

1. Mobile first.
2. Static first.
3. Backend só quando uma funcionalidade justificar.
4. Provedor cartográfico deve continuar substituível.

## Próximo objetivo

Playtestar o loop central antes de adicionar daily challenge, streak, ranking, 645 municípios ou qualquer infraestrutura adicional.
