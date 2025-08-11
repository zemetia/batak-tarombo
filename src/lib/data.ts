import { v4 as uuidv4 } from 'uuid';

export interface Ancestor {
  id: string;
  name: string;
  generation: number;
  wife?: string;
  description?: string;
  birthOrder?: number;
  fatherId?: string | null;
  children?: Ancestor[];
}


const siRajaBatakId = uuidv4();
const guruTateaBulanId = uuidv4();
const rajaIsumbaonId = uuidv4();
const rajaBiakbiakId = uuidv4();
const saribuRajaId = uuidv4();
const rajaLontungId = uuidv4();
const rajaBorborId = uuidv4();
const togaSinagaId = uuidv4();
const togaSitumorangId = uuidv4();
const togaPandianganId = uuidv4();
const togaNainggolanId = uuidv4();
const togaSimatupangId = uuidv4();
const togaAritonangId = uuidv4();
const togaSitorusId = uuidv4();
const situmorangSuhutnihutaId = uuidv4();
const situmorangSiringoringoId = uuidv4();
const sitorusPaneId = uuidv4();
const sitorusDoriId = uuidv4();
const sitorusBoltokId = uuidv4();
const tuanSoriMangarajaId = uuidv4();
const rajaAsiasiId = uuidv4();
const sangkarSomalidangId = uuidv4();
const naiAmbatonId = uuidv4();
const simbolonId = uuidv4();
const saragihId = uuidv4();
const damanikId = uuidv4();
const purbaId = uuidv4();


export const lineageData: Ancestor = {
  id: siRajaBatakId,
  name: 'Si Raja Batak',
  generation: 1,
  wife: 'Si Boru Deak Parujar',
  birthOrder: 1,
  children: [
    {
      id: guruTateaBulanId,
      name: 'Guru Tatea Bulan',
      generation: 2,
      birthOrder: 1,
      fatherId: siRajaBatakId,
      children: [
        {
          id: rajaBiakbiakId,
          name: 'Raja Biakbiak',
          generation: 3,
           birthOrder: 1,
          fatherId: guruTateaBulanId,
        },
        {
          id: saribuRajaId,
          name: 'Saribu Raja',
          generation: 3,
           birthOrder: 2,
          fatherId: guruTateaBulanId,
          children: [
             {
              id: rajaLontungId,
              name: 'Raja Lontung',
              generation: 4,
              wife: 'Si Boru Pareme',
               birthOrder: 1,
              fatherId: saribuRajaId,
              children: [
                { id: togaSinagaId, name: 'Toga Sinaga', generation: 5, wife: 'Boru huta',  birthOrder: 1, fatherId: rajaLontungId },
                { 
                  id: togaSitumorangId, 
                  name: 'Toga Situmorang', 
                  generation: 5,
                  wife: 'Boru huta',
                   birthOrder: 2,
                  fatherId: rajaLontungId,
                  children: [
                    { id: situmorangSuhutnihutaId, name: 'Situmorang Suhutnihuta', generation: 6, birthOrder: 1, fatherId: togaSitumorangId },
                    { id: situmorangSiringoringoId, name: 'Situmorang Siringoringo', generation: 6, birthOrder: 2, fatherId: togaSitumorangId },
                  ]
                },
                { id: togaPandianganId, name: 'Toga Pandiangan', generation: 5, wife: 'Boru huta',  birthOrder: 3, fatherId: rajaLontungId },
                { id: togaNainggolanId, name: 'Toga Nainggolan', generation: 5, wife: 'Boru huta',  birthOrder: 4, fatherId: rajaLontungId },
                { id: togaSimatupangId, name: 'Toga Simatupang', generation: 5, wife: 'Boru huta',  birthOrder: 5, fatherId: rajaLontungId },
                { id: togaAritonangId, name: 'Toga Aritonang', generation: 5, wife: 'Boru huta',  birthOrder: 6, fatherId: rajaLontungId },
                { 
                  id: togaSitorusId, 
                  name: 'Toga Sitorus', 
                  generation: 5,
                  wife: 'Boru huta',
                   birthOrder: 7,
                  fatherId: rajaLontungId,
                  children: [
                    { id: sitorusPaneId, name: 'Sitorus Pane', generation: 6,  birthOrder: 1, fatherId: togaSitorusId },
                    { id: sitorusDoriId, name: 'Sitorus Dori', generation: 6,  birthOrder: 2, fatherId: togaSitorusId },
                    { id: sitorusBoltokId, name: 'Sitorus Boltok', generation: 6,  birthOrder: 3, fatherId: togaSitorusId },
                  ]
                },
              ]
            },
            {
              id: rajaBorborId,
              name: 'Raja Borbor',
              generation: 4,
               birthOrder: 2,
              fatherId: saribuRajaId,
            },
          ]
        },
      ],
    },
    {
      id: rajaIsumbaonId,
      name: 'Raja Isumbaon',
      generation: 2,
      birthOrder: 2,
      fatherId: siRajaBatakId,
      children: [
        {
          id: tuanSoriMangarajaId,
          name: 'Tuan Sori Mangaraja',
          generation: 3,
          wife: 'Si Boru Anting-anting',
           birthOrder: 1,
          fatherId: rajaIsumbaonId,
           children: [
             {
              id: naiAmbatonId,
              name: 'Nai Ambaton (Parna)',
              generation: 4,
               birthOrder: 1,
              fatherId: tuanSoriMangarajaId,
              children: [
                { id: simbolonId, name: 'Simbolon', generation: 5,  birthOrder: 1, fatherId: naiAmbatonId },
                { id: saragihId, name: 'Saragih', generation: 5,  birthOrder: 2, fatherId: naiAmbatonId },
                { id: damanikId, name: 'Damanik', generation: 5,  birthOrder: 3, fatherId: naiAmbatonId },
                { id: purbaId, name: 'Purba', generation: 5,  birthOrder: 4, fatherId: naiAmbatonId },
              ]
            },
          ]
        },
         {
          id: rajaAsiasiId,
          name: 'Raja Asiasi',
          generation: 3,
           birthOrder: 2,
          fatherId: rajaIsumbaonId,
        },
         {
          id: sangkarSomalidangId,
          name: 'Sangkar Somalidang',
          generation: 3,
           birthOrder: 3,
          fatherId: rajaIsumbaonId,
        },
      ],
    },
  ],
};
