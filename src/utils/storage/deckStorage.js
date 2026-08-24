import { vocabStorage } from './vocabStorage.js';

const KEY_VOCAB = "eng_app_saved_vocab";
const KEY_CUSTOM_DECKS = "eng_app_custom_decks";

export const deckStorage = {
  getCustomDecks: () => {
    try {
      if (typeof localStorage === 'undefined') return [];
      const data = localStorage.getItem(KEY_CUSTOM_DECKS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading custom decks", e);
      return [];
    }
  },

  saveCustomDeck: (deckObj) => {
    try {
      const list = deckStorage.getCustomDecks();
      const filtered = list.filter(d => d.id !== deckObj.id);
      const updated = [...filtered, deckObj];
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(KEY_CUSTOM_DECKS, JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      console.error("Error saving custom deck", e);
      return [];
    }
  },

  deleteCustomDeck: (deckId) => {
    try {
      const list = deckStorage.getCustomDecks();
      const updated = list.filter(d => d.id !== deckId);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(KEY_CUSTOM_DECKS, JSON.stringify(updated));
      }

      // Clear deck field from words in this deck
      const vocab = vocabStorage.getSavedVocab();
      const updatedVocab = vocab.map(item => {
        if (item.deckId === deckId) {
          const { deckId: _, deckName: __, ...rest } = item;
          return rest;
        }
        return item;
      });

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(KEY_VOCAB, JSON.stringify(updatedVocab));
      }

      return updated;
    } catch (e) {
      console.error("Error deleting custom deck", e);
      return [];
    }
  }
};
