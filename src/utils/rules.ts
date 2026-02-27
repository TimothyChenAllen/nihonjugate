export function getRule(verbClass: string, formName: string, kanji: string): string {
  // Edge Case Intercept: 行く exception (Now using single quotes for the parser)
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