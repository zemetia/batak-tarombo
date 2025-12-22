import { v4 as uuidv4 } from 'uuid';

export interface Ancestor {
  id: string;
  name: string;
  generation: number;
  wife?: string | null;
  description?: string | null;
  birthOrder?: number;
  gender?: 'MALE' | 'FEMALE'; // Default MALE
  isAlive?: boolean;
  alternativeNames?: string[];
  children?: Ancestor[];
  fatherId?: string | null;
}

// Helper to create IDs consistently if needed, but for now we generate them.
// We will construct the tree from top to bottom.

// ============================================================================
// GENERATION 1
// ============================================================================
const siRajaBatak: Ancestor = {
  id: uuidv4(),
  name: 'Si Raja Batak',
  generation: 1,
  wife: 'Si Boru Deak Parujar', // Often cited, though myth varies
  birthOrder: 1,
  children: [] // Populated below
};

// ============================================================================
// GENERATION 2 (Sons of Si Raja Batak)
// ============================================================================
const guruTateaBulan: Ancestor = {
  id: uuidv4(),
  name: 'Guru Tatea Bulan',
  generation: 2,
  birthOrder: 1,
  wife: 'Si Boru Baso Burning',
  children: []
};

const rajaIsumbaon: Ancestor = {
    id: uuidv4(),
    name: 'Raja Isumbaon',
    generation: 2,
    birthOrder: 2,
    children: []
};

siRajaBatak.children?.push(guruTateaBulan, rajaIsumbaon);

// ============================================================================
// GENERATION 3 (Children of Guru Tatea Bulan)
// ============================================================================
// 1. Raja Biakbiak (Raja Uti)
// 2. Saribu Raja
// 3. Limbong Mulana
// 4. Sagala Raja
// 5. Silau Raja
// Daughters: Si Boru Pareme, etc. (Omitted for brevity unless requested as main line)

const rajaBiakbiak: Ancestor = {
    id: uuidv4(),
    name: 'Raja Biakbiak',
    generation: 3,
    birthOrder: 1,
    alternativeNames: ['Raja Uti', 'Gumelenggeleng'],
    children: [] // Often said to have no descendants or is special
};

const saribuRaja: Ancestor = {
    id: uuidv4(),
    name: 'Saribu Raja',
    generation: 3,
    birthOrder: 2,
    children: []
};

const limbongMulana: Ancestor = {
    id: uuidv4(),
    name: 'Limbong Mulana',
    generation: 3,
    birthOrder: 3,
    children: []
};

const sagalaRaja: Ancestor = {
    id: uuidv4(),
    name: 'Sagala Raja',
    generation: 3,
    birthOrder: 4,
    children: []
};


const silauRaja: Ancestor = {
    id: uuidv4(),
    name: 'Silau Raja',
    generation: 3,
    birthOrder: 5,
    children: []
};

guruTateaBulan.children?.push(rajaBiakbiak, saribuRaja, limbongMulana, sagalaRaja, silauRaja);

// ============================================================================
// GENERATION 3 (Children of Raja Isumbaon)
// ============================================================================
// 1. Tuan Sori Mangaraja
// 2. Raja Asiasi
// 3. Sangkar Somalidang

const tuanSoriMangaraja: Ancestor = {
    id: uuidv4(),
    name: 'Tuan Sori Mangaraja',
    generation: 3,
    birthOrder: 1,
    children: []
};

const rajaAsiasi: Ancestor = {
    id: uuidv4(),
    name: 'Raja Asiasi',
    generation: 3,
    birthOrder: 2,
    children: []
};

const sangkarSomalidang: Ancestor = {
    id: uuidv4(),
    name: 'Sangkar Somalidang',
    generation: 3,
    birthOrder: 3,
    children: []
};

rajaIsumbaon.children?.push(tuanSoriMangaraja, rajaAsiasi, sangkarSomalidang);


// ============================================================================
// GENERATION 4 (Children of Saribu Raja - GTB Line)
// ============================================================================
// 1. Raja Lontung (Mother: Si Boru Pareme)
// 2. Raja Borbor (Mother: Nai Manggiring Laut)

const rajaLontung: Ancestor = {
    id: uuidv4(),
    name: 'Raja Lontung',
    generation: 4,
    birthOrder: 1,
    wife: 'Si Boru Pareme',
    children: []
};

const rajaBorbor: Ancestor = {
    id: uuidv4(),
    name: 'Raja Borbor',
    generation: 4,
    birthOrder: 2,
    children: []
};

saribuRaja.children?.push(rajaLontung, rajaBorbor);

// ============================================================================
// GENERATION 4 (Children of Tuan Sori Mangaraja - Isumbaon Line)
// ============================================================================
// 1. Tuan Sorbadijulu (Nai Ambaton)
// 2. Tuan Sorbadijae (Datu Pejel / Nai Rasaon)
// 3. Tuan Sorbadibanua (Nai Suanon)

const tuanSorbadijulu: Ancestor = {
    id: uuidv4(),
    name: 'Tuan Sorbadijulu',
    alternativeNames: ['Raja Nai Ambaton'],
    generation: 4,
    birthOrder: 1,
    children: []
};

const tuanSorbadijae: Ancestor = {
    id: uuidv4(),
    name: 'Tuan Sorbadijae',
    alternativeNames: ['Datu Pejel', 'Raja Nai Rasaon'],
    generation: 4,
    birthOrder: 2,
    children: []
};

const tuanSorbadibanua: Ancestor = {
    id: uuidv4(),
    name: 'Tuan Sorbadibanua',
    alternativeNames: ['Raja Nai Suanon'],
    generation: 4,
    birthOrder: 3,
    children: []
};

tuanSoriMangaraja.children?.push(tuanSorbadijulu, tuanSorbadijae, tuanSorbadibanua);


// ============================================================================
// GENERATION 5 (Detailed branches)
// ============================================================================

// --- LONTUNG BRANCH (Children of Raja Lontung) ---
const lontungChildrenData = [
    { name: 'Toga Sinaga', order: 1 },
    { name: 'Toga Situmorang', order: 2 },
    { name: 'Toga Pandiangan', order: 3 },
    { name: 'Toga Nainggolan', order: 4 },
    { name: 'Toga Simatupang', order: 5 },
    { name: 'Toga Aritonang', order: 6 },
    { name: 'Toga Siregar', order: 7 },
];

lontungChildrenData.forEach(child => {
    rajaLontung.children?.push({
        id: uuidv4(),
        name: child.name,
        generation: 5,
        birthOrder: child.order,
        children: []
    });
});

// --- BORBOR BRANCH (Children of Raja Borbor) ---
// Minimal detail for now as focus is Sitorus Pane (Isumbaon line)
rajaBorbor.children?.push({
    id: uuidv4(),
    name: 'Balwa',
    generation: 5,
    birthOrder: 1,
    children: [] // and descendants like Datu Dalu, Saragih, etc.
});


// --- NAI AMBATON BRANCH (Children of Tuan Sorbadijulu) ---
const naiAmbatonChildren = [
    { name: 'Simbolon Tua', order: 1 },
    { name: 'Tamba Tua', order: 2 },
    { name: 'Saragi Tua', order: 3 },
    { name: 'Munte Tua', order: 4 },
    { name: 'Nahampun Tua', order: 5 } // Tradition varies
];
naiAmbatonChildren.forEach(child => {
    tuanSorbadijulu.children?.push({
        id: uuidv4(),
        name: child.name,
        generation: 5,
        birthOrder: child.order,
        children: []
    });
});


// --- NAI RASAON BRANCH (Children of Tuan Sorbadijae) ---
// Focus Line for Sitorus
const rajaNarasaon: Ancestor = {
    id: uuidv4(),
    name: 'Raja Mangarerak', // Also known as Raja Narasaon? Wikipedia says Tuan Sorbadijae had son Raja Narasaon.
    alternativeNames: ['Raja Narasaon'],
    generation: 5,
    birthOrder: 1,
    children: []
};
tuanSorbadijae.children?.push(rajaNarasaon);


// --- NAI SUANON BRANCH (Children of Tuan Sorbadibanua) ---
const naiSuanonChildren = [
    { name: 'Sibagot ni Pohan', order: 1 },
    { name: 'Sipaettua', order: 2 },
    { name: 'Silahisabungan', order: 3 },
    { name: 'Raja Oloan', order: 4 },
    { name: 'Raja Hutalima', order: 5 },
    { name: 'Raja Sumba', order: 6 },
    { name: 'Raja Sobu', order: 7 },
    { name: 'Raja Naipospos', order: 8 }
];
naiSuanonChildren.forEach(child => {
    tuanSorbadibanua.children?.push({
        id: uuidv4(),
        name: child.name,
        generation: 5,
        birthOrder: child.order,
        children: []
    });
});

// ============================================================================
// GENERATION 6 (Descendants of Raja Narasaon - Sitorus Line)
// ============================================================================
// Wikipedia: Raja Narasaon had a son Raja Mangatur.

const rajaMangatur: Ancestor = {
    id: uuidv4(),
    name: 'Raja Mangatur',
    generation: 6,
    birthOrder: 1,
    children: []
};
// Note: Raja Narasaon also had Raja Natoras? Wikipedia mentioned Mangatur.
rajaNarasaon.children?.push(rajaMangatur);


// ============================================================================
// GENERATION 7 (Descendants of Raja Mangatur)
// ============================================================================
// Wikipedia: Raja Mangatur -> Raja Sitorus (or Toga Raja Sitorus), Raja Sirait, Raja Butarbutar

const rajaSitorus: Ancestor = {
    id: uuidv4(),
    name: 'Raja Sitorus',
    alternativeNames: ['Toga Raja Sitorus'],
    generation: 7,
    birthOrder: 1, // Usually 3 sons: Sitorus, Sirait, Butarbutar. Order varies.
    children: []
};

const rajaSirait: Ancestor = {
    id: uuidv4(),
    name: 'Raja Sirait',
    generation: 7,
    birthOrder: 2,
    children: []
};

const rajaButarbutar: Ancestor = {
    id: uuidv4(),
    name: 'Raja Butarbutar',
    generation: 7,
    birthOrder: 3,
    children: []
};

rajaMangatur.children?.push(rajaSitorus, rajaSirait, rajaButarbutar);


// ============================================================================
// GENERATION 8 (Descendants of Raja Sitorus)
// ============================================================================
// Children: Raja Pane, Raja Dori, Raja Boltok

const rajaPane: Ancestor = {
    id: uuidv4(),
    name: 'Raja Pane',
    generation: 8,
    birthOrder: 1,
    children: []
};

const rajaDori: Ancestor = {
    id: uuidv4(),
    name: 'Raja Dori',
    generation: 8,
    birthOrder: 2,
    children: []
};

const rajaBoltok: Ancestor = {
    id: uuidv4(),
    name: 'Raja Boltok',
    generation: 8,
    birthOrder: 3,
    children: []
};

rajaSitorus.children?.push(rajaPane, rajaDori, rajaBoltok);

// ============================================================================
// GENERATION 9 (Descendants of Raja Pane - Sitorus Pane)
// ============================================================================
// Children of Raja Pane: Sitorus Pane (as the clan progenitor, often just "Pane" descendants)
// Wikipedia says Sitorus Pane is the branch.
// Specific descendants: Raja Uluan, Pande Sionggang.
// I'll add "Sitorus Pane" as a person or the immediate sons if "Sitorus Pane" implies the sub-marga. 
// User asked to "Sitorus Pane generation". 
// If Raja Pane is the father of the 'Pane' lineage, his children are the first 'Sitorus Pane'.
// Let's add his children:

const sitorusPaneChildren = [
    { name: 'Raja Uluan', order: 1 },
    { name: 'Pande Sionggang', order: 2 }
];

sitorusPaneChildren.forEach(child => {
    rajaPane.children?.push({
         id: uuidv4(),
         name: child.name,
         description: 'Progenitor of Sitorus Pane sub-marga',
         generation: 9,
         birthOrder: child.order,
         children: []
    });
});


export const lineageData: Ancestor = siRajaBatak;
