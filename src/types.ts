export interface Verb {
  id: number;
  dictionary_kanji: string;
  dictionary_kana: string;
  dictionary_romaji: string;
  meaning: string;
  form_name: string;
  conj_kanji: string;
  conj_kana: string;
  conj_romaji: string;
  correct_count: number;
  attempt_count: number;
  is_active: number;
}