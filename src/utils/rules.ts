import { Verb } from '../types';

export function getUsage(formName: string): string {
  switch (formName) {
    case 'Te-Form': return "Used to connect simultaneous or sequential actions, events, or states. Also forms expressions such as requests, actions happening currently, and can combine with other forms to create different tenses, though it does not indicate tense by itself.";
    case 'Past Tense (Plain)': return "Used to state actions or events completed in the past in casual speech, or to modify nouns as a relative clause.";
    case 'Negative Form': return "Used to state that an action will not happen or is not a habitual action in casual speech.";
    case 'Past-Negative Form': return "Used to state that an action did not happen in the past in casual speech.";
    case 'Polite Form': return "Used in formal situations, when speaking to someone of higher status, or someone you don't know well (Masu form).";
    case 'Masu Stem': return "The base form used to connect to other suffixes (like -tai for desire, -nasai for commands), combine with other verbs, or sometimes function as a noun.";
    case 'Continuous Form': return "Used to express an ongoing action (present progressive, like '-ing' in English) or a continuing state resulting from an action.";
    case 'Passive Form': return "Used when the subject is the receiver of an action. In Japanese, it often implies the subject is adversely affected by the action.";
    case 'Causative Form': return "Used to indicate making someone do something (force) or letting someone do something (permission).";
    case 'Causative Passive Form': return "Used to indicate being made to do something against one's will by someone else.";
    case 'Imperative Form': return "A strong, blunt command form. Used in emergencies, by men in very casual speech, or when quoting a command.";
    case 'BA Hypothetical Form': return "Used to express a condition ('if X happens...'). Often used when a positive or natural outcome is expected if the condition is met.";
    case 'TARA Conditional Form': return "Used to express a condition or sequence ('if/when X happens, then Y'). It is highly versatile and focuses on the sequence of events.";
    case 'Potential Form': return "Used to express the physical ability to do something ('can do') or the possibility of an action.";
    case 'Volitional Form': return "Used to express the speaker's intention, propose an action to a group ('let's...'), or offer to do something in casual speech.";
    default: return "Usage for this form is not documented.";
  }
}

export function getApplication(verb: Verb): string {
  let baseKanji = verb.dictionary_kanji.slice(0, -1);
  let suffixKanji = verb.conj_kanji.slice(baseKanji.length);
  
  if (verb.verb_class === 'Irregular-suru') {
    if (verb.dictionary_kanji === 'する') {
      baseKanji = '';
    } else if (verb.dictionary_kanji.endsWith('する')) {
      baseKanji = verb.dictionary_kanji.slice(0, -2);
    }
    suffixKanji = verb.conj_kanji.slice(baseKanji.length);
  }
  
  // 行く exception
  if (verb.dictionary_kanji === '行く' && (verb.form_name === 'Te-Form' || verb.form_name === 'Past Tense (Plain)')) {
     baseKanji = '行';
     suffixKanji = verb.conj_kanji.slice(1);
  }

  // Fallback for kana-only verbs where kanji slicing fails to match
  if (!verb.conj_kanji.startsWith(baseKanji) && baseKanji !== '') {
     return `${verb.dictionary_kanji} -> ${verb.conj_kanji} (${verb.conj_kana})`;
  }

  let equation = `${baseKanji} + ${suffixKanji}`;
  if (baseKanji === '') equation = suffixKanji;

  return `${verb.dictionary_kanji} -> ${equation} = ${verb.conj_kanji} (${verb.conj_kana})`;
}

export function getRule(verbClass: string, formName: string, kanji: string): string {
  if (kanji === '行く' && (formName === 'Te-Form' || formName === 'Past Tense (Plain)')) {
    return `EXCEPTION: Normally a Godan-ku verb becomes 'いて' (ite) / 'いた' (ita), but '行く' is highly irregular and becomes '行って' (itte) / '行った' (itta).`;
  }

  const isIchidan = verbClass === 'Ichidan';
  const isSuru = verbClass === 'Irregular-suru';
  const isKuru = verbClass === 'Irregular-kuru';
  const isGodan = verbClass.startsWith('Godan');

  switch (formName) {
    case 'Te-Form':
    case 'Past Tense (Plain)':
      const suffix = formName === 'Te-Form' ? 'te' : 'ta';
      const dSuffix = formName === 'Te-Form' ? 'de' : 'da';
      
      switch (verbClass) {
        case 'Ichidan': return `Drop the final 'ru' and add '${suffix}'.`;
        case 'Godan-ku': return `Drop the final 'ku' and add 'i${suffix}'.`;
        case 'Godan-gu': return `Drop the final 'gu' and add 'i${dSuffix}'.`;
        case 'Godan-su': return `Drop the final 'su' and add 'shi${suffix}'.`;
        case 'Godan-tsu':
        case 'Godan-ru':
        case 'Godan-u': return `Drop the final syllable and add a sokuon (small tsu: 'っ') plus '${suffix}'.`;
        case 'Godan-nu':
        case 'Godan-bu':
        case 'Godan-mu': return `Drop the final syllable and add 'n${dSuffix}' (んで/んだ).`;
        case 'Irregular-suru': return `Irregular: 'suru' becomes 'shi${suffix}'.`;
        case 'Irregular-kuru': return `Irregular: 'kuru' becomes 'ki${suffix}'.`;
        default: return `Check the specific grammar rules for ${verbClass} verbs.`;
      }

    case 'Polite Form':
    case 'Masu Stem':
      const isStem = formName === 'Masu Stem';
      const masu = isStem ? '' : 'masu';
      if (isIchidan) return `Drop the final 'ru' and add '${isStem ? 'nothing (this is the stem)' : 'masu'}'.`;
      if (isGodan) return `Change the final 'u' vowel sound to the corresponding 'i' vowel sound${isStem ? '.' : ', then add ' + masu + '.'}`;
      if (isSuru) return `'suru' becomes 'shi${masu}'.`;
      if (isKuru) return `'kuru' becomes 'ki${masu}'.`;
      break;

    case 'Negative Form':
    case 'Past-Negative Form':
      const negSuffix = formName === 'Negative Form' ? 'nai' : 'nakatta';
      if (isIchidan) return `Drop the final 'ru' and add '${negSuffix}'.`;
      if (verbClass === 'Godan-u') return `Change the final 'u' to 'wa', then add '${negSuffix}'.`;
      if (isGodan) return `Change the final 'u' vowel sound to the corresponding 'a' vowel sound, then add '${negSuffix}'.`;
      if (isSuru) return `'suru' becomes 'shi${negSuffix}'.`;
      if (isKuru) return `'kuru' becomes 'ko${negSuffix}'.`;
      break;

    case 'Continuous Form':
      return `Create the Te-Form of the verb, then add 'iru' (or 'imasu' for polite).`;

    case 'Passive Form':
      if (isIchidan) return `Drop the final 'ru' and add 'rareru'.`;
      if (verbClass === 'Godan-u') return `Change the final 'u' to 'wa', then add 'reru'.`;
      if (isGodan) return `Change the final 'u' vowel sound to 'a', then add 'reru'.`;
      if (isSuru) return `'suru' becomes 'sareru'.`;
      if (isKuru) return `'kuru' becomes 'korareru'.`;
      break;

    case 'Causative Form':
      if (isIchidan) return `Drop the final 'ru' and add 'saseru'.`;
      if (verbClass === 'Godan-u') return `Change the final 'u' to 'wa', then add 'seru'.`;
      if (isGodan) return `Change the final 'u' vowel sound to 'a', then add 'seru'.`;
      if (isSuru) return `'suru' becomes 'saseru'.`;
      if (isKuru) return `'kuru' becomes 'kosaseru'.`;
      break;

    case 'Causative Passive Form':
      if (isIchidan) return `Drop the final 'ru' and add 'saserareru'.`;
      if (verbClass === 'Godan-su') return `Change 'su' to 'sa', then add 'serareru' (cannot be shortened).`;
      if (verbClass === 'Godan-u') return `Change 'u' to 'wa', then add 'serareru' (or shortened to 'sareru').`;
      if (isGodan) return `Change the final 'u' vowel to 'a', then add 'serareru' (often shortened to 'sareru').`;
      if (isSuru) return `'suru' becomes 'saserareru'.`;
      if (isKuru) return `'kuru' becomes 'kosaserareru'.`;
      break;

    case 'Imperative Form':
      if (isIchidan) return `Drop the final 'ru' and add 'ro'.`;
      if (isGodan) return `Change the final 'u' vowel sound to the corresponding 'e' vowel sound.`;
      if (isSuru) return `'suru' becomes 'shiro' (or 'seyo').`;
      if (isKuru) return `'kuru' becomes 'koi'.`;
      break;

    case 'BA Hypothetical Form':
      if (isIchidan) return `Drop the final 'ru' and add 'reba'.`;
      if (isGodan) return `Change the final 'u' vowel sound to the corresponding 'e' vowel sound, then add 'ba'.`;
      if (isSuru) return `'suru' becomes 'sureba'.`;
      if (isKuru) return `'kuru' becomes 'kureba'.`;
      break;

    case 'TARA Conditional Form':
      return `Create the Past Tense (Plain) form of the verb (Ta-form), then add 'ra'.`;

    case 'Potential Form':
      if (isIchidan) return `Drop the final 'ru' and add 'rareru' (or colloquially 'reru').`;
      if (isGodan) return `Change the final 'u' vowel sound to the corresponding 'e' vowel sound, then add 'ru'.`;
      if (isSuru) return `'suru' becomes 'dekiru' (Irregular).`;
      if (isKuru) return `'kuru' becomes 'korareru'.`;
      break;

    case 'Volitional Form':
      if (isIchidan) return `Drop the final 'ru' and add 'you'.`;
      if (isGodan) return `Change the final 'u' vowel sound to the corresponding 'o' vowel sound, then add 'u'.`;
      if (isSuru) return `'suru' becomes 'shiyou'.`;
      if (isKuru) return `'kuru' becomes 'koyou'.`;
      break;

    default:
      return `Morphology rule for ${verbClass} -> ${formName} is not yet documented in the databanks.`;
  }
}
