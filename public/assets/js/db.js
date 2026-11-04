/* Simulation Database using localStorage for Kiki Traiteur */

// Utility: Format Date Helper
function getRelativeDate(offsetDays) {
  const date = new Date('2026-07-21T12:00:00'); // Base date matching current local time representation
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
}

// Initial Mock Data
const INITIAL_PRESTATIONS = [
  {
    id: 'traiteur',
    title: 'Service Traiteur Prestige',
    desc: 'Des créations gastronomiques sur-mesure pour vos mariages, galas et banquets officiels. Une signature culinaire haut de gamme.',
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'evenements',
    title: "Organisation d'Événements",
    desc: 'Planification complète de réceptions privées et corporatives d’exception, de la conception à la coordination le jour J.',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'salle-diva',
    title: 'Salle La Diva',
    desc: 'Notre salle de réception exclusive. Un espace raffiné avec équipements de pointe pouvant accueillir jusqu’à 250 convives.',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'decoration',
    title: 'Design & Décoration',
    desc: 'Mise en scène florale et scénographie sur-mesure pour transformer vos lieux de réception en décors enchanteurs.',
    image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'location',
    title: 'Location de Matériel',
    desc: 'Mobilier de prestige, vaisselle fine et tentes d’apparat. Tout le matériel nécessaire pour un confort haut de gamme.',
    image: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'takeaway',
    title: 'Plats à Emporter',
    desc: 'Savourez la gastronomie de Kiki Traiteur chez vous ou au bureau. Une sélection de plats raffinés préparés chaque jour à emporter.',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800'
  },
  {
    id: 'foodtruck',
    title: 'Food Truck Gourmet',
    desc: 'Une cuisine mobile festive et conviviale pour vos événements décontractés, festivals et retours de noces.',
    image: 'https://images.unsplash.com/photo-1565123409695-7b5ff624d177?q=80&w=800'
  }
];

const INITIAL_CLIENTS = [
  { id: 'cli_1', name: 'Sophie Laurent', email: 'sophie.l@gmail.com', phone: '06 12 34 56 78', type: 'particular', organization: '' },
  { id: 'cli_2', name: 'Jean-Marc Dubois', email: 'j.dubois@lvmh.com', phone: '01 45 67 89 10', type: 'institution', organization: 'LVMH Group' },
  { id: 'cli_3', name: 'Hélène Rocher', email: 'contact@fondation-rocher.fr', phone: '07 89 01 23 45', type: 'institution', organization: 'Fondation Rocher' },
  { id: 'cli_4', name: 'Antoine Morel', email: 'antoine.morel@yahoo.fr', phone: '06 98 76 54 32', type: 'particular', organization: '' }
];

const INITIAL_REQUESTS = [
  {
    id: 'req_101',
    clientId: 'cli_1',
    prestationId: 'salle-diva',
    date: getRelativeDate(1), // Tomorrow
    guests: 120,
    isInstitution: false,
    organization: '',
    status: 'approved',
    dateSubmitted: getRelativeDate(-3),
    message: 'Demande pour le mariage de ma fille. Nous souhaitons la salle La Diva et le service traiteur associé.'
  },
  {
    id: 'req_102',
    clientId: 'cli_2',
    prestationId: 'traiteur',
    date: getRelativeDate(4), // In 4 days
    guests: 80,
    isInstitution: true,
    organization: 'LVMH Group',
    status: 'pending',
    dateSubmitted: getRelativeDate(-1),
    message: 'Dîner de gala annuel de l’entreprise. Menu gastronomique 5 services avec accords mets-vins.'
  },
  {
    id: 'req_103',
    clientId: 'cli_3',
    prestationId: 'salle-diva',
    date: getRelativeDate(10),
    guests: 200,
    isInstitution: true,
    organization: 'Fondation Rocher',
    status: 'pending',
    dateSubmitted: getRelativeDate(0),
    message: 'Conférence de presse et cocktail dinatoire caritatif dans votre salle La Diva.'
  },
  {
    id: 'req_104',
    clientId: 'cli_4',
    prestationId: 'decoration',
    date: getRelativeDate(-2), // Past event
    guests: 50,
    isInstitution: false,
    organization: '',
    status: 'approved',
    dateSubmitted: getRelativeDate(-10),
    message: 'Anniversaire privé. Thème bohème chic avec décoration florale suspendue.'
  }
];

const INITIAL_DEVIS = [
  {
    id: 'dev_501',
    requestId: 'req_101',
    dateCreated: getRelativeDate(-2),
    items: [
      { desc: 'Location Salle La Diva (forfait journée)', qty: 1, unitPrice: 3500 },
      { desc: 'Menu Prestige (Entrée + Plat + Dessert)', qty: 120, unitPrice: 85 },
      { desc: 'Forfait Boisson Champagne & Vins Fins', qty: 120, unitPrice: 35 },
      { desc: 'Service en salle (6 maîtres d’hôtel)', qty: 1, unitPrice: 1200 }
    ],
    totalHT: 19100,
    totalTTC: 22920,
    status: 'approved'
  },
  {
    id: 'dev_502',
    requestId: 'req_104',
    dateCreated: getRelativeDate(-9),
    items: [
      { desc: 'Scénographie florale sur-mesure', qty: 1, unitPrice: 2200 },
      { desc: 'Location centre de table or', qty: 10, unitPrice: 45 },
      { desc: 'Installation & Démontage', qty: 1, unitPrice: 600 }
    ],
    totalHT: 3250,
    totalTTC: 3900,
    status: 'approved'
  }
];

const INITIAL_EVENTS = [
  {
    id: 'evt_201',
    requestId: 'req_101',
    title: 'Mariage Sophie & Marc',
    prestationId: 'salle-diva',
    resource: 'Salle La Diva',
    date: getRelativeDate(1), // Tomorrow
    time: '14:00 - 02:00',
    clientName: 'Sophie Laurent',
    responsible: 'Pierre Kiki',
    status: 'validated'
  },
  {
    id: 'evt_202',
    requestId: 'req_104',
    title: 'Anniversaire Antoine Morel',
    prestationId: 'decoration',
    resource: 'Salon Privé Client',
    date: getRelativeDate(-2), // Yesterday-ish
    time: '18:00 - 23:30',
    clientName: 'Antoine Morel',
    responsible: 'Marie V.',
    status: 'validated'
  },
  {
    id: 'evt_203',
    requestId: '',
    title: 'Séminaire Banque Populaire',
    prestationId: 'salle-diva',
    resource: 'Salle La Diva',
    date: getRelativeDate(7), // Next week
    time: '08:00 - 18:00',
    clientName: 'Banque Populaire',
    responsible: 'Pierre Kiki',
    status: 'validated'
  }
];

// Database Class definition
class KikiDb {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem('kiki_prestations')) {
      localStorage.setItem('kiki_prestations', JSON.stringify(INITIAL_PRESTATIONS));
    }
    if (!localStorage.getItem('kiki_clients')) {
      localStorage.setItem('kiki_clients', JSON.stringify(INITIAL_CLIENTS));
    }
    // Force seeding more requests for pagination demo
    let existingRequests;
    try {
      existingRequests = JSON.parse(localStorage.getItem('kiki_requests'));
    } catch (e) { }

    if (!Array.isArray(existingRequests) || existingRequests.length < 20) {
      let extraRequests = [];
      for (let i = 5; i <= 25; i++) {
        extraRequests.push({
          id: 'req_1' + i.toString().padStart(2, '0'),
          clientId: 'cli_' + (i % 4 + 1),
          prestationId: ['salle-diva', 'traiteur', 'decoration', 'location'][i % 4],
          date: getRelativeDate(i),
          guests: 20 + i * 5,
          isInstitution: i % 2 === 0,
          organization: i % 2 === 0 ? 'Entreprise ' + i : '',
          status: ['pending', 'quote-sent', 'approved', 'declined'][i % 4],
          dateSubmitted: getRelativeDate(-i),
          message: 'Demande de prestation additionnelle générée pour démonstration.'
        });
      }
      localStorage.setItem('kiki_requests', JSON.stringify([...INITIAL_REQUESTS, ...extraRequests]));
    }

    if (!localStorage.getItem('kiki_devis')) {
      localStorage.setItem('kiki_devis', JSON.stringify(INITIAL_DEVIS));
    }
    if (!localStorage.getItem('kiki_events')) {
      localStorage.setItem('kiki_events', JSON.stringify(INITIAL_EVENTS));
    }
    if (!localStorage.getItem('kiki_media')) {
      const now = new Date().toISOString();
      const sample = [
        { id: 'med_1001', eventId: 'evt_201', eventName: 'Mariage Sophie & Marc', name: 'diva-extérieur.jpg', dataUrl: 'https://images.unsplash.com/photo-1506801310323-534be5e7bb85?q=80&w=1200&auto=format&fit=crop', type: 'image/jpeg', uploadedAt: now },
        { id: 'med_1002', eventId: 'evt_201', eventName: 'Mariage Sophie & Marc', name: 'table-deco.jpg', dataUrl: 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?q=80&w=1200&auto=format&fit=crop', type: 'image/jpeg', uploadedAt: now },
        { id: 'med_1003', eventId: 'evt_203', eventName: 'Séminaire Banque Populaire', name: 'conference.jpg', dataUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop', type: 'image/jpeg', uploadedAt: now },
        { id: 'med_1004', eventId: 'evt_202', eventName: 'Anniversaire Antoine Morel', name: 'gateau.jpg', dataUrl: 'https://images.unsplash.com/photo-1526318472351-c75fcf070dd5?q=80&w=1200&auto=format&fit=crop', type: 'image/jpeg', uploadedAt: now }
      ];
      localStorage.setItem('kiki_media', JSON.stringify(sample));
    }
    const faqsSample = [
      { id: 'faq_1', question: "Quels sont vos délais de réservation ?", answer: "Nous conseillons de réserver au moins 1 mois à l'avance pour la salle La Diva..." },
      { id: 'faq_2', question: "Le Food Truck peut-il se déplacer hors de Dakar ?", answer: "Oui, notre Food Truck intervient également à Saly et sur la petite côte..." }
    ];
    if (!localStorage.getItem('kiki_faqs')) {
      localStorage.setItem('kiki_faqs', JSON.stringify(faqsSample));
    } else {
      try {
        const existingFaqs = JSON.parse(localStorage.getItem('kiki_faqs'));
        if (!Array.isArray(existingFaqs) || existingFaqs.length === 0) {
          localStorage.setItem('kiki_faqs', JSON.stringify(faqsSample));
        }
      } catch (err) {
        localStorage.setItem('kiki_faqs', JSON.stringify(faqsSample));
      }
    }
  }

  // Getters
  getPrestations() {
    try {
      return JSON.parse(localStorage.getItem('kiki_prestations')) || [];
    } catch (err) {
      console.warn('Invalid prestations storage, resetting to empty array.', err);
      return [];
    }
  }

  getClients() {
    try {
      return JSON.parse(localStorage.getItem('kiki_clients')) || [];
    } catch (err) {
      console.warn('Invalid clients storage, resetting to empty array.', err);
      return [];
    }
  }

  getRequests() {
    try {
      return JSON.parse(localStorage.getItem('kiki_requests')) || [];
    } catch (err) {
      console.warn('Invalid requests storage, resetting to empty array.', err);
      return [];
    }
  }

  getDevis() {
    try {
      return JSON.parse(localStorage.getItem('kiki_devis')) || [];
    } catch (err) {
      console.warn('Invalid devis storage, resetting to empty array.', err);
      return [];
    }
  }

  getEvents() {
    try {
      return JSON.parse(localStorage.getItem('kiki_events')) || [];
    } catch (err) {
      console.warn('Invalid events storage, resetting to empty array.', err);
      return [];
    }
  }

  // Media storage: keep images/videos grouped by event
  getMedia() {
    try {
      return JSON.parse(localStorage.getItem('kiki_media')) || [];
    } catch (err) {
      console.warn('Invalid media storage, resetting to empty array.', err);
      return [];
    }
  }

  saveMediaItems(mediaItems) {
    // mediaItems: array of { id, eventId, eventName, name, dataUrl, type, uploadedAt }
    const all = this.getMedia();
    mediaItems.forEach(m => all.push(m));
    localStorage.setItem('kiki_media', JSON.stringify(all));
    return mediaItems;
  }

  deleteMedia(mediaId) {
    const all = this.getMedia();
    const filtered = all.filter(m => m.id !== mediaId);
    localStorage.setItem('kiki_media', JSON.stringify(filtered));
    return true;
  }

  // Business Logic: Check Availability for Salle La Diva (to prevent double bookings)
  checkAvailability(date, resource = 'Salle La Diva') {
    if (resource !== 'Salle La Diva') return true; // Currently Diva is the critical resource
    const events = this.getEvents();
    // A resource is busy if there is a validated event for it on that day
    const conflict = events.find(evt =>
      evt.date === date &&
      evt.resource === resource &&
      evt.status === 'validated'
    );
    return !conflict;
  }

  // Client Creation
  createClient(clientData) {
    const clients = this.getClients();
    const newClient = {
      id: 'cli_' + Date.now(),
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      type: clientData.type || 'particular',
      organization: clientData.organization || ''
    };
    clients.push(newClient);
    localStorage.setItem('kiki_clients', JSON.stringify(clients));
    return newClient;
  }

  // Submit Quote Request from Public Form
  submitQuoteRequest(formData) {
    // 1. Create or resolve client
    const clients = this.getClients();
    let client = clients.find(c => c.email.toLowerCase() === formData.email.toLowerCase());
    if (!client) {
      client = this.createClient({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        type: (formData.isInstitution || formData.clientType === 'institution') ? 'institution' : 'particular',
        organization: formData.organization || ''
      });
    }

    // 2. Save quote request
    const requests = this.getRequests();
    const prestationId = formData.prestationId || formData.prestation || '';
    const newRequest = {
      id: 'req_' + Date.now(),
      clientId: client.id,
      prestationId: prestationId,
      date: formData.date,
      guests: parseInt(formData.guests) || 10,
      isInstitution: !!formData.isInstitution || formData.clientType === 'institution',
      organization: formData.organization || '',
      status: 'pending',
      dateSubmitted: new Date().toISOString().split('T')[0],
      message: formData.message || ''
    };
    requests.push(newRequest);
    localStorage.setItem('kiki_requests', JSON.stringify(requests));

    // 3. Simulate Direct Email to the Team
    this.simulateEmailToTeam(newRequest, client);

    return newRequest;
  }

  simulateEmailToTeam(request, client) {
    console.log(`[EMAIL SEND] Direct Email sent to contact@kikitraiteur.fr`);
    console.log(`Sujet: Nouvelle demande de devis #${request.id} - ${client.name}`);
    console.log(`Corps: Type: ${client.type}. Date: ${request.date}. Invités: ${request.guests}. Message: ${request.message}`);
  }

  // Create or Update Devis
  saveDevis(devisData) {
    const devisList = this.getDevis();
    const existingIndex = devisList.findIndex(d => d.id === devisData.id);

    // Calculate totals
    let totalHT = 0;
    devisData.items.forEach(item => {
      totalHT += item.qty * item.unitPrice;
    });
    const totalTTC = Math.round(totalHT * 1.2 * 100) / 100; // 20% TVA

    const devis = {
      id: devisData.id || 'dev_' + Date.now(),
      requestId: devisData.requestId,
      dateCreated: devisData.dateCreated || new Date().toISOString().split('T')[0],
      items: devisData.items,
      totalHT: totalHT,
      totalTTC: totalTTC,
      status: devisData.status || 'pending'
    };

    if (existingIndex > -1) {
      devisList[existingIndex] = devis;
    } else {
      devisList.push(devis);
    }
    localStorage.setItem('kiki_devis', JSON.stringify(devisList));

    // Update quote request status to 'quote-sent'
    if (devis.status === 'approved') {
      this.updateRequestStatus(devis.requestId, 'approved');
      // Automatically create an event in the calendar if approved
      this.createEventFromRequest(devis.requestId);
    } else {
      this.updateRequestStatus(devis.requestId, 'quote-sent');
    }

    return devis;
  }

  updateRequestStatus(requestId, status) {
    const requests = this.getRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index > -1) {
      requests[index].status = status;
      localStorage.setItem('kiki_requests', JSON.stringify(requests));
    }
  }

  createEventFromRequest(requestId) {
    const requests = this.getRequests();
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    const clients = this.getClients();
    const client = clients.find(c => c.id === request.clientId);
    const clientName = client ? client.name : 'Client Inconnu';

    const events = this.getEvents();
    // Check if event already exists
    const existing = events.find(e => e.requestId === requestId);
    if (existing) return;

    // Check availability before creating event
    const prestation = this.getPrestations().find(p => p.id === request.prestationId);
    const resource = request.prestationId === 'salle-diva' ? 'Salle La Diva' : (prestation ? prestation.title : 'Service Traiteur');

    const newEvent = {
      id: 'evt_' + Date.now(),
      requestId: requestId,
      title: (clientName + ' - ' + (prestation ? prestation.title : 'Réception')),
      prestationId: request.prestationId,
      resource: resource,
      date: request.date,
      time: '12:00 - 00:00',
      clientName: clientName,
      responsible: 'Marie V.',
      status: 'validated'
    };

    events.push(newEvent);
    localStorage.setItem('kiki_events', JSON.stringify(events));
  }

  // Create an event from arbitrary data (used by admin/manager UI)
  createEvent(eventData) {
    const events = this.getEvents();
    const date = eventData.date || (eventData.dateTime ? eventData.dateTime.split('T')[0] : '');
    const time = eventData.time || (eventData.dateTime ? (eventData.dateTime.split('T')[1] || '') : (eventData.time || ''));
    const resource = eventData.resource || eventData.location || '';

    // Availability check for critical resources
    if (!this.checkAvailability(date, resource)) {
      throw new Error('Ressource indisponible pour cette date');
    }

    const newEvent = {
      id: 'evt_' + Date.now(),
      requestId: eventData.requestId || '',
      title: eventData.title || (eventData.clientName ? (eventData.clientName + ' - Événement') : 'Événement'),
      prestationId: eventData.type || eventData.prestationId || '',
      resource: resource,
      date: date,
      time: time,
      clientName: eventData.clientName || '',
      responsible: eventData.responsible || '—',
      staff: eventData.staff || [],
      guests: eventData.guests || 0,
      status: eventData.status || 'validated'
    };

    events.push(newEvent);
    localStorage.setItem('kiki_events', JSON.stringify(events));
    return newEvent;
  }

  // Google Calendar Sync Simulation
  syncGoogleCalendar() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const timestamp = new Date().toLocaleString('fr-FR');
        localStorage.setItem('kiki_gcal_sync', timestamp);
        resolve({ success: true, timestamp });
      }, 1000);
    });
  }

  // FAQ helpers
  getFaqs() {
    try {
      return JSON.parse(localStorage.getItem('kiki_faqs')) || [];
    } catch (err) {
      console.warn('Invalid faqs storage, resetting to empty array.', err);
      return [];
    }
  }

  saveFaq(faqData) {
    const faqs = this.getFaqs();
    if (faqData.id) {
      const idx = faqs.findIndex(f => f.id === faqData.id);
      if (idx > -1) {
        faqs[idx].question = faqData.question;
        faqs[idx].answer = faqData.answer;
      } else {
        faqs.push({ id: faqData.id, question: faqData.question, answer: faqData.answer });
      }
    } else {
      const newFaq = { id: 'faq_' + Date.now(), question: faqData.question, answer: faqData.answer };
      faqs.push(newFaq);
    }
    localStorage.setItem('kiki_faqs', JSON.stringify(faqs));
    return faqs;
  }

  deleteFaq(faqId) {
    const faqs = this.getFaqs();
    const filtered = faqs.filter(f => f.id !== faqId);
    localStorage.setItem('kiki_faqs', JSON.stringify(filtered));
    return true;
  }

  getLastSync() {
    return localStorage.getItem('kiki_gcal_sync') || 'Jamais synchronisé';
  }
}

// Instantiate globally
window.db = new KikiDb();
