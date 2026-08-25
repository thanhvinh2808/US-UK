import { vocabStorage } from './vocabStorage.js';
import { getScopedKey, isUserScope } from './storageScope.js';

const BASE_KEY_CUSTOM_DECKS = 'custom_decks';
const LEGACY_KEY_CUSTOM_DECKS = 'eng_app_custom_decks';

export const deckStorage = {
  getCustomDecks: (explicitUserId = undefined) => {
    try {
      if (typeof localStorage === 'undefined') return [];
      const key = getScopedKey(BASE_KEY_CUSTOM_DECKS, explicitUserId);
      let data = localStorage.getItem(key);

      // Controlled fallback: If guest has no data yet, check legacy un-scoped key
      if (!data && !isUserScope() && explicitUserId === undefined) {
        const legacyData = localStorage.getItem(LEGACY_KEY_CUSTOM_DECKS);
        if (legacyData) {
          data = legacyData;
        }
      }

      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Recovered from corrupted custom decks JSON:', e.message);
      return [];
    }
  },

  saveCustomDeck: (deckObj) => {
    try {
      if (!deckObj || typeof deckObj !== 'object' || !deckObj.id) {
        return deckStorage.getCustomDecks();
      }
      const list = deckStorage.getCustomDecks();
      const filtered = list.filter(d => d && d.id !== deckObj.id);
      const updated = [...filtered, deckObj];
      if (typeof localStorage !== 'undefined') {
        const key = getScopedKey(BASE_KEY_CUSTOM_DECKS);
        localStorage.setItem(key, JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      console.error('Error saving custom deck', e);
      return [];
    }
  },

  deleteCustomDeck: (deckId) => {
    try {
      if (!deckId) return deckStorage.getCustomDecks();
      const list = deckStorage.getCustomDecks();
      const updated = list.filter(d => d && d.id !== deckId);
      if (typeof localStorage !== 'undefined') {
        const key = getScopedKey(BASE_KEY_CUSTOM_DECKS);
        localStorage.setItem(key, JSON.stringify(updated));
      }

      // Clear deck field from words in this deck
      const vocab = vocabStorage.getSavedVocab();
      const updatedVocab = vocab.map(item => {
        if (item && item.deckId === deckId) {
          const { deckId: _, deckName: __, ...rest } = item;
          return rest;
        }
        return item;
      });

      vocabStorage.setSavedVocabDirect(updatedVocab);

      return updated;
    } catch (e) {
      console.error('Error deleting custom deck', e);
      return [];
    }
  }
};

export default deckStorage;
