export type City = {
  id: string
  name: string
  center: [number, number]
  zoom: number
}

export const cities: City[] = [
  { id: 'sao-paulo', name: 'São Paulo', center: [-46.6333, -23.5505], zoom: 9.2 },
  { id: 'santos', name: 'Santos', center: [-46.3289, -23.9608], zoom: 11.4 },
  { id: 'campinas', name: 'Campinas', center: [-47.0608, -22.9056], zoom: 10.3 },
  { id: 'sao-jose-dos-campos', name: 'São José dos Campos', center: [-45.8841, -23.1896], zoom: 10.2 },
  { id: 'ribeirao-preto', name: 'Ribeirão Preto', center: [-47.8103, -21.1775], zoom: 10.5 },
  { id: 'sorocaba', name: 'Sorocaba', center: [-47.4526, -23.5015], zoom: 10.4 },
  { id: 'presidente-prudente', name: 'Presidente Prudente', center: [-51.3889, -22.1256], zoom: 10.8 },
  { id: 'sao-jose-do-rio-preto', name: 'São José do Rio Preto', center: [-49.3794, -20.8113], zoom: 10.7 },
  { id: 'barretos', name: 'Barretos', center: [-48.5678, -20.5531], zoom: 11.1 },
  { id: 'olimpia', name: 'Olímpia', center: [-48.9147, -20.7366], zoom: 11.4 },
]

export const SP_BOUNDS: [[number, number], [number, number]] = [
  [-53.12, -25.35],
  [-44.05, -19.72],
]
