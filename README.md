# Adivinhe a Cidade — SP

Alpha 0.03 de um jogo geográfico mobile-first: observe o mapa sem nomes e digite o município paulista.

## Como jogar

- Cada sessão sorteia **3 cidades distintas** entre os 10 desafios cadastrados.
- São **5 tentativas por cidade**. Qualquer um dos 645 municípios de SP é um palpite válido.
- O autocomplete aceita texto sem acentos e ignora diferenças de maiúsculas e espaços. Nomes inválidos e palpites repetidos não gastam tentativas.
- Cada erro mostra a distância aproximada em linha reta e a direção **do município digitado para a cidade misteriosa**. São pontos de referência municipais, não distâncias de viagem ou limites territoriais.
- O acerto exige o **município correto**, identificado pelo código IBGE. Estar a menos de 15 km não conta como acerto.
- A resposta aparece somente ao acertar ou após o quinto erro. No acerto não há seta.
- O resumo mostra acertos, tentativas de cada rodada e média de tentativas somente das cidades acertadas.
- Uma nova sessão sorteia novamente. Recarregar a página reinicia o jogo.

## Dados e custo

O catálogo de nomes, códigos e coordenadas fica no próprio site (~44 KB antes de compressão). Autocomplete, validação e pistas não fazem requisições a APIs em tempo de jogo. Os mapas continuam dependendo de OpenFreeMap/OpenStreetMap e de conexão.

- Coordenadas: [kelvins/municipios-brasileiros](https://github.com/kelvins/municipios-brasileiros), arquivo `csv/municipios.csv`, revisão `503e2f70bbf1b4b7ec0b1f68b09086ccc38fe861`.
- Nomes e códigos: conferidos com a [API de localidades do IBGE](https://servicodados.ibge.gov.br/api/v1/localidades/estados/35/municipios?orderBy=nome) em 20/09/2026. Os 645 códigos coincidem. Grafias de Biritiba Mirim, Florínea e Itaoca seguem a lista oficial; as variantes do catálogo de coordenadas também são aceitas.
- A base de coordenadas é comunitária; não é apresentada como geocodificação oficial do IBGE. Pequenas diferenças entre esses pontos e o centro visual do mapa são esperadas.
- Licença MIT dos dados preservada em `public/municipalities-LICENSE.txt`, distribuída junto com o site.

Para atualizar o catálogo, baixe o CSV da revisão desejada e a lista oficial de SP, revise mudanças e execute:

```bash
python scripts/import-municipalities.py /caminho/municipios.csv /caminho/ibge-sp.json
pnpm check
```

O importador exige correspondência dos 645 códigos. Uma mudança territorial deve ser revisada antes de alterar essa validação. As coordenadas em `src/municipalities.json` estão na ordem `[longitude, latitude]`; `src/data.ts` mantém os 10 desafios visuais e seus códigos municipais.

## Desenvolvimento

React · TypeScript · Vite · MapLibre GL JS.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

```bash
pnpm check
```

A verificação executa testes das pistas, direção geográfica, validação, cinco tentativas, catálogo, sorteio e pontuação, além do build de produção.

## Cloudflare Pages

- Build command: `pnpm run build`
- Build output directory: `dist`
- Sem conta, banco de dados ou backend.

## Próximos passos

Playtestar a dificuldade das pistas e dos 10 mapas. Desafio diário, compartilhamento, persistência, streak e expansão do conjunto de desafios ficam para próximas versões.
