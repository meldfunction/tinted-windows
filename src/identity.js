/**
 * src/identity.js — Consistent identity generation
 *
 * Generates plausible-but-fake identities scoped to a region and name style.
 * Used to fill signup forms in a way that's consistent per context but
 * doesn't link back to you.
 *
 * Rules:
 * - Same context always gets the same identity (seeded from context name)
 * - Identities are consistent with base region (timezone, zip, area code)
 * - DOB, phone, address are always fake — never derived from real data
 */

const NAMES = {
  'generic-anglo': {
    first_m: ['James','Oliver','Henry','Ethan','Lucas','Noah','Mason','Logan','Liam','Jack'],
    first_f: ['Emma','Sophie','Grace','Lily','Chloe','Ella','Ava','Mia','Ruby','Zoe'],
    last:    ['Smith','Johnson','Williams','Brown','Jones','Taylor','Davis','Miller','Wilson','Moore']
  },
  'hispanic': {
    first_m: ['Miguel','Carlos','Diego','Andres','Luis','Sebastian','Javier','Roberto','Pablo','Eduardo'],
    first_f: ['Sofia','Isabella','Valentina','Camila','Lucia','Elena','Gabriela','Monica','Rosa','Natalia'],
    last:    ['Garcia','Martinez','Rodriguez','Lopez','Hernandez','Gonzalez','Perez','Sanchez','Ramirez','Torres']
  },
  'east-asian': {
    first_m: ['Wei','Jun','Hao','Chen','Ming','Kevin','Brian','Ryan','Alex','Jason'],
    first_f: ['Mei','Lin','Xiu','Ying','Hui','Jessica','Amy','Lisa','Jenny','Tiffany'],
    last:    ['Wang','Li','Zhang','Liu','Chen','Yang','Huang','Zhao','Wu','Zhou']
  },
  'south-asian': {
    first_m: ['Arjun','Rohan','Aditya','Rahul','Vikram','Nikhil','Priya','Siddharth','Karan','Aman'],
    first_f: ['Priya','Ananya','Kavya','Ishaan','Shreya','Divya','Pooja','Neha','Riya','Aisha'],
    last:    ['Patel','Sharma','Singh','Kumar','Gupta','Rao','Nair','Iyer','Reddy','Mehta']
  }
};

const REGIONS = {
  'US-West': {
    timezone:  'America/Los_Angeles',
    state:     'CA',
    state_full: 'California',
    zip_prefix: ['901','902','903','904','905','906','907','908','910','911'],
    area_codes: ['213','310','323','424','442','510','562','619','626','650','657','661','714','747','760','805','818','831','858','909','916','925','949','951'],
    country:   'US'
  },
  'US-East': {
    timezone:  'America/New_York',
    state:     'NY',
    state_full: 'New York',
    zip_prefix: ['100','101','102','103','104','110','111','112','113','114'],
    area_codes: ['212','332','347','516','585','607','631','646','716','718','845','914','917','929'],
    country:   'US'
  },
  'US-Midwest': {
    timezone:  'America/Chicago',
    state:     'IL',
    state_full: 'Illinois',
    zip_prefix: ['606','607','608','609','610','611','612','613','614','615'],
    area_codes: ['217','224','309','312','331','447','464','630','708','773','779','815','847','872'],
    country:   'US'
  },
  'UK': {
    timezone:  'Europe/London',
    state:     '',
    state_full: '',
    zip_prefix: ['SW','SE','N','E','W','EC','WC','NW'],
    area_codes: ['020','0161','0121','0113'],
    country:   'GB'
  }
};

export class IdentityGen {
  constructor() {
    this.region    = process.env.PANE_BASE_REGION    || 'US-West';
    this.nameStyle = process.env.PANE_NAME_STYLE     || 'generic-anglo';
    this.fakeFields = (process.env.PANE_FAKE_FIELDS  || 'dob,phone,address').split(',');
  }

  /**
   * Generate a consistent identity.
   * Pass a seed string to get a deterministic result for the same context.
   * @param {string} [seed] - Optional seed (context name) for determinism
   * @returns {object} identity
   */
  generate(seed = null) {
    const rng    = seed ? this.#seededRng(seed) : Math.random.bind(Math);
    const names  = NAMES[this.nameStyle] || NAMES['generic-anglo'];
    const region = REGIONS[this.region]  || REGIONS['US-West'];

    const isFemale    = rng() > 0.5;
    const first_name  = this.#pick(isFemale ? names.first_f : names.first_m, rng);
    const last_name   = this.#pick(names.last, rng);
    const middle_init = String.fromCharCode(65 + Math.floor(rng() * 26));

    const dob   = this.#fakeDOB(rng);
    const zip   = this.#pick(region.zip_prefix, rng) + String(Math.floor(rng() * 9000) + 1000).slice(0,2);
    const phone = this.#fakePhone(region.area_codes, rng);

    return {
      first_name,
      last_name,
      middle_initial: middle_init,
      full_name:      `${first_name} ${last_name}`,
      gender:         isFemale ? 'F' : 'M',
      dob,
      dob_month: dob.split('-')[1],
      dob_day:   dob.split('-')[2],
      dob_year:  dob.split('-')[0],
      phone,
      address: {
        street:   `${Math.floor(rng() * 9000) + 1000} ${this.#pick(['Oak','Maple','Cedar','Pine','Elm','Washington','Lincoln','Park','Lake','River'], rng)} ${this.#pick(['St','Ave','Blvd','Dr','Ln','Way'], rng)}`,
        city:     this.#pick(['Springfield','Riverside','Fairview','Madison','Georgetown','Franklin','Clinton','Salem','Greenville','Bristol'], rng),
        state:    region.state,
        zip,
        country:  region.country
      },
      timezone: region.timezone
    };
  }

  #fakeDOB(rng) {
    // Generate DOB for a plausible adult (25–55 years old)
    const year  = new Date().getFullYear() - 25 - Math.floor(rng() * 30);
    const month = String(Math.floor(rng() * 12) + 1).padStart(2, '0');
    const day   = String(Math.floor(rng() * 28) + 1).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  #fakePhone(areaCodes, rng) {
    const area = this.#pick(areaCodes, rng);
    const num  = String(Math.floor(rng() * 9000000) + 1000000);
    return `${area}-${num.slice(0,3)}-${num.slice(3,7)}`;
  }

  #pick(arr, rng) {
    return arr[Math.floor(rng() * arr.length)];
  }

  // Simple deterministic RNG from string seed (mulberry32)
  #seededRng(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
    }
    let s = h >>> 0;
    return function() {
      s += 0x6D2B79F5;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
}
